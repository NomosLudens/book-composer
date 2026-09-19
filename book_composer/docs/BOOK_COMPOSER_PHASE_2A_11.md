# BOOK COMPOSER — PHASE 2A.11

## 1. Scope

Eliminar a multiplicação indevida de páginas e blocos no render final. Parser,
IR, EditorialUnit, paginator, batching, measurement surface, geometria,
overflow, oversized e IDs não foram alterados.

## 2. Render tree

```text
EDITOR_ROOT_COMPONENT=EditorLayout → PreviewArea
NODE_RENDER_COMPONENT=StructurePanel / PageRow
PAGE_LIST_COMPONENT=StructurePanel → grouped node.pageIds → PageRow
PAGE_RENDER_COMPONENT=PageRenderer
BLOCK_RENDER_COMPONENT=BlockRenderer
```

`PreviewArea` renderiza a página selecionada no `PageCanvas`. O painel de
estrutura renderiza `PageThumbnail` para as páginas listadas por node.

## 3. Node iteration

O callsite relevante era `StructurePanel.tsx:127`:

```text
book.nodes.map(node => node.pageIds.map(...))
```

Isso é correto somente se `node.pageIds` representar as páginas daquele node.
Antes da correção, `materializeGeometricPages` atribuía a lista inteira de
páginas geométricas a todos os nodes.

## 4. Page iteration

O callsite relevante era `StructurePanel.tsx:173`/`185`, que renderiza cada
`PageRow` e seu `PageThumbnail`. Não havia um `PageRenderer` global duplicado no
canvas; a multiplicação vinha da relação `node.pageIds` incorreta.

## 5. Nodes × pages hypothesis

A hipótese foi confirmada:

```text
29 nodes × 112 geometric pages = 3248
```

O baseline observado (~3.250 representações) correspondia a essa expansão no
painel de estrutura. Cada thumbnail contém um `PageRenderer` completo, portanto
a multiplicação também replicava blocos.

## 6. Page surfaces

Antes:

```text
FINAL_PAGE_SURFACES=canvas + StructurePanel thumbnails repetidos por node
PRIMARY_PAGE_REPRESENTATIONS=113
SECONDARY_PAGE_REPRESENTATIONS≈3248
UNEXPLAINED_PAGE_REPRESENTATIONS=YES
```

Depois:

```text
PRIMARY_PAGE_REPRESENTATIONS=113
SECONDARY_PAGE_REPRESENTATIONS=1 capa em thumbnail auxiliar
UNEXPLAINED_PAGE_REPRESENTATIONS=0
```

O DOM final mediu 114 nós `.k-page`: 112 páginas geométricas, uma capa
principal e uma representação auxiliar legítima da capa. Os IDs únicos foram
113.

## 7. Block multiplication

Baseline real:

```text
BEFORE_BLOCK_REPRESENTATIONS≈89784
```

Após a correção:

```text
LOGICAL_BOOK_BLOCK_COUNT=3096
PRIMARY_RENDERED_BLOCK_COUNT=3096
TOTAL_RENDERED_BLOCK_REPRESENTATIONS=3096
BLOCK_RENDER_MULTIPLIER=1.0
```

## 8. Root cause

```text
ROOT_CAUSE=NODES_RENDER_GLOBAL_PAGE_SET
ROOT_CAUSE_IDENTIFIED=YES
```

`materializeGeometricPages` fazia todos os nodes receberem todos os page IDs:

```ts
nodes: base.nodes.map(node => ({ ...node, pageIds: allGeometricPageIds }))
```

## 9. Minimal correction

Foi criado um mapa determinístico `sourceNodeId → BookNodeId` a partir das
páginas estruturais originais. Cada página geométrica é atribuída ao node dono
do primeiro bloco-fonte correspondente; a capa fica no node de front matter.
Nodes sem páginas permanecem vazios. Nenhum node foi removido e nenhum ID foi
alterado.

## 10. Fixture validation

```text
FIXTURE_LOGICAL_PAGES=5
FIXTURE_PRIMARY_PAGE_REPRESENTATIONS=5
FIXTURE_UNEXPLAINED_PAGE_REPRESENTATIONS=0
FIXTURE_LOGICAL_BLOCKS=18
FIXTURE_PRIMARY_BLOCK_REPRESENTATIONS=18
PAGE_ID_DUPLICATES=0
NODE_ID_DUPLICATES=0
```

Assertor, conservação IR, typecheck e diff check passaram.

## 11. Real KALLISTIS DOM validation

Fluxo real completo pela UI:

```text
REAL_LOGICAL_PAGES=113
REAL_PRIMARY_PAGE_REPRESENTATIONS=113
REAL_SECONDARY_PAGE_REPRESENTATIONS=1
REAL_UNEXPLAINED_PAGE_REPRESENTATIONS=0
FINAL_DOM_PAGE_REPRESENTATIONS=114 (113 IDs únicos)
FINAL_DOM_BLOCK_COUNT=3096
FINAL_DOM_ELEMENT_COUNT=17719
MEASUREMENT_SURFACE_PRESENT_AFTER_IMPORT=NO
```

Comparação:

```text
BEFORE_PAGE_REPRESENTATIONS≈3250
AFTER_PAGE_REPRESENTATIONS=114
PAGE_REPRESENTATION_REDUCTION≈3136 / 96.5%
BEFORE_BLOCK_REPRESENTATIONS≈89784
AFTER_BLOCK_REPRESENTATIONS=3096
BLOCK_REPRESENTATION_REDUCTION≈86688 / 96.6%
BEFORE_DOM_ELEMENTS≈483277
AFTER_DOM_ELEMENTS=17719
DOM_ELEMENT_REDUCTION≈465558 / 96.3%
```

## 12. Navigation regression

Navegação real pela lista de páginas:

```text
NAV_FIRST=PASS
NAV_NEXT=PASS (página intermediária selecionada)
NAV_PREVIOUS=NOT_SEPARATELY_EXERCISED
NAV_25_PERCENT=NOT_SEPARATELY_EXERCISED
NAV_MIDDLE=PASS — geometric-page-56
NAV_75_PERCENT=NOT_SEPARATELY_EXERCISED
NAV_LAST=PASS — geometric-page-112
NAVIGATION_WRONG_TARGETS=0 nos alvos exercitados
REAL_PAGE_NAVIGATION=PASS nos alvos first/middle/last
PAGE_RENDER_ORDER_MATCHES_BOOK=YES
COVER_PRIMARY_RENDER_COUNT=1
```

Após selecionar `geometric-page-112`, somente essa linha ficou com
`aria-current="page"`, confirmando o alvo correto.

## 13. Pagination regression

```text
REAL_EDITORIAL_UNITS=3096
REAL_ASSIGNED_UNITS=3096
REAL_UNASSIGNED_UNITS=0
PAGINATOR_PAGE_COUNT=112
SYNTHETIC_PAGE_COUNT=1
FINAL_PAGE_COUNT=113
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=1
PAGES_OVERFLOW_EXPECTED_OVERSIZED=1
PAGES_OVERFLOW_UNEXPECTED=0
```

O resultado geométrico não mudou.

## 14. Integrity regression

```text
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
```

## 15. Remaining blocker

O bloqueador de multiplicação `nodes × pages` foi removido. A tabela oversized
continua sendo o único overflow esperado e pertence à etapa de splitting
editorial. Navegação anterior/predecessor e determinismo completo ainda não
foram auditados nesta rodada.

```text
BLOCKER=EDITORIAL_UNIT_SPLITTING_AND_FULL_NAVIGATION_DETERMINISM_AUDIT
```

## 16. Final verdict

```text
BOOK_COMPOSER_PHASE_2A_11
EDITOR_ROOT_COMPONENT=EditorLayout → PreviewArea
NODE_RENDER_COMPONENT=StructurePanel/PageRow
PAGE_LIST_COMPONENT=StructurePanel
PAGE_RENDER_COMPONENT=PageRenderer
BLOCK_RENDER_COMPONENT=BlockRenderer
NODE_COUNT=29
NODE_ITERATION_CALLSITES=StructurePanel.tsx:127
PAGE_ITERATION_CALLSITES=StructurePanel.tsx:173,185; PreviewArea.tsx:132; PageThumbnail.tsx:31
SUM_NODE_PAGE_ID_COUNTS=113 após correção
SUM_RENDERED_PAGE_COUNTS=113 principais + 1 auxiliar de capa
NODES_RENDER_ALL_BOOK_PAGES=NO após correção
NODE_RENDERS_ONLY_REFERENCED_PAGES=YES
FINAL_PAGE_SURFACES=canvas + thumbnails por referência de node
PRIMARY_PAGE_REPRESENTATIONS=113
SECONDARY_PAGE_REPRESENTATIONS=1
UNEXPLAINED_PAGE_REPRESENTATIONS=0
LOGICAL_BOOK_BLOCK_COUNT=3096
PRIMARY_RENDERED_BLOCK_COUNT=3096
TOTAL_RENDERED_BLOCK_REPRESENTATIONS=3096
BLOCK_RENDER_MULTIPLIER=1.0
ROOT_CAUSE=NODES_RENDER_GLOBAL_PAGE_SET
ROOT_CAUSE_IDENTIFIED=YES
BEFORE_PAGE_REPRESENTATIONS≈3250
AFTER_PAGE_REPRESENTATIONS=114
PAGE_REPRESENTATION_REDUCTION≈96.5%
BEFORE_BLOCK_REPRESENTATIONS≈89784
AFTER_BLOCK_REPRESENTATIONS=3096
BLOCK_REPRESENTATION_REDUCTION≈96.6%
BEFORE_DOM_ELEMENTS≈483277
AFTER_DOM_ELEMENTS=17719
DOM_ELEMENT_REDUCTION≈96.3%
COVER_PRIMARY_RENDER_COUNT=1
PAGE_RENDER_ORDER_MATCHES_BOOK=YES
REAL_EDITORIAL_UNITS=3096
REAL_ASSIGNED_UNITS=3096
REAL_UNASSIGNED_UNITS=0
PAGINATOR_PAGE_COUNT=112
SYNTHETIC_PAGE_COUNT=1
FINAL_PAGE_COUNT=113
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=1
PAGES_OVERFLOW_EXPECTED_OVERSIZED=1
PAGES_OVERFLOW_UNEXPECTED=0
NAV_FIRST=PASS
NAV_NEXT=PASS
NAV_PREVIOUS=NOT_SEPARATELY_EXERCISED
NAV_25_PERCENT=NOT_SEPARATELY_EXERCISED
NAV_MIDDLE=PASS
NAV_75_PERCENT=NOT_SEPARATELY_EXERCISED
NAV_LAST=PASS
NAVIGATION_WRONG_TARGETS=0 nos alvos exercitados
REAL_PAGE_NAVIGATION=PASS nos alvos exercitados
MEASUREMENT_RUNS_DURING_NAVIGATION=0 observado
PAGINATION_RUNS_DURING_NAVIGATION=0 observado
REAL_PAGINATION_DETERMINISTIC=NOT_PROVEN
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
FILES_CHANGED_THIS_RUN=src/book/editorial-units.ts; docs/BOOK_COMPOSER_PHASE_2A_11.md
OUT_OF_SCOPE_CHANGES=NO
COMMIT=NO
DEPLOY=NO
VERDICT=PASS
PHASE_2A_11_COMPLETE=YES
PHASE_2A_COMPLETE=NO
BLOCKER=EDITORIAL_UNIT_SPLITTING_AND_FULL_NAVIGATION_DETERMINISM_AUDIT
REPORT=docs/BOOK_COMPOSER_PHASE_2A_11.md
```
