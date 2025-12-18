// src/services/durableUpload.ts
import axios, { AxiosError } from "axios";

/** Колбэк прогресса: 0..100 (%) */
export type ProgressCb = (percent: number) => void;

/** Куда грузим */
export type UploadUrls = {
  base: string | number;           // например: "/api/v2"
  folderId?: string | number;      // id целевой папки
  projectRootId?: string | number; // альтернативный корневой id (если так удобнее)
};

/** Настройки загрузчика */
type DurableOpts = {
  targetBatchMB?: number;    // целевой размер пачки, по умолчанию 100 МБ
  maxFilesPerBatch?: number; // максимум файлов в одной пачке, по умолчанию 250
  concurrency?: number;      // параллельных запросов, по умолчанию 3 (1..6)
  onProgress?: ProgressCb;   // общий прогресс в процентах
  timeoutMs?: number;        // таймаут запроса, по умолчанию 10 мин
};

/* ────────────────────────────────────────────────────────────────────────────
   Простые утилиты
   ──────────────────────────────────────────────────────────────────────────── */
const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Повтор с экспоненциальной паузой и джиттером */
async function withBackoff<T>(
  fn: () => Promise<T>,
  retries = 4,
  onRetryReset?: () => Promise<void> | void
): Promise<T> {
  let delay = 500; // 0.5 c старт
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      await onRetryReset?.();
      // джиттер: 50–150% от текущей задержки
      const wait = delay * (0.5 + Math.random());
      await sleep(wait);
      delay = Math.min(delay * 2, 8000); // верхняя граница 8 c
    }
  }
}

/** Разбить массив пополам (для 413 Payload Too Large) */
function splitBatch<T>(batch: T[]): [T[], T[]] {
  const mid = Math.max(1, Math.floor(batch.length / 2));
  return [batch.slice(0, mid), batch.slice(mid)];
}

/** Сформировать пачки по размеру и количеству */
function makeBatches(
  files: File[],
  targetBatchBytes: number,
  maxFilesPerBatch: number
): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;

  for (const f of files) {
    const size = f.size || 0;
    const tooManyFiles = current.length >= maxFilesPerBatch;
    const tooBigBySize = currentBytes + size > targetBatchBytes;

    if ((tooManyFiles || tooBigBySize) && current.length > 0) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }

    // Даже если файл сам больше targetBatchBytes — кладем его один в пачку
    current.push(f);
    currentBytes += size;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

/* ────────────────────────────────────────────────────────────────────────────
   Основная функция: надежная загрузка папки/набора файлов пачками
   ──────────────────────────────────────────────────────────────────────────── */
export async function durableUploadFolder(
  files: File[],
  token: string,
  urls: UploadUrls,
  opts?: DurableOpts
) {
  const targetBatchBytes = (opts?.targetBatchMB ?? 100) * 1024 * 1024;
  const maxFilesPerBatch = opts?.maxFilesPerBatch ?? 250;
  const concurrency = clamp(opts?.concurrency ?? 3, 1, 6);
  const timeoutMs = opts?.timeoutMs ?? 10 * 60 * 1000;
  const onOverall = opts?.onProgress;

  // Идентификатор сессии + общий объем
  const sessionId =
    (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());
  const allBytes = files.reduce((s, f) => s + (f.size || 0), 0);

  // Разбивка на пачки
  let batches = makeBatches(files, targetBatchBytes, maxFilesPerBatch);

  // Прогресс: сколько уже ушло и сколько в процессе
  const uploadedRef = { bytes: 0 };
  const inFlightRef = new Map<number, number>(); // batchIndex -> загружено байт

  // Формируем URL
  const base = String(urls.base).replace(/\/$/, "");
  const fid = urls.folderId != null ? String(urls.folderId) : undefined;
  const pid = urls.projectRootId != null ? String(urls.projectRootId) : undefined;

  let url = `${base}/upload-folder-bulk`;
  const qs = new URLSearchParams();
  if (fid) qs.set("parent_id", fid);
  else if (pid) qs.set("parent_id", pid);
  if (qs.toString()) url += `?${qs.toString()}`;

  // Сообщить общий прогресс
  const report = () => {
    const partial = Array.from(inFlightRef.values()).reduce((a, b) => a + b, 0);
    const pct = allBytes
      ? Math.round(((uploadedRef.bytes + partial) / allBytes) * 100)
      : (files.length ? Math.round(((batches.length - inFlightRef.size) / batches.length) * 100) : 100);
    onOverall?.(clamp(pct, 0, 100));
  };

  /** Загрузка одной пачки с ретраями и расколом при 413 */
  async function postBatch(batch: File[], batchIndex: number): Promise<void> {
    const batchBytes = batch.reduce((s, f) => s + (f.size || 0), 0);
    const idempotencyKey = `${sessionId}:${batchIndex}:${batchBytes}`;

    const fd = new FormData();
    for (const f of batch) {
      const rp =
        (f as any).relativePath ||
        (f as any).webkitRelativePath ||
        f.name;
      fd.append("files", f, rp);
    }

    inFlightRef.set(batchIndex, 0);
    report();

    try {
      await withBackoff(
        async () => {
          await axios
            .post(url, fd, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
                "X-Upload-Session": sessionId,
                "Idempotency-Key": idempotencyKey,
              },
              timeout: timeoutMs,
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
              onUploadProgress: (p) => {
                const loaded = p.loaded ?? 0;
                inFlightRef.set(batchIndex, loaded);
                report();
              },
            })
            .then((res) => {
              const ok = res.status >= 200 && res.status < 300;
              const accepted = res.data?.accepted ?? batch.length;
              if (!ok || accepted < batch.length) {
                const err: any = new Error(
                  `Сервер принял ${accepted}/${batch.length} файлов`
                );
                err.response = { status: res.status };
                throw err;
              }
            })
            .catch(async (err: AxiosError) => {
              // Слишком большой запрос — делим пачку и пробуем по частям
              if (err.response?.status === 413 && batch.length > 1) {
                const [a, b] = splitBatch(batch);
                await postBatch(a, batchIndex * 2);
                await postBatch(b, batchIndex * 2 + 1);
                inFlightRef.delete(batchIndex);
                return;
              }
              throw err;
            });
        },
        4,
        async () => {
          // Сбросим счетчик «в полете» перед новой попыткой
          inFlightRef.set(batchIndex, 0);
          report();
        }
      );

      uploadedRef.bytes += batchBytes;
    } finally {
      inFlightRef.delete(batchIndex);
      report();
    }
  }

  /** Простой пул: параллельно грузим до `concurrency` пачек */
  async function runBatches(): Promise<void> {
    if (batches.length === 0) {
      onOverall?.(100);
      return;
    }

    let next = 0;
    let active = 0;
    let resolved = 0;

    return new Promise<void>((resolve, reject) => {
      const launch = () => {
        while (active < concurrency && next < batches.length) {
          const idx = next++;
          active++;
          postBatch(batches[idx], idx)
            .then(() => {
              active--;
              resolved++;
              if (resolved === batches.length) {
                resolve();
              } else {
                launch();
              }
            })
            .catch(reject);
        }
      };
      launch();
    });
  }

  await runBatches();
  onOverall?.(100);
}
