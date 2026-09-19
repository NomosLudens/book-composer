import { readFile } from "node:fs/promises";
import { parseMarkdownDocument } from "../src/book/markdown-book";

const file = process.argv[2] ?? "fixtures/markdown-book-adversarial.md";
const source = await readFile(file, "utf8");
const expected = [...source.matchAll(/\[\[BLOCK-\d{3}\]\]/g)].map((match) => match[0]);
const document = parseMarkdownDocument(source, file);
const found: string[] = [];
for (const node of document.nodes) {
  const content = String(node.metadata?.raw ?? "");
  found.push(...(content.match(/\[\[BLOCK-\d{3}\]\]/g) ?? []));
}
const count = (items: string[]) => new Map(items.map((item) => [item, items.filter((candidate) => candidate === item).length]));
const expectedCounts = count(expected);
const foundCounts = count(found);
const missing = expected.filter((token) => !foundCounts.has(token));
const duplicated = [...foundCounts.entries()].filter(([token, amount]) => amount > (expectedCounts.get(token) ?? 0)).map(([token]) => token);
const expectedOrder = [...new Set(expected)];
const foundOrder = [...new Set(found)];
const outOfOrder = expectedOrder.filter((token, index) => foundOrder[index] !== token);
console.log("TOKENS_EXPECTED=" + expected.length);
console.log("TOKENS_FOUND=" + found.length);
console.log("TOKENS_MISSING=" + (missing.length ? missing.join(",") : 0));
console.log("TOKENS_DUPLICATED=" + (duplicated.length ? duplicated.join(",") : 0));
console.log("TOKENS_OUT_OF_ORDER=" + (outOfOrder.length ? outOfOrder.join(",") : 0));
if (missing.length || duplicated.length || outOfOrder.length) process.exitCode = 1;
