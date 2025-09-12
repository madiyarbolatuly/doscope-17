// src/services/durableUpload.ts
import axios, { AxiosError } from "axios";

export type ProgressCb = (percent: number) => void;

type UploadUrls = { base: string; folderId?: string | null; projectRootId?: string | null };

type DurableOpts = {
  targetBatchMB?: number;         // целевой размер батча
  maxFilesPerBatch?: number;      // лимит по количеству файлов в батче
  concurrency?: number;           // параллельные запросы
  onProgress?: ProgressCb;        // общий прогресс 0..100
  timeoutMs?: number;             // таймаут одного запроса
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function makeBatches(
  files: File[],
  targetBytes: number,
  maxFilesPerBatch: number
): File[][] {
  const batches: File[][] = [];
  let cur: File[] = [];
  let acc = 0;
  for (const f of files) {
    const s = f.size || 0;
    if (
      cur.length > 0 &&
      (acc + s > targetBytes || cur.length >= maxFilesPerBatch)
    ) {
      batches.push(cur);
      cur = [];
      acc = 0;
    }
    cur.push(f);
    acc += s;
  }
  if (cur.length) batches.push(cur);
  return batches;
}

function splitBatch(batch: File[]): [File[], File[]] {
  if (batch.length <= 1) return [batch, []];
  const mid = Math.floor(batch.length / 2);
  return [batch.slice(0, mid), batch.slice(mid)];
}

function shouldRetry(e: any): { retry: boolean; hard?: boolean } {
  const err = e as AxiosError;
  const status = err.response?.status;

  // сетевые / таймауты
  if (err.code === "ECONNABORTED" || err.message?.includes("Network Error")) {
    return { retry: true };
  }

  // 5xx и 408/429 — пробуем ретрай
  if (status && (status >= 500 || status === 408 || status === 429)) {
    return { retry: true };
  }

  // 401 — токен умер, это «жёсткая» ошибка (прерываем с инфо)
  if (status === 401) {
    return { retry: false, hard: true };
  }

  // остальное — не ретраим
  return { retry: false };
}

async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  onBeforeRetry?: (attempt: number, err: any) => Promise<void> | void
): Promise<T> {
  let attempt = 0;
  // jittered exponential backoff: 0.5s, 1s, 2s, 4s...
  while (true) {
    try {
      return await fn();
    } catch (e) {
      const { retry, hard } = shouldRetry(e);
      if (!retry || attempt >= maxRetries || hard) throw e;
      const delay = (500 * 2 ** attempt) + Math.floor(Math.random() * 250);
      await onBeforeRetry?.(attempt, e);
      await sleep(delay);
      attempt++;
    }
  }
}

export async function durableUploadFolder(
  files: File[],
  token: string,
  urls: UploadUrls,
  opts?: DurableOpts
) {
  const targetBatchBytes = (opts?.targetBatchMB ?? 100) * 1024 * 1024;
  const maxFilesPerBatch = opts?.maxFilesPerBatch ?? 250; // 5000 файлов => ~20 батчей
  const concurrency = clamp(opts?.concurrency ?? 3, 1, 6);
  const timeoutMs = opts?.timeoutMs ?? 10 * 60 * 1000; // 10 минут на батч
  const onOverall = opts?.onProgress;

  const sessionId = crypto?.randomUUID?.() ?? String(Date.now());
  const allBytes = files.reduce((s, f) => s + (f.size || 0), 0);

  // формируем батчи по размеру и количеству
  let batches = makeBatches(files, targetBatchBytes, maxFilesPerBatch);

  // прогресс: общий загруженный объём
  const uploadedRef = { bytes: 0 };          // завершённые батчи
  const inFlightRef = new Map<number, number>(); // partial per-batch loaded

  let url = `${urls.base}/upload-folder-bulk`;
  if (urls.folderId) {
    url += `?parent_id=${urls.folderId}`;
  } else if (urls.projectRootId) {
    url += `?parent_id=${urls.projectRootId}`;
  }
  // else → root, без parent_id
  

  // безопасный пересчёт общего прогресса с учётом параллельных батчей
  const report = () => {
    const partial = Array.from(inFlightRef.values()).reduce((a, b) => a + b, 0);
    const pct = allBytes ? Math.round(((uploadedRef.bytes + partial) / allBytes) * 100) : 0;
    onOverall?.(clamp(pct, 0, 100));
  };

  async function postBatch(batch: File[], batchIndex: number): Promise<void> {
    const batchBytes = batch.reduce((s, f) => s + (f.size || 0), 0);
    const idempotencyKey = `${sessionId}:${batchIndex}:${batchBytes}`;

    const fd = new FormData();
    for (const f of batch) {
      const rp = (f as any).relativePath || (f as any).webkitRelativePath || f.name;
      fd.append("files", f, rp);
    }

    // пер-батч прогресс → общий прогресс
    inFlightRef.set(batchIndex, 0);
    report();

    try {
      await withBackoff(
        async () => {
          await axios.post(url, fd, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
              "X-Upload-Session": sessionId,       // сервер может логировать
              "Idempotency-Key": idempotencyKey,   // точно-однажды семантика при ретраях
            },
            timeout: timeoutMs,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            onUploadProgress: (p) => {
              const loaded = p.loaded ?? 0;
              inFlightRef.set(batchIndex, loaded);
              report();
            },
            // IMPORTANT: если используешь AbortController — добавь signal
          })
          .then(res => {
            // минимальная валидация ответа
            const ok = res.status >= 200 && res.status < 300;
            const accepted = (res.data?.accepted ?? batch.length);
            if (!ok || accepted < batch.length) {
              const msg = `Server accepted ${accepted}/${batch.length} files`;
              const err: any = new Error(msg);
              err.response = { status: res.status };
              throw err;
            }
          })
          .catch(async (err: AxiosError) => {
            // 413 — слишком большой батч => делим пополам (адаптивное разбиение)
            if (err.response?.status === 413) {
              const [a, b] = splitBatch(batch);
              if (b.length === 0) throw err;
              // рекурсивно грузим две половинки последовательно
              await postBatch(a, batchIndex * 2); // уникализируем индексы
              await postBatch(b, batchIndex * 2 + 1);
              // пометим как завершённый (этот узел «разложился» на два)
              inFlightRef.delete(batchIndex);
              return;
            }
            throw err;
          });
        },
        4, // максимум 5 попыток
        async (attempt, _err) => {
          // перед ретраем обнулим локальный прогресс батча, чтобы не «зависал»
          inFlightRef.set(batchIndex, 0);
          report();
        }
      );

      // если дошли сюда, батч (или его рекурсивные половинки) загружены
      uploadedRef.bytes += batchBytes;
    } finally {
      inFlightRef.delete(batchIndex);
      report();
    }
  }

  // пул воркеров
  let cursor = 0;
  const workers: Promise<void>[] = [];
  for (let c = 0; c < concurrency; c++) {
    workers.push((async function worker() {
      while (cursor < batches.length) {
        const i = cursor++;
        const chunk = batches[i];
        if (!chunk) break;
        await postBatch(chunk, i);
      }
    })());
  }

  await Promise.all(workers);

  // финальный прогресс
  onOverall?.(100);
}
