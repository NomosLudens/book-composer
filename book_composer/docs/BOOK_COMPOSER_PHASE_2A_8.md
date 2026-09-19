# BOOK COMPOSER — PHASE 2A.8

## 1. Escopo

Revalidação integral do manuscrito real pela UI, sem alterar batching, parser,
IR, renderer, splitting editorial, PDF ou manuscrito.

Fonte:

```text
REAL_MARKDOWN_SOURCE=/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md
REAL_MARKDOWN_BYTES=384121
REAL_MARKDOWN_LINES=7275
REAL_MARKDOWN_CHARACTERS=371832
```

## 2. Fluxo real

O aplicativo abriu em uma sessão limpa do dev server (`127.0.0.1:8081`). A
importação foi executada por `Ferramentas → Colar inteligente → Inserir`.

```text
REAL_APP_OPEN=PASS
FATAL_BROWSER_ERRORS_BEFORE_IMPORT=0
REAL_UI_IMPORT_EXECUTED=YES
```

## 3. Batching e medição

```text
MEASUREMENT_STRATEGY=DOM_BATCHED_REAL_RENDERER
MEASUREMENT_BATCH_COUNT=24
MEASUREMENT_BATCHES_COMPLETED=24
REAL_MEASUREMENT_UNIT_COUNT=2340
REAL_MEASUREMENT_DUPLICATE_COUNT=0 (não há IDs repetidos no Map)
MEASUREMENT_FAILED_UNITS=0 entre as 2340 unidades visíveis
MEASUREMENT_ZERO_HEIGHT_UNITS=0 observados no log final
MEASUREMENT_BATCHING_REGRESSION=NO
```

Os lotes variaram de 0 a 7 ms e avançaram sem freeze durante a medição.

## 4. `availableHeight=0`

O log real do paginator registrou:

```text
availableHeight=994
```

Portanto, nesta execução:

```text
AVAILABLE_HEIGHT_ZERO_OCCURRENCES=0
AVAILABLE_HEIGHT_ZERO_CAUSE=NOT_TRIGGERED
AVAILABLE_HEIGHT_ZERO_FALLBACK_SOURCE=page.getBoundingClientRect().height
ZERO_HEIGHT_FALLBACK_AUTHORITATIVE=YES (derivado do container geométrico real; não usado nesta execução)
```

O fallback está no `Toolbar.tsx` e usa a altura efetivamente calculada da
`.k-editorial-measurement-page`, não uma constante inventada.

## 5. Saída do paginator

Log real capturado imediatamente antes da materialização:

```text
PAGINATOR_PAGE_COUNT=78
PAGINATOR_TOTAL_UNIT_REFERENCES=2339
PAGINATOR_UNIQUE_UNIT_REFERENCES=2339
PAGINATOR_DUPLICATED_UNIT_REFERENCES=0
PAGINATOR_UNASSIGNED_UNITS=757
PAGINATOR_DIAGNOSTICS=757
```

O gate de conservação da paginação não passa: 757 das 3.096 unidades não
foram atribuídas. A medição cobre 2.340 unidades visíveis; isso precisa ser
resolvido antes de afirmar conservação integral. Não é correto esconder a
diferença chamando-a de página sintética.

## 6. Materialização

```text
MATERIALIZED_PAGE_COUNT=79
SYNTHETIC_PAGE_COUNT=1 (capa)
FINAL_BOOK_PAGE_COUNT=79
```

A relação de páginas é correta para o resultado recebido:

```text
78 paginator pages + 1 cover = 79 Book pages
```

Não foi observada multiplicação de páginas na função de materialização.

## 7. Identidade e referências

Auditoria real do `Book`:

```text
PAGE_IDS_TOTAL=79
PAGE_IDS_UNIQUE=79
PAGE_ID_DUPLICATES=0
NODE_IDS_TOTAL=29
NODE_IDS_UNIQUE=29
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
ORPHAN_PAGE_REFERENCES=0 (não há referência inválida; a atribuição faltante é de unidades)
```

O ID é gerado em `src/book/editorial-units.ts`, na função
`materializeGeometricPages`, por índice global do resultado. Não há aleatoriedade.

## 8. Densidade

As métricas de distribuição por página e alturas estatísticas não foram
expostas pelo runtime nesta rodada. A medição real confirmou `availableHeight=994`,
mas não foi coletada amostra de dez unidades com altura individual. Isso fica
fora do escopo de correção desta fase e não será inferido.

```text
PAGES_WITH_1_UNIT=NOT_COLLECTED
PAGES_WITH_2_UNITS=NOT_COLLECTED
PAGES_WITH_3_TO_5_UNITS=NOT_COLLECTED
PAGES_WITH_6_PLUS_UNITS=NOT_COLLECTED
AVG_UNITS_PER_PAGE=NOT_COLLECTED
MIN_UNITS_PER_PAGE=NOT_COLLECTED
MAX_UNITS_PER_PAGE=NOT_COLLECTED
PAGE_CONTENT_HEIGHT=994
AVG_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
MEDIAN_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
P95_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
MAX_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
```

## 9. Origem exibida e navegação

O DOM continha representações repetidas das páginas do editor (canvas, lista e
camadas), portanto a contagem bruta de nós DOM não deve ser tratada como
contagem do `Book`. O runtime registrou 79 páginas no `Book`, todas geométricas
após a capa.

```text
DISPLAYED_PAGES_SOURCE=GEOMETRIC_PAGINATOR (runtime data-pagination-engine)
GEOMETRIC_PAGE_COUNT=78
DISPLAYED_PAGE_COUNT=79 incluindo capa
COUNTS_MATCH=YES após synthetic-page-count=1
```

O teste automatizado tentou selecionar a primeira e a segunda página, mas a
árvore DOM pesada excedeu o timeout de interação. Logo:

```text
NAV_FIRST=NOT_PROVEN
NAV_NEXT=NOT_PROVEN
NAV_PREVIOUS=NOT_PROVEN
NAV_MIDDLE=NOT_PROVEN
NAV_LAST=NOT_PROVEN
REAL_PAGE_NAVIGATION=INCIDENT — UI pesada durante interação
DUPLICATE_REACT_PAGE_KEYS=0 observado no Book; console sem erro capturado
DUPLICATE_REACT_NODE_KEYS=0 observado no Book; console sem erro capturado
PAGE_LOOKUP_UNAMBIGUOUS=YES no Book
NODE_LOOKUP_UNAMBIGUOUS=YES no Book
```

## 10. Assertors e regressão

```text
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS (fixture)
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
```

## 11. Veredicto

`VERDICT=INCIDENT`

A identidade e a materialização estão corretas no runtime real: 78 páginas do
paginator viraram 78 páginas geométricas, mais uma capa, com IDs únicos e
referências válidas. O batching também passou.

Mas a fase não passa porque o paginator recebeu 3.096 unidades, mediu 2.340 e
deixou 757 sem atribuição. Além disso, a navegação real não pôde ser provada
por causa do peso da árvore DOM. O próximo bloqueador concreto é:

```text
BLOCKER=UNASSIGNED_EDITORIAL_UNITS_AND_REAL_NAVIGATION_NOT_PROVEN
```

Não entrar em splitting, overflow ou redução artificial do número de páginas
antes de resolver essa conservação e provar a navegação.

```text
BOOK_COMPOSER_PHASE_2A_8
REAL_UI_IMPORT_EXECUTED=YES
MEASUREMENT_BATCH_COUNT=24
MEASUREMENT_BATCHES_COMPLETED=24
REAL_MEASUREMENT_UNIT_COUNT=2340
MEASUREMENT_FAILED_UNITS=0 visíveis
AVAILABLE_HEIGHT_ZERO_OCCURRENCES=0
AVAILABLE_HEIGHT_ZERO_CAUSE=NOT_TRIGGERED
AVAILABLE_HEIGHT_ZERO_FALLBACK_SOURCE=page.getBoundingClientRect().height
ZERO_HEIGHT_FALLBACK_AUTHORITATIVE=YES
PAGINATOR_PAGE_COUNT=78
PAGINATOR_TOTAL_UNIT_REFERENCES=2339
PAGINATOR_UNIQUE_UNIT_REFERENCES=2339
PAGINATOR_DUPLICATED_UNIT_REFERENCES=0
PAGINATOR_UNASSIGNED_UNITS=757
MATERIALIZED_PAGE_COUNT=79
SYNTHETIC_PAGE_COUNT=1
FINAL_BOOK_PAGE_COUNT=79
PAGE_IDS_TOTAL=79
PAGE_IDS_UNIQUE=79
PAGE_ID_DUPLICATES=0
NODE_IDS_TOTAL=29
NODE_IDS_UNIQUE=29
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
ORPHAN_PAGE_REFERENCES=0
DUPLICATE_REACT_PAGE_KEYS=0
DUPLICATE_REACT_NODE_KEYS=0
PAGE_LOOKUP_UNAMBIGUOUS=YES
NODE_LOOKUP_UNAMBIGUOUS=YES
PAGES_WITH_1_UNIT=NOT_COLLECTED
PAGES_WITH_2_UNITS=NOT_COLLECTED
PAGES_WITH_3_TO_5_UNITS=NOT_COLLECTED
PAGES_WITH_6_PLUS_UNITS=NOT_COLLECTED
AVG_UNITS_PER_PAGE=NOT_COLLECTED
MIN_UNITS_PER_PAGE=NOT_COLLECTED
MAX_UNITS_PER_PAGE=NOT_COLLECTED
PAGE_CONTENT_HEIGHT=994
AVG_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
MEDIAN_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
P95_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
MAX_MEASURED_UNIT_HEIGHT=NOT_COLLECTED
UNITS_BELOW_10_PERCENT_PAGE=NOT_COLLECTED
UNITS_10_TO_25_PERCENT_PAGE=NOT_COLLECTED
UNITS_25_TO_50_PERCENT_PAGE=NOT_COLLECTED
UNITS_50_TO_100_PERCENT_PAGE=NOT_COLLECTED
UNITS_ABOVE_100_PERCENT_PAGE=NOT_COLLECTED
DISPLAYED_PAGES_SOURCE=GEOMETRIC_PAGINATOR
GEOMETRIC_PAGE_COUNT=78
DISPLAYED_PAGE_COUNT=79 incluindo capa
COUNTS_MATCH=YES com synthetic-page-count=1
NAV_FIRST=NOT_PROVEN
NAV_NEXT=NOT_PROVEN
NAV_PREVIOUS=NOT_PROVEN
NAV_MIDDLE=NOT_PROVEN
NAV_LAST=NOT_PROVEN
REAL_PAGE_NAVIGATION=INCIDENT
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=NOT_COLLECTED
REAL_ORPHAN_HEADINGS=NOT_COLLECTED
REAL_OVERSIZED_UNITS=NOT_COLLECTED
REAL_EMPTY_PAGES=NOT_COLLECTED
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS fixture
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
FILES_CHANGED_THIS_RUN=docs/BOOK_COMPOSER_PHASE_2A_8.md
OUT_OF_SCOPE_CHANGES=NO
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_8_COMPLETE=NO
PHASE_2A_COMPLETE=NO
BLOCKER=UNASSIGNED_EDITORIAL_UNITS_AND_REAL_NAVIGATION_NOT_PROVEN
REPORT=docs/BOOK_COMPOSER_PHASE_2A_8.md
```
