// src/components/DocList.tsx
import React, { useRef, ReactNode, CSSProperties, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type DocListProps<T> = {
  items: T[];
  rowHeight?: number;               // приблизительная высота строки
  overscan?: number;                // сколько строк дорисовывать вне вьюпорта
  className?: string;               // классы контейнера
  style?: CSSProperties;            // стили контейнера
  renderRow: (item: T, index: number) => ReactNode; // как рисовать строку
  onNearEnd?: () => void;           // колбэк, когда подходим к концу (для догрузки)
  nearEndOffset?: number;           // запустим onNearEnd, когда останется N элементов
};

export function DocList<T>({
  items,
  rowHeight = 56,
  overscan = 10,
  className = "h-[calc(100vh-180px)] overflow-auto",
  style,
  renderRow,
  onNearEnd,
  nearEndOffset = 10,
}: DocListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const total = rowVirtualizer.getTotalSize();

  // Если нужно догружать по мере приближения к концу — делаем здесь,
  // чтобы не городить отдельный IntersectionObserver.
  useEffect(() => {
    if (!onNearEnd || items.length === 0) return;
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    const thresholdIndex = Math.max(0, items.length - nearEndOffset);
    if (last.index >= thresholdIndex) onNearEnd();
  }, [virtualItems, items.length, nearEndOffset, onNearEnd]);

  return (
    <div ref={parentRef} className={className} style={style}>
      <div style={{ height: total, position: "relative" }}>
        {virtualItems.map(v => {
          const item = items[v.index];
          return (
            <div
              key={(item as any)?.id ?? v.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${v.start}px)`,
                height: v.size,
              }}
              className="px-3"
            >
              {renderRow(item, v.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
