import { marked } from "marked";
import type { Block, Book, ListItem, Page, SectionNode, TableBlockV2 } from "./types";
import { DEFAULT_TOKENS } from "./types";
import { editorialUnitsFromDocument, isTableOfContentsHeading } from "./editorial-units";
import { createTableBlock, parseTabularText } from "./tableModel";

export type SourceRange = { startLine: number; endLine: number };
export type DocumentNode = { id: string; type: string; source: SourceRange; children?: DocumentNode[]; text?: string; level?: number; metadata?: Record<string, unknown> };
export type MarkdownDocument = { sourceFile?: string; source: string; nodes: DocumentNode[]; metadata: Record<string, unknown>; diagnostics: Array<{ type: string; source: SourceRange; message: string }> };

function sourceRange(raw: string, source: string, cursor: { offset: number }, lineStarts: number[]): SourceRange {
  const offset = Math.max(cursor.offset, source.indexOf(raw, cursor.offset));
  cursor.offset = offset + raw.length;
  const lineAt = (position: number) => {
    let low = 0;
    let high = lineStarts.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (lineStarts[middle]! <= position) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  return { startLine: lineAt(offset), endLine: lineAt(offset + raw.length) };
}
function frontMatter(source: string) {
  const match = /^(?:\uFEFF)?---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/u.exec(source);
  if (!match) return { body: source, metadata: {}, range: null as SourceRange | null };
  const metadata: Record<string, unknown> = {};
  for (const line of match[1]!.split("\n")) { const item = /^([\w-]+)\s*:\s*(.*)$/.exec(line.trim()); if (item) metadata[item[1]!] = item[2]!.trim().replace(/^['"]|['"]$/g, ""); }
  return { body: source.slice(match[0].length), metadata, range: { startLine: 1, endLine: match[0].split("\n").length } };
}

/** Detecta tabelas que exportadores Markdown deixam com uma linha separadora
 * ligeiramente inválida; sem isso, a tabela vira um parágrafo gigante. */
function looksLikeMarkdownTable(raw: string): boolean {
  const lines = raw.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2 || !lines[0]!.trim().startsWith("|") || !lines[1]!.trim().startsWith("|")) return false;
  const delimiterCells = lines[1]!.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  return delimiterCells.length >= 2 && delimiterCells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

export function parseMarkdownDocument(source: string, sourceFile?: string): MarkdownDocument {
  const fm = frontMatter(source); const tokens = marked.lexer(fm.body, { gfm: true }); const cursor = { offset: source.length - fm.body.length }; const lineStarts = [0]; for (let i = 0; i < source.length; i += 1) if (source[i] === "\n") lineStarts.push(i + 1); const nodes: DocumentNode[] = []; const diagnostics: MarkdownDocument["diagnostics"] = [];
  (tokens as Array<Record<string, unknown>>).forEach((token, index) => {
    const raw = String(token["raw"] ?? ""); const range = sourceRange(raw, source, cursor, lineStarts); const markedType = String(token["type"] ?? "unknown"); const type = markedType === "paragraph" && looksLikeMarkdownTable(raw) ? "table" : markedType; const metadata: Record<string, unknown> = { raw };
    if (type === "list") { metadata["ordered"] = Boolean(token["ordered"]); metadata["items"] = listItems(token["items"]); }
    const node = { id: `markdown-node-${index + 1}`, type, source: range, ...(typeof token["text"] === "string" ? { text: token["text"] } : {}), ...(typeof token["depth"] === "number" ? { level: token["depth"] } : {}), metadata } as DocumentNode;
    if (Array.isArray(token["tokens"])) node.children = token["tokens"].map((child: Record<string, unknown>, childIndex: number) => ({ id: `${node.id}-child-${childIndex + 1}`, type: String(child["type"] ?? "inline"), source: range, ...(typeof child["text"] === "string" ? { text: child["text"] } : {}), metadata: { raw: child["raw"] ?? "" } } as DocumentNode));
    if (["html", "link", "image", "code"].includes(node.type)) diagnostics.push({ type: node.type, source: range, message: "Preservado no IR; conversão visual ainda não implementada." });
    nodes.push(node);
  });
  if (fm.range) nodes.unshift({ id: "markdown-front-matter", type: "frontMatter", source: fm.range, metadata: fm.metadata });
  return { ...(sourceFile ? { sourceFile } : {}), source, nodes, metadata: fm.metadata, diagnostics };
}

function listItems(value: unknown): ListItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const token = item as Record<string, unknown>;
    const children = Array.isArray(token["items"]) ? listItems(token["items"]) : undefined;
    return { content: String(token["text"] ?? "").trim(), ...(children?.length ? { children } : {}) };
  });
}

function id(prefix: string, index: number) { return `markdown-${prefix}-${index + 1}`; }
function makePage(idValue: string, template: Page["template"], title: string): Page { return { id: idValue, template, variant: "default", title, settings: { header: template !== "cover", footer: template !== "cover", pageNumber: template !== "cover", columns: 1, background: "paper", fullBleed: template === "cover" }, blocks: [] }; }

function importedMetadata(doc: MarkdownDocument, node: DocumentNode, extra: Record<string, unknown> = {}) {
  return { provenanceKind: "IMPORTED", sourceNodeId: node.id, sourceStartLine: node.source.startLine, sourceEndLine: node.source.endLine, ...(doc.sourceFile ? { sourceFile: doc.sourceFile } : {}), ...extra };
}

function blockForNode(doc: MarkdownDocument, node: DocumentNode, blockId: string, editorialUnitId?: string): Block {
  const metadata = importedMetadata(doc, node, { markdownType: node.type, ...(editorialUnitId ? { editorialUnitId } : {}) });
  if (node.type === "table") {
    const matrix = parseTabularText(String(node.metadata?.["raw"] ?? node.text ?? ""));
    const columnCount = Math.max(1, ...matrix.map((row) => row.length));
    const table = createTableBlock(blockId, columnCount, Math.max(1, matrix.length), true);
    return {
      ...table,
      metadata,
      columns: table.columns.map((column, index) => ({ ...column, label: matrix[0]?.[index] ?? column.label ?? "" })),
      rows: table.rows.map((row, rowIndex) => ({
        ...row,
        cells: row.cells.map((cell, columnIndex) => ({ ...cell, content: matrix[rowIndex]?.[columnIndex] ?? "" })),
      })),
    };
  }
  if (node.type === "list") return { id: blockId, type: "list", ordered: Boolean(node.metadata?.["ordered"]), items: (node.metadata?.["items"] as ListItem[] | undefined) ?? [], metadata };
  if (node.type === "blockquote") return { id: blockId, type: "quote", text: node.text ?? String(node.metadata?.["raw"] ?? ""), size: "md", metadata };
  if (node.type === "hr") return { id: blockId, type: "divider", ornament: false, metadata };
  return { id: blockId, type: "text", content: node.text ?? String(node.metadata?.["raw"] ?? ""), role: "body", align: "justify", metadata };
}

/**
 * Tables imported from Markdown are editorial units, but a table with dozens
 * of long cells cannot be kept as one unsplittable DOM block. Split only when
 * the content warrants it and repeat the header on each continuation. The
 * limit is deliberately conservative: the browser remains the authority for
 * final row height, while this prevents a whole catalog from entering one
 * page and lets geometric pagination place each chunk normally.
 */
export function splitMarkdownTableForFlow(table: TableBlockV2, maxRowCharacters = 1200): TableBlockV2[] {
  const headers = table.rows.filter((row) => row.kind === "header");
  const body = table.rows.filter((row) => row.kind !== "header" && row.kind !== "footer");
  if (body.length === 0) return [table];
  const chunks: TableBlockV2["rows"][] = [];
  let current: TableBlockV2["rows"] = [];
  let currentCharacters = 0;
  for (const row of body) {
    const rowCharacters = row.cells.reduce((sum, cell) => sum + cell.content.length, 0) + 48;
    if (current.length > 0 && currentCharacters + rowCharacters > maxRowCharacters) {
      chunks.push(current);
      current = [];
      currentCharacters = 0;
    }
    current.push(row);
    currentCharacters += rowCharacters;
  }
  if (current.length > 0) chunks.push(current);
  if (chunks.length <= 1) return [table];
  return chunks.map((rows, index) => ({
    ...table,
    id: index === 0 ? table.id : `${table.id}-continuation-${index}`,
    rows: index === 0 ? [...headers, ...rows] : rows,
    ...(index > 0 && headers.length > 0
      ? { continuationOf: table.id, continuationIndex: index, continuationHeader: headers.map((row) => ({ ...row, id: `${row.id}-continuation-${index}` })) }
      : {}),
  }));
}

/** Fragmenta um parágrafo excepcionalmente longo para a paginação física.
 * A fonte continua sendo uma única unidade Markdown; os fragmentos só existem
 * no fluxo geométrico e mantêm a proveniência do nó original. */
export function splitMarkdownTextForFlow(block: Extract<Block, { type: "text" }>, maxCharacters = 1800): Extract<Block, { type: "text" }>[] {
  const source = block.content.trim();
  if (source.length <= maxCharacters) return [block];
  const chunks: string[] = [];
  let remaining = source;
  while (remaining.length > maxCharacters) {
    const window = remaining.slice(0, maxCharacters);
    const sentenceBreaks = [...window.matchAll(/[.!?](?=\s|$)/gu)].map((match) => (match.index ?? 0) + 1);
    const cut = sentenceBreaks.at(-1) ?? window.lastIndexOf(" ");
    const boundary = cut > Math.floor(maxCharacters * 0.55) ? cut : maxCharacters;
    chunks.push(remaining.slice(0, boundary).trim());
    remaining = remaining.slice(boundary).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks.map((content, index) => ({
    ...block,
    id: index === 0 ? block.id : `${block.id}-continuation-${index}`,
    content,
    metadata: { ...block.metadata, flowFragment: true, flowFragmentIndex: index, flowFragmentCount: chunks.length },
  }));
}

/** Fase 1: transforma o IR já parseado em Book estrutural; não promete paginação geométrica. */
export function transformDocumentToBook(doc: MarkdownDocument): Book {
  const editorialUnits = editorialUnitsFromDocument(doc);
  const unitByNodeId = new Map(editorialUnits.flatMap((unit) => unit.sourceNodeIds.map((nodeId) => [nodeId, unit.id] as const)));
  const first = doc.nodes.find((node) => node.type === "heading"); const firstContent = doc.nodes.find((node) => !["frontMatter", "space"].includes(node.type)); const title = first?.text?.trim() || String(doc.metadata["title"] ?? "Livro sem título");
  const titleIsFirstContent = first === firstContent;
  const pages: Page[] = [makePage(id("page", 0), "cover", title)]; pages[0]!.blocks.push({ id: id("heading", 0), type: "heading", level: 1, text: title, metadata: titleIsFirstContent && first ? importedMetadata(doc, first) : { provenanceKind: "SYNTHETIC_EDITORIAL" } });
  const nodes: SectionNode[] = [{ id: id("node", 0), label: "Front Matter", kind: "front", pageIds: [pages[0]!.id] }]; let currentNode = nodes[0]!; let currentPage: Page | null = null; let pageIndex = 1; let blockIndex = 1; let tocUnitId: string | undefined;
  const finish = () => { if (!currentPage) return; pages.push(currentPage); currentNode.pageIds.push(currentPage.id); currentPage = null; };
  const start = (template: Page["template"], label: string) => { finish(); currentPage = makePage(id("page", pageIndex++), template, label); };
  for (const node of doc.nodes) {
    if (node.type === "frontMatter" || node.type === "space") continue;
    if (node.type === "heading") {
      const level = node.level ?? 1; const label = node.text?.trim() || "Sem título";
      if (node === first && titleIsFirstContent) continue;
      if (isTableOfContentsHeading(node)) { start("toc", label); currentNode = nodes[0]!; tocUnitId = unitByNodeId.get(node.id); }
      else if (level === 1 && label !== title) { start("part_opening", label); currentNode = { id: id("node", nodes.length), label, kind: "part", pageIds: [] }; nodes.push(currentNode); }
      else if (level === 2) { start("chapter_opening", label); currentNode = { id: id("node", nodes.length), label, kind: "chapter", pageIds: [] }; nodes.push(currentNode); }
      else if (!currentPage) start("narrative", currentNode.label);
      currentPage!.blocks.push({ id: id("heading", blockIndex++), type: "heading", level: Math.min(5, level) as 1 | 2 | 3 | 4 | 5, text: label, metadata: importedMetadata(doc, node, { semanticLevel: level, editorialUnitId: unitByNodeId.get(node.id) }) } as Block);
      continue;
    }
    const pageBeforeNode = currentPage as Page | null;
    if (pageBeforeNode?.template === "toc") {
      // Preserva a fonte no Book estrutural, mas não a usa como conteúdo do
      // sumário geométrico: a lista Markdown é substituída pelo bloco TOC
      // sintético abaixo, já com semântica editorial e paginação própria.
      pageBeforeNode.blocks.push(blockForNode(doc, node, id(node.type === "list" ? "list" : "text", blockIndex++)));
      continue;
    }
    if (!currentPage) start("narrative", currentNode.label);
    currentPage!.blocks.push(blockForNode(doc, node, id(node.type === "list" ? "list" : "text", blockIndex++), unitByNodeId.get(node.id)));
  }
  finish();
  const entries = pages.flatMap((candidate, index) => candidate.template === "part_opening" || candidate.template === "chapter_opening" ? [{ label: candidate.title ?? "", page: index + 1, level: candidate.template === "part_opening" ? "part" as const : "chapter" as const }] : []);
  pages.filter((candidate) => candidate.template === "toc").forEach((candidate) => candidate.blocks.push({ id: id("toc", blockIndex++), type: "toc", columns: 3, entries, metadata: { provenanceKind: "SYNTHETIC_EDITORIAL", ...(tocUnitId ? { editorialUnitId: tocUnitId } : {}) } }));
  return { schemaVersion: 1, meta: { title, subtitle: String(doc.metadata["subtitle"] ?? ""), author: String(doc.metadata["author"] ?? ""), imprint: "", edition: String(doc.metadata["edition"] ?? ""), firstFolio: 1 }, tokens: { ...DEFAULT_TOKENS }, nodes, pages, assets: [], fonts: [], spreads: [], tableStyles: [], recipes: [], sheetTemplates: [], sheetInstances: [] };
}

/** Compatibilidade da UI: o caminho oficial é Markdown → IR → Book. */
export function transformMarkdownToBook(source: string, sourceFile?: string): Book {
  return transformDocumentToBook(parseMarkdownDocument(source, sourceFile));
}
