# BOOK COMPOSER — PHASE 2A.2

## 1. Scope

Esta fase foi auditada com o objetivo de transferir a autoridade de `Book.pages` para o paginador geométrico. A conservação IR → Book e a camada `EditorialUnit` foram preservadas. A troca final não foi feita por estimativa: ela exige montagem DOM real antes de `replaceBook()`.

## 2. Legacy page flow

```text
Toolbar.tsx submit
→ transformMarkdownToBook()
→ transformDocumentToBook()
→ criação direta de Page[] em src/book/markdown-book.ts
→ replaceBook()
→ PageRenderer
```

```text
LEGACY_PAGE_CREATION_FILE=src/book/markdown-book.ts
LEGACY_PAGE_CREATION_FUNCTION=transformDocumentToBook
LEGACY_BREAK_DECISION=branches de heading/currentPage/start/finish
REPLACE_BOOK_CALLSITE=src/editor/components/Toolbar.tsx
```

## 3. Integration point

O ponto de corte está localizado, mas ainda não substituído. `transformDocumentToBook()` continua responsável por criar páginas antes de qualquer medição.

## 4. Measurement surface

O renderer de produção disponível é `PageRenderer` + `BlockRenderer`, e o preflight mede DOM real. Não foi criada uma surface transitória nesta execução porque ela precisa ser montada pelo React antes da chamada única de `replaceBook()`.

```text
MEASUREMENT_RENDERER=PageRenderer + BlockRenderer (disponível)
MEASUREMENT_UNIT_COUNT=NOT_COLLECTED
MEASUREMENT_FAILED_UNITS=NOT_COLLECTED
MEASUREMENT_ZERO_HEIGHT_UNITS=NOT_COLLECTED
```

## 5. Font readiness

`/print` aguarda `document.fonts.ready`, mas o importador principal ainda não possui uma fase assíncrona de medição.

```text
FONTS_READY_BEFORE_MEASUREMENT=PARTIAL
```

## 6. Unit measurement

O manuscrito real possui:

```text
REAL_EDITORIAL_UNITS=3096
REAL_EDITORIAL_HEADINGS=756
REAL_EDITORIAL_PARAGRAPHS=2297
REAL_EDITORIAL_LISTS=4
REAL_EDITORIAL_QUOTES=0
REAL_EDITORIAL_SEPARATORS=33
```

Os blocos possuem `editorialUnitId`, mas ainda não foram medidos por unidade em uma surface DOM.

## 7. Geometric pagination

`paginateEditorialUnits()` continua sendo o único paginador geométrico. Ele recebe medições reais, registra `breakReason` e diagnostica unidades oversized. Não foi alterado para aceitar alturas inventadas.

## 8. Book.pages materialization

Ainda não materializada a partir do resultado geométrico. O `Book.pages` final continua vindo do caminho estrutural legado.

## 9. Legacy paginator isolation

```text
REAL_FLOW_PAGINATOR=STRUCTURAL_LEGACY
LEGACY_PAGINATOR_ACTIVE_IN_REAL_FLOW=YES
LEGACY_PAGINATOR_RETAINED=YES
LEGACY_PAGINATOR_REAL_FLOW_USAGE=YES
```

## 10. Synthetic validation

```text
SYNTHETIC_EDITORIAL_UNITS=NOT_RUN
SYNTHETIC_MEASURED_UNITS=NOT_RUN
SYNTHETIC_PAGE_COUNT=NOT_RUN
SYNTHETIC_PAGES_WITH_OVERFLOW=NOT_RUN
SYNTHETIC_ORPHAN_HEADINGS=NOT_RUN
SYNTHETIC_OVERSIZED_UNITS=NOT_RUN
SYNTHETIC_PAGINATION_DETERMINISTIC=NOT_PROVEN
```

## 11. Real KALLISTIS validation

O parser e a conservação do manuscrito completo continuam passando. A paginação geométrica ainda não foi executada sobre as 3096 unidades.

```text
REAL_MEASURED_UNITS=0
REAL_GEOMETRIC_PAGE_COUNT=NOT_MATERIALIZED
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=NOT_MEASURED
REAL_ORPHAN_HEADINGS=NOT_PROVEN
REAL_OVERSIZED_UNITS=NOT_PROVEN
REAL_PAGINATION_DETERMINISTIC=NOT_PROVEN
```

## 12. Displayed-page proof

```text
DISPLAYED_PAGES_SOURCE=STRUCTURAL_LEGACY
DISPLAYED_PAGE_COUNT=473 (fluxo antigo observado anteriormente)
GEOMETRIC_PAGE_COUNT=NOT_AVAILABLE
COUNTS_MATCH=NOT_PROVEN
```

## 13. Overflow after integration

Não foi recalculado. O valor anterior de 183 páginas com overflow pertence ao fluxo legado e não foi reutilizado como resultado geométrico.

## 14. Heading orphan results

```text
REAL_ORPHAN_HEADINGS=NOT_PROVEN
```

## 15. Conservation regression

```text
IR_BOOK_CONSERVATION=PASS
TYPECHECK=PASS
```

## 16. Performance

Não foi iniciado um ciclo de medição DOM de 3096 unidades; portanto não há passes duplicados ou congelamento novo atribuível a esta fase.

## 17. Manual validation

O aplicativo abre e o livro legado aparece. Isso não prova o novo resultado geométrico.

```text
REAL_APP_OPEN=YES
REAL_BOOK_VISIBLE=YES
REAL_PAGE_NAVIGATION=NOT_PROVEN_FOR_GEOMETRIC_OUTPUT
FATAL_BROWSER_ERRORS=NONE_FATAL_OBSERVED
IMPORT_UI_FATAL_FREEZE=NOT_OBSERVED_IN_THIS_PHASE
```

## 18. Remaining blockers

- montar uma surface React transitória com os componentes de produção;
- aguardar `document.fonts.ready`;
- coletar uma medida por unidade;
- executar o paginador;
- materializar `Page[]` somente depois do resultado;
- executar uma única chamada final a `replaceBook()`;
- provar no navegador que as páginas exibidas são as páginas geométricas.

## 19. Final verdict

```text
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_2_COMPLETE=NO
PHASE_2A_COMPLETE=NO
BLOCKER=GEOMETRIC_PAGINATOR_NOT_AUTHORITATIVE; Book.pages ainda nasce antes da medição DOM real.
```

