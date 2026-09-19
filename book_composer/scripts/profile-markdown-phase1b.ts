import { readFile } from "node:fs/promises";
import { marked } from "marked";
import { parseMarkdownDocument, transformMarkdownToBook } from "../src/book/markdown-book";

const sourceFile = process.argv[2] ?? "/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md";
const source = await readFile(sourceFile, "utf8");
const measure = async <T>(name: string, run: () => T | Promise<T>, summarize: (value: T) => unknown) => {
  const start = performance.now();
  const result = await run();
  console.log(JSON.stringify({ stage: name, durationMs: Math.round(performance.now() - start), summary: summarize(result) }));
  return result;
};
console.log(JSON.stringify({ sourceFile, bytes: Buffer.byteLength(source), lines: source.split("\n").length, characters: source.length }));
const tokens = await measure("marked", () => marked.lexer(source, { gfm: true }), (value) => value.length);
const document = await measure("ir", () => parseMarkdownDocument(source, sourceFile), (value) => value.nodes.length);
console.log(JSON.stringify({ stage: "ir-summary", nodes: document.nodes.length, diagnostics: document.diagnostics.length }));
const book = await measure("book", () => transformMarkdownToBook(source, sourceFile), (value) => value.pages.length);
console.log(JSON.stringify({ stage: "book-summary", nodes: book.nodes.length, pages: book.pages.length, blocks: book.pages.reduce((sum, page) => sum + page.blocks.length, 0), markedTokens: tokens.length }));
