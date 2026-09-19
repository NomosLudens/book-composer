import { useEffect, useRef, useState } from "react";
import type { Book, Page } from "../../book/types";
import { BookRoot } from "../../book/renderer/BookRoot";
import { PageRenderer } from "../../book/renderer/PageRenderer";

const MM_TO_PX = 96 / 25.4;
const THUMBNAIL_ROOT_MARGIN = "320px 0px";

/** Thumbnail leve: renderiza a própria página em escala reduzida (sem interação). */
export function PageThumbnail({
  book,
  page,
  index,
  width = 44,
  selected = false,
}: {
  book: Book;
  page: Page;
  index: number;
  width?: number;
  selected?: boolean;
}) {
  const pageWidthPx = Number.parseFloat(book.tokens.pageWidth) * MM_TO_PX;
  const pageHeightPx = Number.parseFloat(book.tokens.pageHeight) * MM_TO_PX;
  const scale = width / pageWidthPx;
  const frameRef = useRef<HTMLDivElement>(null);
  const [intersectsViewport, setIntersectsViewport] = useState(selected);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === "undefined") {
      setIntersectsViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIntersectsViewport(entry?.isIntersecting === true),
      { rootMargin: THUMBNAIL_ROOT_MARGIN },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const materialized = selected || intersectsViewport;

  return (
    <div
      ref={frameRef}
      className="shrink-0 overflow-hidden border border-border bg-card"
      style={{ width, height: pageHeightPx * scale }}
      aria-hidden="true"
      data-thumbnail-page-id={page.id}
      data-thumbnail-materialized={materialized ? "true" : "false"}
    >
      {materialized ? (
        <BookRoot tokens={book.tokens} fonts={book.fonts}>
          <div className="k-thumb" style={{ transform: `scale(${scale})` }}>
            <PageRenderer book={book} page={page} index={index} />
          </div>
        </BookRoot>
      ) : (
        <div className="k-thumbnail-placeholder" style={{ width: "100%", height: "100%" }} />
      )}
    </div>
  );
}
