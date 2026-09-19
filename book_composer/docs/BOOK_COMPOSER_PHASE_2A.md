# BOOK COMPOSER — PHASE 2A

## 1. Scope

Esta execução introduziu a camada mínima de unidades editoriais e preparou um paginador orientado por medições reais. Não foram implementados PDF, TOC iterativo, tabelas complexas, imagens avançadas ou reimportação.

## 2. Existing renderer/layout architecture

O renderer de produção é `src/book/renderer/PageRenderer.tsx`, que usa os templates existentes e `BlockRenderer`. O CSS autoritativo de geometria está em `src/book/styles/page.css`; os tokens físicos estão em `src/book/types.ts` (`210mm × 297mm`, margens `18/14/16/18mm`). A medição existente está em `src/lib/preflight/measure.ts` e já usa `scrollHeight`, `clientHeight`, `getBoundingClientRect()` e `document.fonts.check()`.

```text
EXISTING_EDITORIAL_BLOCK_TYPES=heading,text,image,quote,table,box,caption,divider,toc,lockup,form,sheet,shape,layout,list (novo)
EXISTING_RENDERABLE_BLOCK_TYPES=heading,text,image,quote,table,box,caption,divider,toc,lockup,form,sheet,shape,layout,list
EXISTING_MEASUREMENT_CODE=src/lib/preflight/measure.ts
EXISTING_OVERFLOW_CODE=src/lib/preflight/measure.ts; src/routes/print.tsx
EXISTING_PAGE_GEOMETRY=BookTokens + .k-page/.k-page__content
```

## 3. Editorial Unit model

`src/book/editorial-units.ts` agora define `EditorialUnit`, mantendo `sourceNodeIds`, tipo semântico, regras básicas de agrupamento, divisibilidade e payload. Também define diagnósticos mínimos e razões de quebra.

## 4. IR → Editorial Unit mapping

O mapeamento mínimo preserva headings, parágrafos, listas ordenadas/não ordenadas, citações e separadores. Foi criado `ListBlock`; a proveniência continua em `metadata.sourceNodeId`.

```text
HEADING_SEMANTICS_PRESERVED=YES
PARAGRAPH_SEMANTICS_PRESERVED=YES
LIST_SEMANTICS_PRESERVED=YES
BLOCKQUOTE_SEMANTICS_PRESERVED=YES
```

## 5. Page geometry

```text
PAGE_WIDTH=210mm
PAGE_HEIGHT=297mm
MARGIN_TOP=16mm
MARGIN_RIGHT=14mm/18mm conforme recto-verso
MARGIN_BOTTOM=18mm
MARGIN_LEFT=18mm/14mm conforme recto-verso
CONTENT_WIDTH=derivado por .k-page__content
CONTENT_HEIGHT=derivado por .k-page__content
```

Não foi criada uma segunda fonte de dimensões.

## 6. Measurement strategy

`paginateEditorialUnits()` recebe medições reais por unidade (`height`) e não usa caracteres, palavras ou limiares artificiais. A medição ainda precisa ser conectada ao fluxo de importação para que as unidades sejam renderizadas pelo DOM de produção antes da paginação.

```text
REAL_GEOMETRIC_MEASUREMENT=PARTIAL
MEASUREMENT_RENDERER=PageRenderer + BlockRenderer (infraestrutura existente)
FONTS_READY_BEFORE_MEASUREMENT=PARTIAL (print route aguarda document.fonts.ready; importação ainda não)
CHARACTER_COUNT_PAGINATION=NO
```

## 7. Font readiness

`/print` já aguarda `document.fonts.ready` quando disponível. O novo caminho de paginação ainda não possui uma etapa própria de montagem/medição no navegador.

## 8. Pagination algorithm

O algoritmo básico foi criado em `src/book/editorial-units.ts`, com quebra por `BREAK_BEFORE`, `KEEP_WITH_NEXT` e `OVERFLOW`, progresso por unidade e diagnóstico para unidade indivisível maior que a área disponível. Ele ainda não governa `Book.pages` no fluxo real.

## 9. Break rules

Headings recebem `keepWithNext=true`; headings de nível 1 e 2 recebem `breakBefore=true`; parágrafos e listas são potencialmente divisíveis. Controle tipográfico completo de viúvas/órfãs permanece fora desta fase.

## 10. Overflow protection

O preflight existente continua sendo a defesa pós-layout. A validação real abaixo demonstra por que o motor ainda não pode ser considerado fechado.

## 11. Heading orphan protection

Não há prova de `ORPHAN_HEADING_COUNT=0` no fluxo real, porque a importação ainda não usa `EditorialUnit` para reconstruir as páginas.

## 12. Synthetic pagination test

`SYNTHETIC_EDITORIAL_UNITS=NOT_RUN` nesta execução. O fixture geométrico dedicado ainda precisa ser conectado a um ambiente DOM que monte os mesmos componentes de produção.

## 13. Real KALLISTIS pagination

O aplicativo foi aberto em `http://127.0.0.1:4173/`. O editor abriu e o livro ficou visível. A medição read-only das páginas renderizadas retornou:

```text
REAL_APP_OPEN=YES
REAL_BOOK_VISIBLE=YES
REAL_PAGE_NAVIGATION=NOT_PROVEN
REAL_PAGE_COUNT=473
REAL_PAGES_WITH_OVERFLOW=183
REAL_AVG_FILL_RATIO=0.06555
REAL_MIN_FILL_RATIO=0
REAL_MAX_FILL_RATIO=0.10243
```

O maior excesso medido foi `332851px` na caixa de conteúdo. Isso confirma que o Book atualmente exibido ainda é uma estrutura materializada antiga, não o resultado da nova paginação geométrica.

## 14. Determinism

```text
PAGINATION_DETERMINISTIC=NOT_PROVEN
```

O paginador puro é determinístico para o mesmo conjunto de medições, mas ainda não houve duas execuções do fluxo DOM completo.

## 15. Conservation regression

```text
IR_BOOK_CONSERVATION=PASS
TYPECHECK=PASS
```

Os comandos `bun run test:ir-book-conservation`, `bun run test:markdown-conservation`, `bun run typecheck` e `git diff --check` passaram. A conservação da Fase 1 não foi quebrada.

## 16. Manual browser validation

```text
REAL_APP_OPEN=YES
REAL_BOOK_VISIBLE=YES
REAL_PAGE_NAVIGATION=NOT_PROVEN
FATAL_BROWSER_ERRORS=NO_FATAL_APP_EXCEPTION; VITE_HMR_CONNECTION_WARNING
```

## 17. Remaining unsupported units

```text
UNSUPPORTED_EDITORIAL_UNIT_COUNT=at least 1 in real manuscript
UNSUPPORTED_EDITORIAL_UNIT_TYPES=code; tables/images remain outside the safe geometry path
```

## 18. Final verdict

```text
EDITORIAL_UNIT_LAYER=YES
REAL_GEOMETRIC_MEASUREMENT=PARTIAL
PAGES_WITH_OVERFLOW=183
ORPHAN_HEADING_COUNT=UNVERIFIED
PAGINATION_DETERMINISTIC=NOT_PROVEN
IR_BOOK_CONSERVATION=PASS
TYPECHECK=PASS
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_COMPLETE=NO
BLOCKER=EditorialUnit ainda não está conectada ao fluxo real de importação/renderização; o app continua exibindo páginas materializadas e a medição real encontrou overflow em 183 páginas.
```

