import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const input = path.resolve(process.argv[2] ?? "/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md");
const output = path.resolve(
  process.argv[3] ?? "projects/kallistis-livro-ii-regras-do-jogo.json",
);

const raw = await readFile(input, "utf8");
const sourceHash = createHash("sha256").update(raw).digest("hex");
const lines = raw.split(/\r?\n/u);
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/giu, "-").replace(/^-|-$/gu, "");
const id = (prefix, value, index) => `${prefix}-${slug(value).slice(0, 48) || "item"}-${index}`;
const pageSettings = (columns = 1) => ({
  header: true,
  footer: true,
  pageNumber: true,
  columns,
  background: "paper",
  fullBleed: false,
});
const textBlock = (content, index, role = "body") => ({
  id: id("text", content, index),
  type: "text",
  content,
  role,
  align: "justify",
});
const headingBlock = (text, level, index) => ({
  id: id("heading", text, index),
  type: "heading",
  level: Math.min(5, Math.max(1, level)),
  text,
});
const page = (template, title, blocks, index, columns = 1) => ({
  id: `md-page-${String(index).padStart(4, "0")}`,
  template,
  variant: "default",
  title,
  settings: pageSettings(columns),
  blocks,
});

const title = lines.find((line) => /^# /u.test(line))?.replace(/^# /u, "").trim() ?? "Livro";
const pages = [
  {
    ...page("cover", title, [headingBlock(title, 1, 0)], 1),
    settings: { ...pageSettings(), header: false, footer: false, pageNumber: false, fullBleed: false },
  },
];
const nodes = [];
let currentNode = { id: "node-front-matter", label: "Front Matter", kind: "front", pageIds: [] };
nodes.push(currentNode);
currentNode.pageIds.push(pages[0].id);
let pageIndex = 2;
let blockIndex = 1;
let currentPage = null;
let currentPart = "";
let currentChapter = "";
let pendingText = [];
/* Limite editorial conservador: deixa respiro para títulos, cabeçalho,
   rodapé e variações reais de altura entre fontes e navegadores. */
const MAX_PAGE_CHARS = 1500;

function pageTextLength(target) {
  return target.blocks.reduce((total, block) => {
    if (block.type === "text") return total + block.content.length;
    if (block.type === "heading") return total + block.text.length;
    return total;
  }, 0);
}

function flushText() {
  if (!currentPage || pendingText.length === 0) return;
  const content = pendingText.join("\n\n").trim();
  if (content) {
    const chunks = [];
    let chunk = "";
    for (const word of content.split(/\s+/u)) {
      if (chunk && chunk.length + word.length + 1 > MAX_PAGE_CHARS - 250) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += `${chunk ? " " : ""}${word}`;
    }
    if (chunk) chunks.push(chunk);
    for (const part of chunks) {
      if (currentPage.blocks.length > 0 && pageTextLength(currentPage) + part.length > MAX_PAGE_CHARS) {
        pages.push(currentPage);
        currentNode.pageIds.push(currentPage.id);
        currentPage = page("narrative", currentChapter || currentPart || title, [], pageIndex++, 1);
      }
      currentPage.blocks.push(textBlock(part, blockIndex++, "body"));
    }
  }
  pendingText = [];
}

function finishPage() {
  flushText();
  if (currentPage && currentPage.blocks.length > 0) {
    pages.push(currentPage);
    currentNode.pageIds.push(currentPage.id);
    currentPage = null;
  }
}

function startNode(label, kind) {
  currentNode = { id: id("node", label, nodes.length), label, kind, pageIds: [] };
  nodes.push(currentNode);
}

function startPage(template, label, columns = 1) {
  finishPage();
  currentPage = page(template, label, [], pageIndex++, columns);
}

for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
  const line = lines[lineIndex].trim();
  if (!line || line === "---") continue;
  const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
  if (heading) {
    const level = heading[1].length;
    const label = heading[2].trim();
    if (level === 1 && label !== title) {
      startPage("part_opening", label);
      startNode(label, "part");
      currentPage.blocks.push(headingBlock(label, 1, blockIndex++));
      currentPart = label;
      currentChapter = "";
      continue;
    }
    if (level === 2) {
      const isToc = label.toLowerCase() === "sumário";
      startPage(isToc ? "toc" : "chapter_opening", label, isToc ? 1 : 1);
      if (!isToc) startNode(label, "chapter");
      currentPage.blocks.push(headingBlock(label, isToc ? 1 : 2, blockIndex++));
      currentPart = currentPart || title;
      currentChapter = label;
      continue;
    }
    /* Um subtítulo nunca fica isolado no rodapé: se não houver espaço para
       o título e pelo menos o primeiro bloco, abre uma página de continuação. */
    if (currentPage && pageTextLength(currentPage) > MAX_PAGE_CHARS - 420) {
      finishPage();
      startPage("narrative", currentChapter || currentPart || title, 1);
    }
    flushText();
    if (!currentPage) startPage("narrative", currentChapter || currentPart || title, 1);
    currentPage.blocks.push(headingBlock(label, level, blockIndex++));
    continue;
  }
  if (/^[-*]\s+/u.test(line)) {
    pendingText.push(line);
    continue;
  }
  pendingText.push(line);
  if (pendingText.join(" ").length > 1200) flushText();
}
finishPage();

const tocPage = pages.find((candidate) => candidate.template === "toc");
if (tocPage) {
  const tocIndex = pages.indexOf(tocPage);
  const tocChunks = [];
  const tocCandidates = pages
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.template === "part_opening" || candidate.template === "chapter_opening")
    .map(({ candidate, index }) => ({
      label: candidate.title,
      page: index + 1,
      level: candidate.template === "part_opening" ? "part" : "chapter",
    }));
  for (let offset = 0; offset < tocCandidates.length; offset += 14) {
    tocChunks.push(tocCandidates.slice(offset, offset + 14));
  }
  const frontMatter = nodes[0];
  const tocPages = tocChunks.map((_, index) =>
    index === 0
      ? tocPage
      : page("toc", `Sumário (${index + 1})`, [], pageIndex++, 1),
  );
  pages.splice(tocIndex, 1, ...tocPages);
  tocPages.forEach((candidate) => {
    if (!frontMatter.pageIds.includes(candidate.id)) frontMatter.pageIds.push(candidate.id);
  });
  const entries = pages
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.template === "part_opening" || candidate.template === "chapter_opening")
    .map(({ candidate, index }) => ({
      label: candidate.title,
      page: index + 1,
      level: candidate.template === "part_opening" ? "part" : "chapter",
    }));
  tocPages.forEach((candidate, index) => {
    candidate.blocks = [
      { id: id("toc", candidate.title, blockIndex++), type: "toc", columns: 1, entries: entries.slice(index * 14, index * 14 + 14) },
    ];
  });
}

const book = {
  schemaVersion: 1,
  meta: {
    title,
    subtitle: "Livro II — Regras do Jogo",
    author: "",
    imprint: "",
    edition: "",
    firstFolio: 1,
    pageCount: pages.length,
    source: path.basename(input),
    sourceSha256: sourceHash,
  },
  tokens: {
    pageWidth: "140mm",
    pageHeight: "210mm",
    bleed: "5mm",
    marginInner: "18mm",
    marginOuter: "14mm",
    marginTop: "18mm",
    marginBottom: "22mm",
    columnGap: "6mm",
    bodySize: "10pt",
    bodyLeading: "13.5pt",
    rulesSize: "9.5pt",
    rulesLeading: "12.5pt",
    tableSize: "8.5pt",
    h1Size: "22pt",
    h2Size: "14pt",
    h3Size: "11pt",
    fontDisplay: '"EB Garamond", "Garamond", "Times New Roman", serif',
    fontBody: '"EB Garamond", "Garamond", "Times New Roman", serif',
    fontFunctional: '"Liberation Sans", Arial, Helvetica, sans-serif',
  },
  nodes,
  pages,
  assets: [],
  fonts: [],
  spreads: [],
  tableStyles: [],
  recipes: [],
  sheetTemplates: [],
  sheetInstances: [],
};

await writeFile(output, `${JSON.stringify(book, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, source: input, sourceSha256: sourceHash, pages: pages.length, nodes: nodes.length }));
