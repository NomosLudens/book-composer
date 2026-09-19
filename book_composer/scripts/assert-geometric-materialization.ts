import { parseMarkdownDocument, transformDocumentToBook } from "../src/book/markdown-book";
import { auditGeometricMaterialization, editorialUnitsFromDocument, materializeGeometricPages, paginateEditorialUnits } from "../src/book/editorial-units";
import { readFile } from "node:fs/promises";

const source = await readFile("fixtures/markdown-book-adversarial.md", "utf8");
const document = parseMarkdownDocument(source);
const base = transformDocumentToBook(document);
const units = editorialUnitsFromDocument(document);
const blocksByUnit = new Map<string, typeof base.pages[number]["blocks"]>();
for (const page of base.pages) for (const block of page.blocks) {
  const unitId = String(block.metadata?.["editorialUnitId"] ?? "");
  if (!unitId) continue;
  blocksByUnit.set(unitId, [...(blocksByUnit.get(unitId) ?? []), block]);
}
const measurements = new Map(units.map((unit) => [unit.id, { height: 10, width: 100 }]));
const pagination = paginateEditorialUnits(units, measurements, 100);
const finalBook = materializeGeometricPages(base, units, pagination, blocksByUnit);
const audit = auditGeometricMaterialization(finalBook, units, pagination);

console.log(`PAGINATOR_PAGE_COUNT=${audit.paginatorPageCount}`);
console.log(`MATERIALIZED_PAGE_COUNT=${finalBook.pages.length}`);
console.log(`FINAL_BOOK_PAGE_COUNT=${finalBook.pages.length}`);
console.log(`PAGE_IDS_TOTAL=${audit.pageIdsTotal}`);
console.log(`PAGE_IDS_UNIQUE=${audit.pageIdsUnique}`);
console.log(`PAGE_ID_DUPLICATES=${audit.pageIdDuplicates}`);
console.log(`NODE_IDS_TOTAL=${audit.nodeIdsTotal}`);
console.log(`NODE_IDS_UNIQUE=${audit.nodeIdsUnique}`);
console.log(`NODE_ID_DUPLICATES=${audit.nodeIdDuplicates}`);
console.log(`INVALID_PAGE_REFERENCES=${audit.invalidPageReferences}`);
console.log(`DUPLICATED_PAGE_REFERENCES=${audit.duplicatedPageReferences}`);

if (audit.pageIdDuplicates || audit.nodeIdDuplicates || audit.invalidPageReferences || audit.paginatorDuplicatedUnitReferences || audit.paginatorUnassignedUnits) process.exit(1);
