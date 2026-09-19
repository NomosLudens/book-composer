import { useEffect, useMemo, useRef, useState } from "react";
import type { Book, Block } from "./types";
import type { EditorialUnit, PaginationMeasurement } from "./editorial-units";
import { BlockRenderer } from "./renderer/BlockRenderer";
import { BookRoot } from "./renderer/BookRoot";

export interface MeasurementSurfaceProps {
  book: Book;
  units: EditorialUnit[];
  blocksByUnit: Map<string, Block[]>;
  onMeasured: (measurements: Map<string, PaginationMeasurement>) => void;
}

const MEASUREMENT_BATCH_SIZE = 100;

export function EditorialMeasurementSurface({ book, units, blocksByUnit, onMeasured }: MeasurementSurfaceProps) {
  const visibleUnits = useMemo(() => units.filter((unit) => (blocksByUnit.get(unit.id)?.length ?? 0) > 0), [units, blocksByUnit]);
  const [batchIndex, setBatchIndex] = useState(0);
  const measurementsRef = useRef(new Map<string, PaginationMeasurement>());
  const fontReadyRef = useRef(false);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const batchStart = batchIndex * MEASUREMENT_BATCH_SIZE;
  const batchEnd = Math.min(visibleUnits.length, (batchIndex + 1) * MEASUREMENT_BATCH_SIZE);
  // Render one unit of overlap so the last unit in a batch is measured with
  // the same following margin it has in the final continuous page flow.
  const batch = visibleUnits.slice(batchStart, Math.min(visibleUnits.length, batchEnd + 1));
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!fontReadyRef.current && document.fonts?.ready) {
        await document.fonts.ready;
        fontReadyRef.current = true;
      }
      if (cancelled) return;
      const readStart = performance.now();
      for (let index = 0; index < Math.min(MEASUREMENT_BATCH_SIZE, batch.length); index += 1) {
        const unit = batch[index]!;
        const elements = [...document.querySelectorAll<HTMLElement>(`[data-editorial-unit-id="${CSS.escape(unit.id)}"]`)];
        if (!elements.length) continue;
        const first = elements[0]!.getBoundingClientRect();
        const last = elements.at(-1)!.getBoundingClientRect();
        const nextUnit = batch[index + 1];
        const nextElements = nextUnit
          ? [...document.querySelectorAll<HTMLElement>(`[data-editorial-unit-id="${CSS.escape(nextUnit.id)}"]`)]
          : [];
        const nextTop = nextElements[0]?.getBoundingClientRect().top;
        const end = nextTop === undefined ? last.bottom : nextTop;
        const height = end - first.top;
        if (height > 0 && first.width > 0) measurementsRef.current.set(unit.id, { height, width: first.width });
      }
      if (cancelled) return;
      const nextBatch = batchIndex + 1;
      const batchCount = Math.ceil(visibleUnits.length / MEASUREMENT_BATCH_SIZE);
      console.info(`[book-composer] measurement batch ${nextBatch}/${batchCount} read in ${Math.round(performance.now() - readStart)}ms`);
      if (nextBatch >= batchCount) onMeasured(new Map(measurementsRef.current));
      else requestAnimationFrame(() => { if (!cancelled) setBatchIndex(nextBatch); });
    })();
    return () => { cancelled = true; };
  }, [batch, batchIndex, onMeasured, visibleUnits]);
  return (
    <div aria-hidden="true" className="k-editorial-measurement-surface">
      <BookRoot tokens={book.tokens} fonts={book.fonts}>
        <div className="k-page k-page--narrative k-editorial-measurement-page">
          <div className="k-page__content">
            <div className="k-flow">
              {batch.flatMap((unit) => (blocksByUnit.get(unit.id) ?? []).map((block) => (
                <BlockRenderer key={block.id} block={block} editorialUnitId={unit.id} />
              )))}
            </div>
          </div>
        </div>
      </BookRoot>
    </div>
  );
}
