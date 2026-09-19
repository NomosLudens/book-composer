import { BlockList } from "../renderer/BlockRenderer";
import { PullQuote } from "../components/BookComponents";
import { firstOfType, type TemplateProps } from "./types";
import { useEffect, useRef, useState } from "react";

const MULTICOL_EPSILON_PX = 2;

type MulticolState = "checking" | "normal" | "reflowed";

function hasExtraMulticolColumn(flow: HTMLElement): boolean {
  const flowRect = flow.getBoundingClientRect();
  const style = getComputedStyle(flow);
  const columnCount = Number.parseInt(style.columnCount, 10);
  if (columnCount < 2 || flow.clientWidth < 1) return false;

  const gap = Number.parseFloat(style.columnGap) || 0;
  const columnWidth = (flow.clientWidth - gap * (columnCount - 1)) / columnCount;
  const secondColumnLimit = columnWidth + gap + MULTICOL_EPSILON_PX;

  return Array.from(flow.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => child.classList.contains("k-block"))
    .some((block) =>
      Array.from(block.getClientRects()).some(
        (fragment) => fragment.left - flowRect.left > secondColumnLimit,
      ),
    );
}

function stylesheetSignature(): string {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'))
    .map((link) => link.href)
    .sort()
    .join("\u001f");
}

function waitForStylesheet(link: HTMLLinkElement): Promise<void> {
  if (link.sheet) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      link.removeEventListener("load", finish);
      link.removeEventListener("error", finish);
      resolve();
    };

    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
    if (link.sheet) finish();
  });
}

async function waitForTypographyReady(): Promise<void> {
  if (document.readyState === "loading") {
    await new Promise<void>((resolve) => {
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
  }

  let previousSignature: string | null = null;
  for (let pass = 0; pass < 5; pass += 1) {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
    );
    const signature = stylesheetSignature();
    await Promise.all(links.map(waitForStylesheet));
    const resolvedSignature = stylesheetSignature();
    if (resolvedSignature === previousSignature) break;
    previousSignature = resolvedSignature;
    if (signature === resolvedSignature && pass === 4) break;
  }

  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function useConditionalMulticolReflow(blocks: TemplateProps["page"]["blocks"]) {
  const flowRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MulticolState>("checking");

  useEffect(() => {
    let cancelled = false;
    let checkVersion = 0;

    const check = async () => {
      const version = ++checkVersion;
      setState("checking");
      await waitForTypographyReady();
      if (cancelled || version !== checkVersion || !flowRef.current) return;
      setState(hasExtraMulticolColumn(flowRef.current) ? "reflowed" : "normal");
    };

    const printMedia = window.matchMedia("print");
    const handleMediaChange = () => {
      void check();
    };

    printMedia.addEventListener("change", handleMediaChange);
    void check();
    return () => {
      cancelled = true;
      printMedia.removeEventListener("change", handleMediaChange);
    };
  }, [blocks]);

  return {
    flowRef,
    className: `k-flow${state === "reflowed" ? " k-flow--2col-overflow-reflow" : ""}`,
    state,
  };
}

/** FRONT_MATTER — ficha técnica, créditos, notas. Uma coluna, muito limpo. */
export function FrontMatterTemplate({ page }: TemplateProps) {
  const dedication = page.variant === "dedication";
  const titlePage = page.variant === "title-page";
  const hasOwnHeading = page.blocks.some(
    (block) => block.type === "heading" && block.text === page.title,
  );
  // Filtro de blocos: oculta headings cujo texto seja idêntico ao título
  // da página (para evitar duplicação visual). Genérico — antes filtrava
  // especificamente o texto "KALLISTIS", acoplado a um único projeto.
  const blocks = titlePage
    ? page.blocks.filter((block) => !(block.type === "heading" && block.text === page.title))
    : page.blocks;
  return (
    <div
      className={`k-flow${dedication ? " k-dedication" : ""}${titlePage ? " k-title-page" : ""}`}
    >
      {page.title && !hasOwnHeading && !dedication && !titlePage ? (
        <h1 className="k-h2" style={{ marginTop: 0 }}>
          {page.title}
        </h1>
      ) : null}
      <BlockList blocks={blocks} />
    </div>
  );
}

/** TOC — sumário editorial com hierarquia real. */
export function TocTemplate({ page }: TemplateProps) {
  return (
    <div className="k-flow">
      <h1 className="k-h1" style={{ marginBottom: "6mm" }}>
        {page.title ?? "Sumário"}
      </h1>
      <BlockList blocks={page.blocks} />
    </div>
  );
}

/** NARRATIVE — registro literário; duas colunas quando a página pedir. */
export function NarrativeTemplate({ page }: TemplateProps) {
  return (
    <div className={`k-flow${page.settings.columns === 2 ? " k-flow--2col" : ""}`}>
      <BlockList blocks={page.blocks} />
    </div>
  );
}

/** TIMELINE_MILESTONE — marcos como navegação histórica, sem quebrar o fluxo em cards. */
export function TimelineMilestoneTemplate({ page }: TemplateProps) {
  return (
    <div className="k-timeline-milestone k-flow">
      {page.title &&
      !page.blocks.some((block) => block.type === "heading" && block.text === page.title) ? (
        <h1 className="k-h2" style={{ marginTop: 0 }}>
          {page.title}
        </h1>
      ) : null}
      <BlockList blocks={page.blocks} />
    </div>
  );
}

/** RULES_2COL — página funcional. Duas colunas, gutter de 8 mm. */
export function RulesTemplate({ page }: TemplateProps) {
  const reflow = useConditionalMulticolReflow(page.blocks);
  return (
    <div
      ref={reflow.flowRef}
      className={`${reflow.className}${page.settings.columns === 1 ? "" : " k-flow--2col"}`}
      data-multicol-state={page.settings.columns === 1 ? "normal" : reflow.state}
    >
      <BlockList blocks={page.blocks} />
    </div>
  );
}

/**
 * QUOTE_LAYOUT — citação como elemento de ritmo.
 * variant "full-page": página fortemente visual. Caso contrário: bloco na página.
 */
export function QuoteLayoutTemplate({ page }: TemplateProps) {
  const quote = firstOfType(page.blocks, "quote");
  if (page.variant === "full-page" && quote) {
    return (
      <div
        data-block-id={quote.id}
        style={{ display: "grid", height: "100%", alignContent: "center" }}
      >
        <PullQuote block={{ ...quote, size: quote.size ?? "lg" }} />
      </div>
    );
  }

  return (
    <div className={`k-flow${page.settings.columns === 2 ? " k-flow--2col" : ""}`}>
      <BlockList blocks={page.blocks} />
    </div>
  );
}
