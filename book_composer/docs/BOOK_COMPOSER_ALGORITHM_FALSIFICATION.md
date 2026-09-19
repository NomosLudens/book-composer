# BOOK COMPOSER — ALGORITHM FALSIFICATION REPORT

## 1. Executive verdict

```text
VERDICT=INCIDENT
SEVERITY=P0
ALGORITHM_EDITORIALLY_RELIABLE=NO
```

The current `transformMarkdownToBook()` is a structural prototype, not a reliable book importer. It can lose content, lose the table of contents, misinterpret valid Markdown, and create pages without geometric validation.

## 2. Real pipeline discovered

```text
Markdown text
→ src/book/markdown-book.ts::transformMarkdownToBook
→ Book { nodes, pages, blocks }
→ src/book/renderer/PageRenderer.tsx
→ template component / BlockRenderer / Markdown renderer
→ /print and PDF paths
```

There are two additional, different paths:

```text
Toolbar “Colar inteligente”
→ src/book/authoring.ts::parseSmartPaste
→ blocks inserted into the selected page
```

and:

```text
scripts/import-markdown-book.mjs
→ Node-only KALLISTIS-specific JSON generator
```

These paths do not share one parser or one semantic intermediate representation.

## 3. Core invariants

| Invariant | Status | Evidence |
|---|---|---|
| No content loss | **FAIL / P0** | Introductory text has no page before first heading; `flush()` clears it when `currentPage` is null (`markdown-book.ts:51-54`). |
| No duplication | **UNVERIFIED** | No conservation test exists. |
| Order preserved | **UNVERIFIED** | No token-based end-to-end test exists. |
| Semantics preserved | **FAIL / P0** | Lists and rules become text; headings are the only structural parser. |
| Deterministic output | **PARTIAL** | IDs are deterministic in this function, but the product has separate import paths and persistence normalization. |
| Stable identities | **UNVERIFIED** | No reimport identity contract or test exists. |
| Real geometric layout | **FAIL / P1** | Pagination uses `paragraph.length > 1800` (`markdown-book.ts:109-110`). |
| Editorial break rules | **FAIL / P1** | No keep-together, widow/orphan, or break-reason model exists in the imported blocks. |
| TOC reliable | **FAIL / P0** | TOC page is never pushed into `pages` (`markdown-book.ts:91-97`). |
| Preview equals print | **UNVERIFIED** | No paired preview/PDF evidence was produced for this function. |

## 4. P0 findings

### F-001 — TOC page is discarded

```text
ID=F-001
SEVERITY=P0
TYPE=IMPLEMENTATION_BUG
COMPONENT=src/book/markdown-book.ts:91-97
INPUT=## Sumário followed by valid content
EXPECTED=TOC page exists in Book.pages and contains entries
ACTUAL=start() creates currentPage, then the code stores only its ID and sets currentPage=null; pages.push() is never called
EVIDENCE=markdown-book.ts:91-97
IMPACT=TOC can be absent from the generated book while its ID remains in a node
ROOT_CAUSE=page lifecycle is manually mutated outside finish()
LOCAL_FIX_POSSIBLE=Yes, but the lifecycle needs one owner
ARCHITECTURAL_CHANGE_REQUIRED=Yes for reliable page construction
```

### F-002 — Introductory content can be lost

```text
ID=F-002
SEVERITY=P0
TYPE=IMPLEMENTATION_BUG
COMPONENT=src/book/markdown-book.ts:51-54, 109-110
INPUT=Text before the first heading, longer than the buffer threshold
EXPECTED=Text appears once before the first structural heading
ACTUAL=flush() clears paragraph even when currentPage is null
EVIDENCE=if (content && currentPage) ...; paragraph=[]
IMPACT=published content disappears without an error
ROOT_CAUSE=parser accepts text before it has allocated a destination unit
LOCAL_FIX_POSSIBLE=Yes
ARCHITECTURAL_CHANGE_REQUIRED=Yes: parse content before pagination
```

### F-003 — Valid Markdown is silently downgraded to plain text

```text
ID=F-003
SEVERITY=P0
TYPE=ARCHITECTURAL_DEFECT
COMPONENT=src/book/markdown-book.ts:72-110 and authoring.ts:992-1022
INPUT=table, blockquote, ordered/nested list, fenced code, image or footnote
EXPECTED=semantic block or explicit unsupported-feature diagnostic
ACTUAL=most constructs become one text block or are ignored
IMPACT=content meaning and layout intent are silently corrupted
ROOT_CAUSE=heading/line heuristics instead of a Markdown AST
LOCAL_FIX_POSSIBLE=No, not safely
ARCHITECTURAL_CHANGE_REQUIRED=Yes: AST parser plus loss report
```

## 5. P1 findings

### F-004 — Character count is used as a physical pagination metric

```text
ID=F-004
SEVERITY=P1
TYPE=ARCHITECTURAL_DEFECT
COMPONENT=src/book/markdown-book.ts:109-110
EXPECTED=page breaks based on rendered geometry
ACTUAL=paragraph length threshold of 1800 characters
IMPACT=font, bold, glifos, headings, lists, tables, margins and language change the height without changing the metric
ROOT_CAUSE=parsing and layout are coupled before rendering
LOCAL_FIX_POSSIBLE=No, changing 1800 is not a solution
ARCHITECTURAL_CHANGE_REQUIRED=Yes
```

### F-005 — No keep-with-next or keep-together model

Headings, rule labels, Merge forms, captions, lists and tables have no explicit relation. A heading can be placed at the end of a page, and a rule can be split between pages.

```text
SEVERITY=P1
TYPE=ARCHITECTURAL_DEFECT
```

### F-006 — Heading hierarchy is lossy

`Math.min(5, h.level)` converts H6 to H5 (`markdown-book.ts:102`). This destroys semantic information and prevents a later renderer from distinguishing item/detail levels.

```text
SEVERITY=P1
TYPE=IMPLEMENTATION_BUG
```

### F-007 — Nodes and pages have separate mutable lifecycles

`pages.push`, `currentNode.pageIds.push`, and `currentPage=null` are performed in different functions and branches. F-001 is a direct consequence. The model can contain a node reference for a page that is absent from `Book.pages`.

```text
SEVERITY=P1
TYPE=ARCHITECTURAL_DEFECT
```

## 6. P2 findings

- `---` is discarded globally (`markdown-book.ts:74`), with no distinction between front matter, thematic break, code, or content.
- Front matter is not parsed; metadata is always synthesized as empty strings (`markdown-book.ts:126`).
- Lists are appended to a paragraph buffer (`markdown-book.ts:105-107`), not represented as list units.
- Merge forms are not recognized as units; labels such as `Custo`, `Limite` and `Efeito` remain text.
- The TOC includes only part/chapter opening pages, not an explicit policy for appendices, front matter or printed folios.
- There is no source mapping from output block/page to input line range.
- Reimport semantics are undefined: replace, merge and preservation of user edits are not specified.
- `parseSmartPaste` and `transformMarkdownToBook` implement different Markdown languages.

## 7. P3 findings

- No author-facing diagnostic says which Markdown constructs were unsupported.
- No report exposes a break reason for an automatically created page.
- The generic importer defaults to one column and generic tokens regardless of document intent.

## 8. Content conservation

The required token torture test was not accepted as PASS because no real end-to-end token fixture and output comparator exist yet.

```text
TOKENS_EXPECTED=UNVERIFIED
TOKENS_FOUND=UNVERIFIED
TOKENS_MISSING=UNVERIFIED
TOKENS_DUPLICATED=UNVERIFIED
TOKENS_OUT_OF_ORDER=UNVERIFIED
```

Static analysis already proves at least one P0 loss path: introductory text flushed while `currentPage` is null.

## 9. Markdown parsing

The implementation is a line heuristic, not a CommonMark/GFM parser. It recognizes ATX headings and a text prefix that resembles a list. It does not parse code fences, setext headings, blockquotes, tables, ordered lists, nested lists, images, links, HTML, footnotes or escaped syntax into the Book model.

## 10. Semantic structure

The current model distinguishes page templates and block types, but the importer only creates `heading`, `text` and `toc`. The semantic richness already present in `Book` is not reached by Markdown import.

## 11. Editorial blocks

No `keepTogether`, `keepWithNext`, `breakBefore`, `breakAfter`, `widowControl`, `orphanControl` or `breakReason` metadata is created by the importer.

## 12. Pagination

No DOM measurement, font readiness, image readiness, print CSS measurement or iterative pagination exists in `transformMarkdownToBook()`. Its own comment admits that fine pagination is left to the renderer/preflight, but no importer-to-renderer pagination contract is present.

## 13. TOC

```text
TOC_PAGE_NUMBERS_RELIABLE=NO
TOC_STABILIZATION=ABSENT
```

There is no fixed-point or relayout loop after TOC insertion.

## 14. Tables

```text
TABLE_IMPORT_FROM_TRANSFORM=UNSUPPORTED
TABLE_CONTINUATION=UNVERIFIED
REPEATING_HEADER=UNVERIFIED
```

`parseSmartPaste` has separate table heuristics, proving the product has no single table grammar for Markdown import.

## 15. Images

```text
IMAGE_IMPORT_FROM_TRANSFORM=UNSUPPORTED
ASSET_READINESS=UNVERIFIED
CAPTION_KEEP_TOGETHER=UNVERIFIED
```

## 16. Determinism and IDs

The new transform uses deterministic sequential IDs, but semantic stability is not proven: inserting a heading shifts later IDs, and there is no source identity or reimport mapping.

```text
DETERMINISTIC=PARTIAL
STABLE_IDENTITIES=NO
```

## 17. Reimport behavior

```text
REIMPORT_SEMANTICS=UNDEFINED
USER_EDIT_PRESERVATION=UNVERIFIED
INCREMENTAL_UPDATE=UNSUPPORTED
```

## 18. Source mapping

```text
SOURCE_MAPPING=ABSENT
```

No block or page records source file, source line start/end, or source node identity.

## 19. Synthetic torture test

The required fixture was not run through a trusted end-to-end pipeline because the current transformer does not expose a loss report and the TOC lifecycle is already invalid. It must be added before any PASS claim.

Required next artifact:

```text
fixtures/markdown-book-adversarial.md
scripts/assert-markdown-book-conservation.mjs
```

## 20. Real manuscript test

The real KALLISTIS manuscript demonstrates the failure class previously observed: oversized paragraphs, raw heading markers, fragmented rule content, unstable TOC and inadequate page density. This is corroborating evidence, not a substitute for a token conservation test.

## 21. Architectural diagnosis

The fundamental error is performing page construction while still parsing lines. Parsing, semantic normalization and geometric pagination are separate problems and currently share mutable state.

## 22. Minimum viable corrective architecture

```text
source bytes
→ front-matter parser
→ CommonMark/GFM AST
→ semantic intermediate representation
→ source-mapped editorial units
→ template/block selection
→ browser measurement with final fonts/assets
→ pagination with keep/break constraints
→ TOC generation
→ second layout pass until stable
→ conservation/preflight report
→ Book JSON
```

The semantic intermediate representation must contain at least:

```text
source range
semantic role
children
keepWithNext
keepTogether
breakBefore
breakAfter
preferred template
allowed split policy
```

## 23. Final verdict

```text
NO_CONTENT_LOSS=FAIL
NO_CONTENT_DUPLICATION=UNVERIFIED
ORDER_PRESERVED=UNVERIFIED
SEMANTICS_PRESERVED=FAIL
DETERMINISTIC_OUTPUT=PARTIAL
STABLE_IDENTITIES=FAIL
REAL_GEOMETRIC_LAYOUT=FAIL
EDITORIAL_BREAK_RULES=FAIL
TOC_RELIABLE=FAIL
PREVIEW_EQUALS_PRINT=UNVERIFIED
VERDICT=INCIDENT
SEVERITY=P0
```

The current algorithm must not be used to claim a production-quality Markdown-to-book workflow. The next implementation should replace the line heuristic with a parser/IR/layout pipeline and make unsupported syntax fail visibly instead of silently becoming text.
