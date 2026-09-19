# BOOK COMPOSER — PHASE 2A.9

## 1. Scope

Corrigir a perda de unidades entre `EditorialUnit[]`, `blocksByUnit` e o
paginator. Não houve alteração de batching, parser, IR, measurement surface,
availableHeight, geometria de página, navegação, splitting, overflow editorial,
PDF ou manuscrito.

## 2. Unit accounting

A causa foi localizada em `transformDocumentToBook`: blocos de heading eram
criados com `sourceNodeId`, mas sem `editorialUnitId`. Portanto os headings
existiam em `EditorialUnit[]`, porém não entravam em `blocksByUnit` e eram
filtrados da measurement surface. A correção mínima foi propagar o ID da
unidade no metadata do heading.

Depois disso, a execução real registrou:

```text
REAL_EDITORIAL_UNITS=3096
PAGINATOR_INPUT_UNITS=3096
PAGINATOR_ASSIGNED_UNITS=3096
PAGINATOR_UNASSIGNED_UNITS=0
PAGINATOR_DUPLICATED_ASSIGNED_UNITS=0
```

A contabilidade fecha exatamente.

## 3. Unassigned unit distribution

Antes da correção final, as 757 unidades eram headings ausentes do mapa de
blocos. Após a propagação do ID:

```text
UNASSIGNED_HEADING=0
UNASSIGNED_PARAGRAPH=0
UNASSIGNED_LIST=0
UNASSIGNED_QUOTE=0
UNASSIGNED_TABLE=0
UNASSIGNED_IMAGE=0
UNASSIGNED_RULE=0
UNASSIGNED_CODE=0
UNASSIGNED_SEPARATOR=0
UNASSIGNED_OTHER=0
```

Na revalidação intermediária restou uma tabela oversized; ela não era perda de
proveniência, mas uma unidade medida acima da altura disponível e rejeitada
pela antiga branch `return`.

## 4. Position analysis

```text
FIRST_UNASSIGNED_EDITORIAL_INDEX=NONE após correção
LAST_UNASSIGNED_EDITORIAL_INDEX=NONE após correção
UNASSIGNED_CONTIGUOUS_TAIL=NO
UNASSIGNED_RUN_COUNT=0
LONGEST_UNASSIGNED_RUN=0
```

O diagnóstico intermediário foi `firstUnassignedIndex=756` e
`lastUnassignedIndex=756`, tipo `table`, confirmando que não era uma cauda de
757 unidades nem uma interrupção prematura geral.

## 5. Paginator control flow

Não havia `return` prematuro para headings. O segundo caso concreto estava em
unidades não divisíveis oversized:

```ts
if (height > availableHeight && !unit.splittable) return;
```

Essa branch foi substituída pelo comportamento mínimo permitido nesta fase:
registrar `OVERSIZED_UNSPLITTABLE_UNIT`, fechar a página corrente, colocar a
unidade em página exclusiva e fechar essa página explicitamente oversized.
Assim o cursor continua contabilizado sem implementar splitting.

## 6. keepWithNext

Não foi encontrada perda de unidade causada por `keepWithNext`. O algoritmo
avalia a unidade atual e a próxima, abre página quando necessário e mantém a
unidade corrente no fluxo.

## 7. keepTogether

Não foi encontrada perda de unidade causada por `keepTogether`. Unidades não
divisíveis oversized agora são atribuídas a uma página exclusiva com
diagnóstico explícito.

## 8. breakBefore / breakAfter

`breakBefore` apenas finaliza a página corrente antes de adicionar a unidade
atual. Não há `breakAfter` efetivo no fluxo atual. Nenhuma unidade foi perdida
nesses branches.

## 9. Oversized units

O caso real foi preservado em vez de descartado. Resultado final:

```text
UNASSIGNED_OVERSIZED=0
OVERSIZED_UNITS_REPRESENTED=YES
REAL_PAGINATOR_DIAGNOSTICS=2
```

Os diagnósticos continuam sinalizando o problema geométrico; a fase não tenta
corrigi-lo com splitting.

## 10. Unsupported units

```text
UNSUPPORTED_SILENTLY_UNASSIGNED=0
```

O assertor de conservação continua reportando o bloco `code` como preservado
no IR. A atribuição real não perde unidades unsupported.

## 11. EOF behavior

O flush final existente foi exercitado no fixture e no manuscrito real. A última
unidade foi atribuída:

```text
LAST_EDITORIAL_UNIT_ASSIGNED=YES
```

## 12. Assignment invariant

O paginator real registrou:

```text
measurementCount=3096
unitCount=3096
assignedUnitCount=3096
unassignedUnitCount=0
totalUnitReferences=3096
```

Não houve duplicação de referências.

## 13. Fixture regression

```text
PAGINATOR_PAGE_COUNT=4
MATERIALIZED_PAGE_COUNT=5
SYNTHETIC_PAGE_COUNT=1
PAGINATOR_UNASSIGNED_UNITS=0
PAGE_ID_DUPLICATES=0
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
```

`bun run test:geometric-materialization` passou.

## 14. Real KALLISTIS validation

Fluxo real executado pela UI usando o Markdown completo:

```text
MEASUREMENT_BATCH_COUNT=31
MEASUREMENT_BATCHES_COMPLETED=31
AVAILABLE_HEIGHT=994
REAL_MEASUREMENT_UNIT_COUNT=3096
REAL_MEASUREMENT_DUPLICATE_COUNT=0
MEASUREMENT_FAILED_UNITS=0
MEASUREMENT_ZERO_HEIGHT_UNITS=0
```

## 15. Materialization regression

```text
PAGINATOR_PAGE_COUNT=112
MATERIALIZED_PAGE_COUNT=113
SYNTHETIC_PAGE_COUNT=1
FINAL_BOOK_PAGE_COUNT=113
PAGE_IDS_TOTAL=113
PAGE_IDS_UNIQUE=113
PAGE_ID_DUPLICATES=0
NODE_IDS_TOTAL=29
NODE_IDS_UNIQUE=29
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
```

O contrato `112 + 1 = 113` foi preservado. A contagem aumentou de 78 para 112
porque o conteúdo antes perdido voltou ao fluxo; isso é esperado e não foi
comprimido artificialmente.

Navegação não foi reaberta nesta fase, conforme o escopo: o próximo trabalho
deve provar a navegação com o conteúdo agora completo.

## 16. Remaining blocker

```text
BLOCKER=REAL_PAGE_NAVIGATION_AND_EDITORIAL_DENSITY_NOT_YET_REVALIDATED
```

A integridade de atribuição está resolvida. Permanecem fora desta fase a
navegação, overflow, fill ratio, orphan headings e splitting.

## 17. Final verdict

```text
BOOK_COMPOSER_PHASE_2A_9
REAL_EDITORIAL_UNITS=3096
PAGINATOR_INPUT_UNITS=3096
PAGINATOR_ASSIGNED_UNITS=3096
PAGINATOR_UNASSIGNED_UNITS=0
PAGINATOR_DUPLICATED_ASSIGNED_UNITS=0
UNASSIGNED_HEADING=0
UNASSIGNED_PARAGRAPH=0
UNASSIGNED_LIST=0
UNASSIGNED_QUOTE=0
UNASSIGNED_TABLE=0
UNASSIGNED_IMAGE=0
UNASSIGNED_RULE=0
UNASSIGNED_CODE=0
UNASSIGNED_SEPARATOR=0
UNASSIGNED_OTHER=0
FIRST_UNASSIGNED_EDITORIAL_INDEX=NONE
LAST_UNASSIGNED_EDITORIAL_INDEX=NONE
UNASSIGNED_CONTIGUOUS_TAIL=NO
UNASSIGNED_RUN_COUNT=0
LONGEST_UNASSIGNED_RUN=0
UNASSIGNED_NEVER_CONSIDERED=0
UNASSIGNED_REJECTED=0
UNASSIGNED_OVERSIZED=0
UNASSIGNED_UNSUPPORTED=0
UNASSIGNED_REFERENCE_LOST=0
UNASSIGNED_OTHER_REASON=0
LAST_PROCESSED_EDITORIAL_INDEX=3095
LAST_INPUT_EDITORIAL_INDEX=3095
LAST_EDITORIAL_UNIT_ASSIGNED=YES
UNSUPPORTED_SILENTLY_UNASSIGNED=0
PAGINATOR_PAGE_COUNT=112
MATERIALIZED_PAGE_COUNT=113
SYNTHETIC_PAGE_COUNT=1
FINAL_BOOK_PAGE_COUNT=113
PAGE_ID_DUPLICATES=0
NODE_ID_DUPLICATES=0
INVALID_PAGE_REFERENCES=0
DUPLICATED_PAGE_REFERENCES=0
REAL_PAGE_NAVIGATION=NOT_REVALIDATED_THIS_PHASE
IR_BOOK_CONSERVATION=PASS
GEOMETRIC_MATERIALIZATION_ASSERTOR=PASS
TYPECHECK=PASS
GIT_DIFF_CHECK=PASS
FILES_CHANGED_THIS_RUN=src/book/markdown-book.ts; src/book/editorial-units.ts; src/editor/components/Toolbar.tsx; docs/BOOK_COMPOSER_PHASE_2A_9.md
OUT_OF_SCOPE_CHANGES=NO
COMMIT=NO
DEPLOY=NO
VERDICT=PASS_FOR_ASSIGNMENT_GATE
PHASE_2A_9_COMPLETE=YES
PHASE_2A_COMPLETE=NO
BLOCKER=REAL_PAGE_NAVIGATION_AND_EDITORIAL_DENSITY_NOT_YET_REVALIDATED
REPORT=docs/BOOK_COMPOSER_PHASE_2A_9.md
```
