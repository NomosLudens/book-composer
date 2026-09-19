# BOOK COMPOSER — PHASE 2A.7

## 1. Scope

Foi isolada a fronteira `MeasurementMap → paginator → Page[] → Node[] → Book`.
O batching não foi alterado. Também não foram alterados parser, IR, renderer
Markdown, tabelas, imagens, TOC, PDF ou splitting editorial.

## 2. Paginator output

A fronteira agora registra `availableHeight`, quantidade de medições, unidades,
páginas, referências de unidades e diagnósticos antes da materialização. Na
execução real anterior da Fase 2A.6, o resultado observado foi aproximadamente
2.263 páginas geométricas. A nova instrumentação está pronta para separar essa
contagem da materialização; uma nova importação integral após HMR não pôde ser
concluída pelo navegador nesta rodada porque o diálogo perdeu responsividade
antes do submit, portanto não há novo número real a declarar como confirmado.

## 3. Page materialization

`materializeGeometricPages` cria cada página uma única vez, a partir de
`result.pages`, e agora emite uma auditoria formal do resultado. O fixture
confirmou:

```text
PAGINATOR_PAGE_COUNT=4
MATERIALIZED_PAGE_COUNT=5
SYNTHETIC_PAGE_COUNT=1 (capa)
```

Assim, a relação esperada é `4 + 1 = 5`.

## 4. Node materialization

A política existente foi preservada: os `SectionNode`s existentes permanecem
donos das referências de páginas e cada node recebe a lista das páginas
geométricas não sintéticas. Não há criação de um `Node` por unidade editorial.

Fixture:

```text
MATERIALIZED_NODE_COUNT=3
FINAL_BOOK_NODE_COUNT=3
NODE_MATERIALIZATION_POLICY=preservar SectionNode existente; atualizar pageIds uma vez
```

## 5. ID generation

O factory da página está em `src/book/editorial-units.ts`, dentro de
`materializeGeometricPages`, usando o índice global do resultado:
`geometric-page-${index + 1}`. No objeto `Book`, esse loop é executado uma vez.
O fixture produziu IDs únicos. A repetição observada no DOM da Fase 2A.6 não é
suficiente para afirmar que `Book.pages` possuía IDs repetidos: o DOM também
contém múltiplas representações da mesma página (canvas, navegação e painéis).

## 6. Duplicate identity root cause

O diagnóstico objetivo da Fase 2A.6 foi confundido com contagem de nós DOM. A
auditoria agora mede separadamente IDs do `Book`, IDs dos nodes e referências.
Não foi introduzido ID aleatório.

Também foi adicionada uma proteção de integração: se a altura do conteúdo da
surface vier como zero, o fluxo usa a altura geométrica da página como fallback
determinístico. Isso evita que `availableHeight=0` transforme cada unidade em
uma página, sem alterar batch size ou a estratégia de medição.

## 7. Page/node relationship

Fixture:

```text
PAGINATOR_TOTAL_UNIT_REFERENCES=18
PAGINATOR_UNIQUE_UNIT_REFERENCES=18
PAGINATOR_DUPLICATED_UNIT_REFERENCES=0
PAGINATOR_UNASSIGNED_UNITS=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
```

## 8. Fixture validation

`bun run test:geometric-materialization` passou:

```text
PAGE_IDS_TOTAL=5
PAGE_IDS_UNIQUE=5
PAGE_ID_DUPLICATES=0
NODE_IDS_TOTAL=3
NODE_IDS_UNIQUE=3
NODE_ID_DUPLICATES=0
```

## 9. Real KALLISTIS validation

A execução real confirmada da Fase 2A.6 continua sendo a referência:

```text
MEASUREMENT_BATCHES_COMPLETED=24/24
UI_RESPONSIVE_DURING_MEASUREMENT=YES
DISPLAYED_DOM_PAGE_NODES=2264
```

Após a alteração, uma nova sessão do navegador foi aberta, mas a automação
perdeu o diálogo antes do submit e não gerou logs de paginator/materialização.
Logo, a correção ainda não pode ser declarada validada integralmente no app.

## 10. Page-density diagnostics

Não foram produzidas métricas editoriais de densidade, overflow ou fill ratio
nesta fase. Elas permanecem fora do escopo enquanto a identidade e a fronteira
de materialização não estiverem validadas no fluxo real.

## 11. Navigation

Fixture estrutural passou a ter identidade única, mas a navegação real
`first/next/previous/middle/last` não foi validada após a correção. Status:
`REAL_PAGE_NAVIGATION=NOT_PROVEN`.

## 12. React keys

Não foram encontrados `key` duplicados no fixture após a materialização. A
verificação visual/DOM integral permanece pendente porque a nova importação real
não concluiu.

## 13. Conservation regression

```text
IR_BOOK_CONSERVATION=PASS
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
MEASUREMENT_BATCHING_REGRESSION=NO (código de batching não alterado)
```

## 14. Remaining blocker

O blocker atual é a falta de uma revalidação real pós-correção. A execução
anterior confirmou a anomalia no DOM, mas não separou os números no objeto
`Book`; o fixture prova que a materialização em si é 1:1 e determinística. É
necessário repetir o submit real em sessão limpa e coletar os novos logs antes
de afirmar que a contagem patológica foi corrigida.

## 15. Final verdict

`VERDICT=INCIDENT`

Esta rodada entrega instrumentação, auditoria formal, assertor de fixture e um
fallback determinístico para altura zero. A Fase 2A.7 não está completa porque
o fluxo integral KALLISTIS pós-correção ainda não foi provado no navegador.

```text
BOOK_COMPOSER_PHASE_2A_7
PAGINATOR_PAGE_COUNT=4 (fixture; real pós-correção NOT_PROVEN)
PAGINATOR_TOTAL_UNIT_REFERENCES=18 (fixture)
PAGINATOR_UNIQUE_UNIT_REFERENCES=18
PAGINATOR_DUPLICATED_UNIT_REFERENCES=0
PAGINATOR_UNASSIGNED_UNITS=0
MATERIALIZED_PAGE_COUNT=5 (fixture)
FINAL_BOOK_PAGE_COUNT=5 (fixture)
SYNTHETIC_PAGE_COUNT=1
MATERIALIZED_NODE_COUNT=3
FINAL_BOOK_NODE_COUNT=3
NODE_MATERIALIZATION_POLICY=SectionNode existente atualizado uma vez
PAGE_ID_FACTORY_FILE=src/book/editorial-units.ts
PAGE_ID_FACTORY_FUNCTION=materializeGeometricPages
PAGE_IDS_TOTAL=5
PAGE_IDS_UNIQUE=5
PAGE_ID_DUPLICATES=0
NODE_IDS_TOTAL=3
NODE_IDS_UNIQUE=3
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
DUPLICATE_REACT_PAGE_KEYS=0 (fixture)
DUPLICATE_REACT_NODE_KEYS=0 (fixture)
PAGE_LOOKUP_UNAMBIGUOUS=YES (fixture)
NODE_LOOKUP_UNAMBIGUOUS=YES (fixture)
PAGES_WITH_1_UNIT=NOT_MEASURED
PAGES_WITH_2_UNITS=NOT_MEASURED
PAGES_WITH_3_TO_5_UNITS=NOT_MEASURED
PAGES_WITH_6_PLUS_UNITS=NOT_MEASURED
AVG_UNITS_PER_PAGE=NOT_MEASURED
MIN_UNITS_PER_PAGE=NOT_MEASURED
MAX_UNITS_PER_PAGE=NOT_MEASURED
AVG_MEASURED_UNIT_HEIGHT=NOT_MEASURED
MEDIAN_MEASURED_UNIT_HEIGHT=NOT_MEASURED
P95_MEASURED_UNIT_HEIGHT=NOT_MEASURED
PAGE_CONTENT_HEIGHT=instrumentado; real pós-correção NOT_PROVEN
MEASUREMENT_BATCHING_REGRESSION=NO
NAV_FIRST=NOT_PROVEN
NAV_NEXT=NOT_PROVEN
NAV_PREVIOUS=NOT_PROVEN
NAV_MIDDLE=NOT_PROVEN
NAV_LAST=NOT_PROVEN
REAL_PAGE_NAVIGATION=NOT_PROVEN
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS
TYPECHECK=PASS
FILES_CHANGED=src/book/editorial-units.ts; src/editor/components/Toolbar.tsx; scripts/assert-geometric-materialization.ts; package.json; docs/BOOK_COMPOSER_PHASE_2A_7.md
OUT_OF_SCOPE_CHANGES=NO
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_7_COMPLETE=NO
PHASE_2A_COMPLETE=NO
BLOCKER=validação integral pós-correção não concluída no navegador
REPORT=docs/BOOK_COMPOSER_PHASE_2A_7.md
```
