import type { DocumentNode, MarkdownDocument } from "./markdown-book";
import type { Book, Block, ListItem, Page } from "./types";

export type EditorialUnitKind = "heading" | "paragraph" | "list" | "quote" | "table" | "image" | "rule" | "code" | "separator" | "toc" | "other";

export interface EditorialUnit {
  id: string;
  sourceNodeIds: string[];
  kind: EditorialUnitKind;
  keepWithNext?: boolean;
  keepTogether?: boolean;
  breakBefore?: boolean;
  breakAfter?: boolean;
  splittable?: boolean;
  payload: Block | DocumentNode;
}

function kindFor(node: DocumentNode): EditorialUnitKind {
  if (node.type === "heading") return isTableOfContentsHeading(node) ? "toc" : "heading";
  if (node.type === "paragraph") return "paragraph";
  if (node.type === "list") return "list";
  if (node.type === "blockquote") return "quote";
  if (node.type === "table") return "table";
  if (node.type === "image") return "image";
  if (node.type === "code") return "code";
  if (node.type === "hr") return "separator";
  return "other";
}

/** Conventional Markdown labels, independent of any book or project name. */
export function isTableOfContentsHeading(node: DocumentNode): boolean {
  if (node.type !== "heading") return false;
  const label = node.text?.trim().toLocaleLowerCase() ?? "";
  return ["sumário", "sumario", "table of contents", "contents", "índice", "indice"].includes(label);
}

export function editorialUnitsFromDocument(document: MarkdownDocument): EditorialUnit[] {
  const units: EditorialUnit[] = [];
  const firstHeading = document.nodes.find((node) => node.type === "heading");
  const firstContent = document.nodes.find((node) => !["frontMatter", "space"].includes(node.type));
  let inToc = false;
  for (const node of document.nodes) {
    if (["frontMatter", "space"].includes(node.type)) continue;
    const level = node.level ?? 1;
    if (node === firstHeading && node === firstContent) continue;
    if (isTableOfContentsHeading(node)) inToc = true;
    else if (inToc && node.type === "heading" && level <= 2) inToc = false;
    if (inToc && node.type !== "heading") continue;
    const kind = kindFor(node);
    units.push({
      id: `editorial-unit-${units.length + 1}`,
      sourceNodeIds: [node.id],
      kind,
      keepWithNext: node.type === "heading",
      keepTogether: kind === "toc" || ["heading", "list", "blockquote", "hr", "code"].includes(node.type),
      breakBefore: node.type === "heading" && level <= 2,
      splittable: ["paragraph", "list"].includes(node.type),
      payload: node,
    });
  }
  return units;
}

export interface PaginationMeasurement { height: number; width?: number; }
export type BreakReason = "INITIAL" | "OVERFLOW" | "BREAK_BEFORE" | "KEEP_WITH_NEXT" | "MANUAL";
export interface PaginatedEditorialPage { unitIds: string[]; breakReason: BreakReason; usedHeight: number; availableHeight: number; fillRatio: number; }
export interface PaginationDiagnostic { type: "PAGE_OVERFLOW" | "ORPHAN_HEADING" | "OVERSIZED_UNSPLITTABLE_UNIT" | "UNSUPPORTED_EDITORIAL_UNIT"; unitId: string; sourceNodeIds: string[]; overflowPx?: number; }

export interface GeometricMaterializationAudit {
  paginatorPageCount: number;
  paginatorTotalUnitReferences: number;
  paginatorUniqueUnitReferences: number;
  paginatorDuplicatedUnitReferences: number;
  paginatorUnassignedUnits: number;
  pageIdsTotal: number;
  pageIdsUnique: number;
  pageIdDuplicates: number;
  nodeIdsTotal: number;
  nodeIdsUnique: number;
  nodeIdDuplicates: number;
  invalidPageReferences: number;
  duplicatedPageReferences: number;
}

export function auditGeometricMaterialization(book: Book, units: EditorialUnit[], result: ReturnType<typeof paginateEditorialUnits>): GeometricMaterializationAudit {
  const unitReferences = result.pages.flatMap((page) => page.unitIds);
  const uniqueUnitReferences = new Set(unitReferences);
  const assignedUnits = new Set(unitReferences);
  const pageIds = book.pages.map((page) => page.id);
  const uniquePageIds = new Set(pageIds);
  const nodeIds = book.nodes.map((node) => node.id);
  const uniqueNodeIds = new Set(nodeIds);
  const pageIdSet = new Set(pageIds);
  const invalidPageReferences = book.nodes.reduce((count, node) => count + node.pageIds.filter((pageId) => !pageIdSet.has(pageId)).length, 0);
  const duplicatedPageReferences = book.nodes.reduce((count, node) => count + (node.pageIds.length - new Set(node.pageIds).size), 0);
  return {
    paginatorPageCount: result.pages.length,
    paginatorTotalUnitReferences: unitReferences.length,
    paginatorUniqueUnitReferences: uniqueUnitReferences.size,
    paginatorDuplicatedUnitReferences: unitReferences.length - uniqueUnitReferences.size,
    paginatorUnassignedUnits: units.filter((unit) => !assignedUnits.has(unit.id)).length,
    pageIdsTotal: pageIds.length,
    pageIdsUnique: uniquePageIds.size,
    pageIdDuplicates: pageIds.length - uniquePageIds.size,
    nodeIdsTotal: nodeIds.length,
    nodeIdsUnique: uniqueNodeIds.size,
    nodeIdDuplicates: nodeIds.length - uniqueNodeIds.size,
    invalidPageReferences,
    duplicatedPageReferences,
  };
}

export function paginateEditorialUnits(units: EditorialUnit[], measurements: Map<string, PaginationMeasurement>, availableHeight: number) {
  const pages: PaginatedEditorialPage[] = [];
  const diagnostics: PaginationDiagnostic[] = [];
  let current: PaginatedEditorialPage = { unitIds: [], breakReason: "INITIAL", usedHeight: 0, availableHeight, fillRatio: 0 };
  const flush = (reason: BreakReason) => { if (!current.unitIds.length) return; current.fillRatio = availableHeight > 0 ? current.usedHeight / availableHeight : 0; pages.push(current); current = { unitIds: [], breakReason: reason, usedHeight: 0, availableHeight, fillRatio: 0 }; };
  units.forEach((unit, index) => {
    const height = measurements.get(unit.id)?.height;
    if (height === undefined) { diagnostics.push({ type: "UNSUPPORTED_EDITORIAL_UNIT", unitId: unit.id, sourceNodeIds: unit.sourceNodeIds }); return; }
    if (height > availableHeight && !unit.splittable) {
      diagnostics.push({ type: "OVERSIZED_UNSPLITTABLE_UNIT", unitId: unit.id, sourceNodeIds: unit.sourceNodeIds, overflowPx: height - availableHeight });
      flush("OVERFLOW");
      current.unitIds.push(unit.id);
      current.usedHeight = height;
      flush("OVERFLOW");
      return;
    }
    const next = units[index + 1];
    const nextHeight = next ? measurements.get(next.id)?.height ?? 0 : 0;
    const needsBreak = unit.breakBefore && current.unitIds.length > 0;
    const keepPairTooLarge = Boolean(unit.keepWithNext && next && height + nextHeight > availableHeight);
    if (needsBreak) flush("BREAK_BEFORE");
    if (current.unitIds.length && (current.usedHeight + height > availableHeight || keepPairTooLarge)) flush(keepPairTooLarge ? "KEEP_WITH_NEXT" : "OVERFLOW");
    if (unit.keepWithNext && !next && current.unitIds.length && current.usedHeight + height > availableHeight) flush("KEEP_WITH_NEXT");
    current.unitIds.push(unit.id); current.usedHeight += height;
  });
  flush("OVERFLOW");
  pages.forEach((page) => { if (page.usedHeight > page.availableHeight) diagnostics.push({ type: "PAGE_OVERFLOW", unitId: page.unitIds.at(-1) ?? "", sourceNodeIds: [], overflowPx: page.usedHeight - page.availableHeight }); });
  return { pages, diagnostics };
}

export function materializeGeometricPages(base: Book, units: EditorialUnit[], result: ReturnType<typeof paginateEditorialUnits>, blocksByUnit: Map<string, Block[]>): Book {
  const cover = base.pages.find((page) => page.template === "cover");
  const sourceNodeToBookNode = new Map<string, string>();
  const sourcePageToBookNode = new Map<string, string>();
  for (const node of base.nodes) {
    for (const pageId of node.pageIds) {
      sourcePageToBookNode.set(pageId, node.id);
      const sourcePage = base.pages.find((page) => page.id === pageId);
      for (const block of sourcePage?.blocks ?? []) {
        const sourceNodeId = String(block.metadata?.["sourceNodeId"] ?? "");
        if (sourceNodeId) sourceNodeToBookNode.set(sourceNodeId, node.id);
      }
    }
  }
  const pageIdsByNode = new Map<string, string[]>();
  const frontNode = base.nodes[0];
  const assignPageOwner = (page: Page, blocks: Block[]) => {
    const owner = blocks.map((block) => sourceNodeToBookNode.get(String(block.metadata?.["sourceNodeId"] ?? ""))).find((nodeId): nodeId is string => Boolean(nodeId))
      ?? blocks.map((block) => sourcePageToBookNode.get(String(block.metadata?.["sourcePageId"] ?? ""))).find((nodeId): nodeId is string => Boolean(nodeId))
      ?? frontNode?.id;
    if (!owner) return;
    pageIdsByNode.set(owner, [...(pageIdsByNode.get(owner) ?? []), page.id]);
  };
  const pages: Page[] = cover ? [{ ...cover, paginationEngine: "geometric", breakReason: "INITIAL" }] : [];
  if (cover) assignPageOwner(pages[0]!, cover.blocks);
  result.pages.forEach((page, index) => {
    const blocks = page.unitIds.flatMap((unitId) => blocksByUnit.get(unitId) ?? []);
    const materializedPage: Page = {
      id: `geometric-page-${index + 1}`,
      template: "narrative",
      variant: "default",
      title: index === 0 ? base.meta.title : undefined,
      settings: { header: true, footer: true, pageNumber: true, columns: 1, background: "paper", fullBleed: false },
      blocks,
      paginationEngine: "geometric",
      breakReason: page.breakReason,
    };
    pages.push(materializedPage);
    assignPageOwner(materializedPage, blocks);
  });
  const geometricEntries = pages.flatMap((page, pageIndex) => page.blocks
    .filter((block): block is Extract<Block, { type: "heading" }> => {
      const semanticLevel = Number(block.metadata?.["semanticLevel"]);
      return block.type === "heading" && Number.isFinite(semanticLevel) && semanticLevel <= 2;
    })
    .map((block) => ({ label: block.text, page: pageIndex + 1, level: Number(block.metadata?.["semanticLevel"]) === 1 ? "part" as const : "chapter" as const })));
  const finalBook = {
    ...base,
    pages: pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) => block.type === "toc"
        ? { ...block, entries: block.entries.map((entry) => geometricEntries.find((candidate) => candidate.label === entry.label) ?? entry) }
        : block),
    })),
    nodes: base.nodes.map((node) => ({ ...node, pageIds: pageIdsByNode.get(node.id) ?? [] })),
  };
  console.info("[book-composer] geometric materialization", JSON.stringify(auditGeometricMaterialization(finalBook, units, result)));
  return finalBook;
}

export function editorialUnitsFromBook(book: Book): EditorialUnit[] {
  return book.pages.flatMap((page) => page.blocks.map((block) => ({ id: block.id, sourceNodeIds: [String(block.metadata?.["sourceNodeId"] ?? "")], kind: block.type === "divider" ? "separator" : block.type as EditorialUnitKind, payload: block, keepWithNext: block.type === "heading", keepTogether: block.type !== "text", splittable: block.type === "text" })));
}
