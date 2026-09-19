# BOOK COMPOSER — PHASE 1C

## 1. Scope

Esta fase prova somente a conservação entre o manuscrito Markdown, o IR semântico e o `Book` estrutural. Não avalia paginação, geometria, PDF, CSS, fontes, TOC ou densidade visual.

## 2. IR classifications

Nós `heading`, `paragraph`, `list`, `blockquote`, `hr` e `table` são unidades `PRINTING`. `frontMatter` é `NON_PRINTING_METADATA`; `space` é `STRUCTURAL_ONLY`. Tipos diagnosticados pelo parser, como `code`, são `UNSUPPORTED_BUT_PRESERVED` nesta fase.

## 3. Provenance contract

Todo bloco importado leva `metadata.provenanceKind=IMPORTED`, `sourceNodeId`, `sourceStartLine`, `sourceEndLine` e, quando disponível, `sourceFile`. Blocos criados pelo editor (capa e TOC) levam `provenanceKind=SYNTHETIC_EDITORIAL` e não contam como importados sem fonte.

## 4. Cardinality contract

Cada unidade IR imprimível tem exatamente um destino importado no Book nesta transformação. A assertiva registra `CARDINALITY_VIOLATION` quando a cardinalidade observada é maior que um; nós sem destino são `IR_NODE_DROPPED`.

## 5. Assertor implementation

`scripts/assert-ir-book-conservation.ts` usa uma única instância de `MarkdownDocument` e chama `transformDocumentToBook(document)`. O caminho público anterior (`transformMarkdownToBook`) agora é apenas um adaptador compatível que executa Markdown → IR → Book.

## 6. Adversarial results

```text
ADVERSARIAL_IR_TOTAL=28
ADVERSARIAL_IR_PRINTING=18
ADVERSARIAL_BOOK_IMPORTED_BLOCKS=18
ADVERSARIAL_UNACCOUNTED=0
ADVERSARIAL_DUPLICATED=0
ADVERSARIAL_OUT_OF_ORDER=0
ADVERSARIAL_INVALID_SOURCE=0
```

## 7. Real KALLISTIS results

```text
REAL_IR_TOTAL=6191
REAL_IR_PRINTING=3095
REAL_BOOK_IMPORTED_BLOCKS=3096
REAL_UNACCOUNTED=0
REAL_DUPLICATED=0
REAL_OUT_OF_ORDER=0
REAL_INVALID_SOURCE=0
```

Os `3096` blocos importados correspondem às `3095` unidades `PRINTING` mais o nó `code` classificado como `UNSUPPORTED_BUT_PRESERVED`. O manuscrito completo usado foi `/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md`.

## 8. Missing mappings

Nenhum: `IR_NODE_DROPPED=0` e `BOOK_BLOCKS_WITHOUT_SOURCE=0`.

## 9. Cardinality violations

`CARDINALITY_VIOLATIONS=0`.

## 10. Order violations

`ORDER_VIOLATIONS=0`.

## 11. Invalid provenance

`BOOK_BLOCKS_WITH_INVALID_SOURCE=0` nos testes adversarial e real.

## 12. Unsupported preserved nodes

No manuscrito real, `code` foi classificado como `UNSUPPORTED_BUT_PRESERVED`, permaneceu no IR e recebeu destino no Book:

```text
UNSUPPORTED_PRESERVED_COUNT=1
UNSUPPORTED_PRESERVED_TYPES=code
UNSUPPORTED_SILENTLY_DROPPED=0
```

## 13. Fixes applied

- Formalizada a extensão `metadata` no `BaseBlock`.
- Propagada proveniência para blocos importados.
- Marcados capa e TOC como `SYNTHETIC_EDITORIAL`.
- Separada a transformação IR → Book em `transformDocumentToBook`.
- Adicionado assertor real e comando `bun run test:ir-book-conservation`.

## 14. Final verdict

```text
TYPECHECK=PASS
ADVERSARIAL_UNACCOUNTED=0
ADVERSARIAL_DUPLICATED=0
ADVERSARIAL_OUT_OF_ORDER=0
ADVERSARIAL_INVALID_SOURCE=0
REAL_UNACCOUNTED=0
REAL_DUPLICATED=0
REAL_OUT_OF_ORDER=0
REAL_INVALID_SOURCE=0
PHASE_1_COMPLETE=YES
VERDICT=PASS
```

Esta aprovação é exclusivamente da fronteira de conservação IR → Book. Ela não declara que a paginação ou o PDF estão bons.
