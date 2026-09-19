import { readFile } from "node:fs/promises";
import { parseMarkdownDocument, transformDocumentToBook, type DocumentNode, type MarkdownDocument } from "../src/book/markdown-book";
import type { Block, Book } from "../src/book/types";

const root = new URL("..", import.meta.url).pathname;
const realPath = process.argv[2] ?? "/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md";
const fixturePath = process.argv[3] ?? `${root}fixtures/markdown-book-adversarial.md`;

type Classification = "PRINTING" | "NON_PRINTING_METADATA" | "STRUCTURAL_ONLY" | "UNSUPPORTED_BUT_PRESERVED";
type Finding = { type: string; sourceNodeId?: string; detail: string };
type Result = ReturnType<typeof inspect>;

const printingTypes = new Set(["heading", "paragraph", "list", "blockquote", "code", "hr", "table", "html"]);
const unsupportedTypes = new Set(["html", "link", "image", "code"]);

function classify(node: DocumentNode, doc: MarkdownDocument): Classification {
  if (node.type === "frontMatter") return "NON_PRINTING_METADATA";
  if (node.type === "space") return "STRUCTURAL_ONLY";
  if (unsupportedTypes.has(node.type) || doc.diagnostics.some((diagnostic) => diagnostic.type === node.type && diagnostic.source.startLine === node.source.startLine)) return "UNSUPPORTED_BUT_PRESERVED";
  return printingTypes.has(node.type) ? "PRINTING" : "UNSUPPORTED_BUT_PRESERVED";
}

function allBlocks(book: Book): Block[] {
  const result: Block[] = [];
  const visit = (block: Block) => {
    result.push(block);
    if (block.type === "layout") block.areas.forEach((area) => area.blocks?.forEach(visit));
  };
  book.pages.forEach((page) => page.blocks.forEach(visit));
  return result;
}

function inspect(source: string, sourceFile: string) {
  const document = parseMarkdownDocument(source, sourceFile);
  const book = transformDocumentToBook(document);
  const nodes = document.nodes;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const classes = new Map(nodes.map((node) => [node.id, classify(node, document)]));
  const blocks = allBlocks(book);
  const imported = blocks.filter((block) => block.metadata?.["provenanceKind"] === "IMPORTED");
  const synthetic = blocks.filter((block) => block.metadata?.["provenanceKind"] === "SYNTHETIC_EDITORIAL");
  const withoutSource = blocks.filter((block) => !["IMPORTED", "SYNTHETIC_EDITORIAL"].includes(String(block.metadata?.["provenanceKind"] ?? "")));
  const invalid: Finding[] = [];
  const counts = new Map<string, string[]>();
  imported.forEach((block) => {
    const sourceNodeId = String(block.metadata?.["sourceNodeId"] ?? "");
    const node = byId.get(sourceNodeId);
    if (!node) invalid.push({ type: "INVALID_SOURCE_REFERENCE", sourceNodeId, detail: `block=${block.id}` });
    else {
      const start = Number(block.metadata?.["sourceStartLine"]);
      const end = Number(block.metadata?.["sourceEndLine"]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < node.source.startLine || end > node.source.endLine || start > end) invalid.push({ type: "INVALID_SOURCE_REFERENCE", sourceNodeId, detail: `block=${block.id} range=${start}-${end}` });
    }
    if (!counts.has(sourceNodeId)) counts.set(sourceNodeId, []);
    counts.get(sourceNodeId)!.push(block.id);
  });
  const printing = nodes.filter((node) => classes.get(node.id) === "PRINTING" || classes.get(node.id) === "UNSUPPORTED_BUT_PRESERVED");
  const printingExpected = printing.filter((node) => classes.get(node.id) === "PRINTING");
  const unsupported = printing.filter((node) => classes.get(node.id) === "UNSUPPORTED_BUT_PRESERVED");
  const duplicated = printing.filter((node) => (counts.get(node.id)?.length ?? 0) > 1);
  const unaccounted = printing.filter((node) => (counts.get(node.id)?.length ?? 0) === 0);
  const unsupportedDropped = unsupported.filter((node) => (counts.get(node.id)?.length ?? 0) === 0);
  const expectedOrder = printing.map((node) => node.id);
  const actualOrder = imported.map((block) => String(block.metadata?.["sourceNodeId"] ?? "")).filter((id) => expectedOrder.includes(id));
  const orderViolations: Finding[] = [];
  let last = -1;
  actualOrder.forEach((id, index) => { const position = expectedOrder.indexOf(id); if (position < last) orderViolations.push({ type: "IR_NODE_REORDERED", sourceNodeId: id, detail: `blockIndex=${index}` }); else last = position; });
  const unsupportedTypesFound = [...new Set(unsupported.map((node) => node.type))];
  return { document, book, nodes, blocks, imported, synthetic, withoutSource, invalid, printing, printingExpected, unsupported, unsupportedDropped, duplicated, unaccounted, orderViolations, unsupportedTypesFound };
}

function emit(label: string, result: Result) {
  const metadata = result.nodes.filter((node) => node.type === "frontMatter").length;
  const structural = result.nodes.filter((node) => node.type === "space").length;
  const bookWithSource = result.imported.length;
  console.log(`${label}_IR_TOTAL=${result.nodes.length}`);
  console.log(`${label}_IR_PRINTING=${result.printingExpected.length}`);
  console.log(`${label}_IR_NON_PRINTING_METADATA=${metadata}`);
  console.log(`${label}_IR_STRUCTURAL_ONLY=${structural}`);
  console.log(`${label}_IR_UNSUPPORTED_PRESERVED=${result.unsupported.length}`);
  console.log(`${label}_BOOK_TOTAL_BLOCKS=${result.blocks.length}`);
  console.log(`${label}_BOOK_IMPORTED_BLOCKS=${result.imported.length}`);
  console.log(`${label}_BOOK_SYNTHETIC_BLOCKS=${result.synthetic.length}`);
  console.log(`${label}_BOOK_BLOCKS_WITH_SOURCE=${bookWithSource}`);
  console.log(`${label}_BOOK_BLOCKS_WITHOUT_SOURCE=${result.withoutSource.length}`);
  console.log(`${label}_BOOK_BLOCKS_WITH_INVALID_SOURCE=${result.invalid.length}`);
  console.log(`${label}_UNACCOUNTED=${result.unaccounted.length}`);
  console.log(`${label}_DUPLICATED=${result.duplicated.length}`);
  console.log(`${label}_OUT_OF_ORDER=${result.orderViolations.length}`);
  console.log(`${label}_INVALID_SOURCE=${result.invalid.length}`);
  if (result.unaccounted.length) result.unaccounted.forEach((node) => console.log(`IR_NODE_DROPPED sourceNodeId=${node.id} sourceRange=${node.source.startLine}-${node.source.endLine} type=${node.type}`));
  if (result.duplicated.length) result.duplicated.forEach((node) => console.log(`CARDINALITY_VIOLATION SOURCE_NODE_ID=${node.id} EXPECTED=1 ACTUAL=${result.blocks.filter((block) => block.metadata?.["sourceNodeId"] === node.id).length}`));
  result.invalid.forEach((finding) => console.log(`${finding.type} SOURCE_NODE_ID=${finding.sourceNodeId} ${finding.detail}`));
  result.orderViolations.forEach((finding) => console.log(`${finding.type} SOURCE_NODE_ID=${finding.sourceNodeId} ${finding.detail}`));
}

const real = inspect(await readFile(realPath, "utf8"), realPath);
const adversarial = inspect(await readFile(fixturePath, "utf8"), fixturePath);
console.log(`IR_TOTAL_NODES=${real.nodes.length}`);
console.log(`IR_PRINTING_UNITS=${real.printingExpected.length}`);
console.log(`IR_NON_PRINTING_METADATA=${real.nodes.filter((node) => node.type === "frontMatter").length}`);
console.log(`IR_STRUCTURAL_ONLY=${real.nodes.filter((node) => node.type === "space").length}`);
console.log(`IR_UNSUPPORTED_PRESERVED=${real.unsupported.length}`);
console.log(`BOOK_TOTAL_BLOCKS=${real.blocks.length}`);
console.log(`BOOK_IMPORTED_BLOCKS=${real.imported.length}`);
console.log(`BOOK_SYNTHETIC_BLOCKS=${real.synthetic.length}`);
console.log(`BOOK_BLOCKS_WITH_SOURCE=${real.imported.length}`);
console.log(`BOOK_BLOCKS_WITHOUT_SOURCE=${real.withoutSource.length}`);
emit("REAL", real);
emit("ADVERSARIAL", adversarial);
console.log(`UNSUPPORTED_PRESERVED_COUNT=${real.unsupported.length}`);
console.log(`UNSUPPORTED_PRESERVED_TYPES=${real.unsupportedTypesFound.join(",") || "NONE"}`);
console.log(`UNSUPPORTED_SILENTLY_DROPPED=${real.unsupportedDropped.length}`);
console.log(`BOOK_BLOCKS_WITH_INVALID_SOURCE=${real.invalid.length}`);
console.log(`CARDINALITY_VIOLATIONS=${real.duplicated.length}`);
console.log(`ORDER_VIOLATIONS=${real.orderViolations.length}`);

const failures = [real, adversarial].some((result) => result.unaccounted.length || result.duplicated.length || result.orderViolations.length || result.invalid.length || result.withoutSource.length || result.unsupportedDropped.length);
process.exitCode = failures ? 1 : 0;
