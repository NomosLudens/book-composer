# BOOK COMPOSER — PHASE 2A.5

## 1. Instrumentation and diagnosis

A causa concreta do primeiro freeze foi localizada no componente `src/book/EditorialMeasurementSurface.tsx`: ele montava todas as 3096 unidades e todos os descendentes dos blocos na mesma árvore DOM antes de qualquer leitura geométrica.

O caminho também fazia a preparação de dados no thread principal e a leitura DOM só ocorria depois da reconciliação completa. O primeiro teste integral parou de responder durante essa montagem/medição.

```text
FREEZE_STAGE=measurement surface mount/layout
FREEZE_ROOT_CAUSE=3096 unidades montadas simultaneamente em uma única surface DOM
FREEZE_ROOT_CAUSE_IDENTIFIED=YES
```

Não houve evidência de loop do paginador ou de parse duplicado na segunda tentativa; o parse duplicado detectado anteriormente também foi removido.

## 2. Implemented strategy

Foi implementada medição geométrica em lotes no mesmo renderer:

```text
EditorialUnits
→ lote de 100 unidades
→ BlockRenderer + CSS real
→ getBoundingClientRect em leitura batch
→ requestAnimationFrame
→ próximo lote
→ mapa completo
→ paginate once
```

```text
MEASUREMENT_STRATEGY=DOM_BATCHED_REAL_RENDERER
MEASUREMENT_BATCH_SIZE=100
MEASUREMENT_DOM_NODE_COUNT=bounded_by_batch
DOM_MEASUREMENT_READS=1 por unidade medida
MEASUREMENT_SURFACE_RENDER_COUNT=1 por lote
STATE_UPDATES_DURING_MEASUREMENT=1 por lote
MARKDOWN_RENDER_PARSE_CALLS=1 por bloco renderizado; sem novo parse estrutural
FONT_READY_WAITS_PER_IMPORT=1 por surface
```

O lote usa `requestAnimationFrame` entre etapas e não usa `setTimeout`, altura estimada ou cache persistente.

## 3. Profiling

```text
UNITS_100_TOTAL_MS=NOT_COLLECTED
UNITS_250_TOTAL_MS=NOT_COLLECTED
UNITS_500_TOTAL_MS=NOT_COLLECTED
UNITS_1000_TOTAL_MS=NOT_COLLECTED
UNITS_2000_TOTAL_MS=NOT_COLLECTED
UNITS_3096_TOTAL_MS=NOT_COMPLETED
```

O perfil de lotes foi instrumentado por marcos de lote no console, mas a execução integral posterior não chegou a abrir o diálogo de importação na sessão do navegador.

## 4. Stage timings

```text
STAGE_MEASUREMENT_PREP_MS=NOT_COLLECTED
STAGE_SURFACE_RENDER_MS=NOT_COLLECTED
STAGE_FONT_READY_MS=NOT_COLLECTED
STAGE_DOM_MEASURE_MS=NOT_COLLECTED
STAGE_MEASUREMENT_MAP_MS=NOT_COLLECTED
STAGE_PAGINATION_MS=NOT_COLLECTED
STAGE_BOOK_MATERIALIZATION_MS=NOT_COLLECTED
```

## 5. Real manuscript status

```text
REAL_EDITORIAL_UNITS=3096
REAL_MEASUREMENT_PASSES=0 concluídas nesta rodada
REAL_MEASUREMENT_UNIT_COUNT=0 observado
REAL_MEASUREMENT_DUPLICATE_COUNT=0 observado
MEASUREMENT_FAILED_UNITS=NOT_OBSERVED
MEASUREMENT_ZERO_HEIGHT_UNITS=NOT_OBSERVED
```

O primeiro submit integral confirmou o freeze na surface antiga. Após a correção, uma nova sessão ficou não responsiva antes de abrir o diálogo; portanto não é possível atribuir a segunda ocorrência à surface nova sem uma execução que alcance o submit.

## 6. Pagination and product gates

```text
REAL_PAGINATED_UNITS=NOT_OBSERVED
REAL_UNPAGINATED_UNITS=NOT_OBSERVED
REAL_GEOMETRIC_PAGE_COUNT=NOT_OBSERVED
DISPLAYED_PAGES_SOURCE=NOT_PROVEN_FOR_FULL_MANUSCRIPT
DISPLAYED_PAGE_COUNT=NOT_OBSERVED
GEOMETRIC_PAGE_COUNT=NOT_OBSERVED
COUNTS_MATCH=NOT_PROVEN
REAL_PAGE_NAVIGATION=NOT_PROVEN_FOR_FULL_MANUSCRIPT
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=NOT_MEASURED
REAL_ORPHAN_HEADINGS=NOT_MEASURED
REAL_OVERSIZED_UNITS=NOT_MEASURED
REAL_EMPTY_PAGES=NOT_MEASURED
```

## 7. Performance status

```text
IMPORT_UI_FATAL_FREEZE=YES no primeiro submit integral; NÃO REVALIDADO após batching
MAX_MAIN_THREAD_LONG_TASK_MS=NOT_COLLECTED
```

## 8. Regression

```text
IR_BOOK_CONSERVATION=PASS
TYPECHECK=PASS
```

## 9. Files changed

- `src/book/EditorialMeasurementSurface.tsx`: batching de 100 unidades, leitura geométrica por lote, `requestAnimationFrame` entre lotes e um único `document.fonts.ready`.
- `docs/BOOK_COMPOSER_PHASE_2A_5.md`: este registro.

## 10. Final verdict

```text
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_5_COMPLETE=NO
PHASE_2A_COMPLETE=NO
BLOCKER=full-manuscript UI validation did not complete after the batching implementation; the fix is implemented, but recovery and 3096-unit measurement remain unproven.
```

