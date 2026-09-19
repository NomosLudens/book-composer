# BOOK COMPOSER — FASE 2A.6

## Revalidação integral do batching geométrico

Data: 2026-09-11  
Commit observado: `4aae380cd0b03db5967376af331b4cc0feb851`  
Branch: `master`  
Commit/deploy nesta fase: não

## Escopo executado

O teste foi feito pela interface real do Book Composer, em uma origem limpa do
dev server (`http://localhost:8080/`): Ferramentas → Colar inteligente →
textarea → Inserir. O arquivo usado foi exatamente:

`/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md`

Não houve alteração de parser, IR, renderer, CSS ou paginador antes da primeira
tentativa desta fase.

## Evidência da medição

- Fonte: 384.121 bytes, 7.275 linhas, 371.832 caracteres.
- Estratégia: batching geométrico no componente real de medição.
- Tamanho do lote: 100 unidades.
- Lotes observados: 24/24 completos.
- Tempos registrados por lote: 1–6 ms.
- Maior lote: 6 ms.
- UI entre lotes: responsiva; os logs avançaram sem freeze imediato.
- O diálogo fechou após `Inserir`, portanto o fluxo de importação foi
  realmente acionado.

O número de lotes observado não corresponde ao valor esperado de 31 lotes
para 3.096 unidades. Isso é evidência de que a superfície não está expondo,
no teste real, o mesmo conjunto editorial que o inventário estático anterior
atribuía ao manuscrito. Não é seguro transformar essa divergência em PASS.

## Incidente encontrado depois da medição

Após os 24 lotes, a inspeção do resultado encontrou:

- 2.264 nós `.k-page[data-page-id]` no DOM;
- 2.264 nós marcados com `data-pagination-engine="geometric"`;
- 2.263 controles “Adicionar página depois”;
- 29 ocorrências do mesmo ID `geometric-page-1`;
- `textarea=0`, indicando que o diálogo foi fechado;
- a inspeção final via CDP excedeu o tempo por causa do volume/renderização.

Esses dados não provam um livro correto. Ao contrário, indicam materialização
excessiva e IDs duplicados no resultado real. A medição deixou de congelar, mas
o produto ainda falha na etapa seguinte: a paginação/materialização geométrica
não produz uma coleção navegável e verificável de páginas.

## Diagnóstico

O batching resolveu apenas o primeiro gargalo: a leitura simultânea de todos
os nós. Ele não resolveu a governança do resultado. Os sinais observados são:

1. A contagem de lotes não fecha com o inventário editorial esperado.
2. A materialização cria milhares de nós para um manuscrito de 3.096 unidades.
3. IDs de páginas se repetem (`geometric-page-1`), invalidando contagem,
   navegação e qualquer auditoria baseada em `data-page-id`.
4. O volume gerado torna a inspeção do canvas pesada novamente, mesmo sem o
   freeze durante a medição.
5. Não foi possível provar, nesta execução, overflow, orphan headings,
   preenchimento, sumário, determinismo ou exportação PDF.

## Resultado da fase

`VERDICT=INCIDENT`

O batching está funcional como mecanismo de avanço dos lotes (`24/24`), mas a
integração integral ainda não está pronta. O próximo trabalho deve localizar
por que a unidade medida/materializada diverge do inventário e por que a
materialização entrega páginas/IDs duplicados. Não se deve prosseguir para
ajustes finos de tipografia, CSS ou PDF antes de corrigir essa inconsistência.

## Matriz solicitada

```text
BOOK_COMPOSER_PHASE_2A_6
HEAD=4aae380cd0b03db5967376af331b4cc0feb851
BRANCH=master
REAL_MARKDOWN_SOURCE=/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md
REAL_MARKDOWN_BYTES=384121
REAL_MARKDOWN_LINES=7275
REAL_MARKDOWN_CHARACTERS=371832
REAL_APP_OPEN=PASS
REAL_UI_IMPORT_EXECUTED=PASS
MEASUREMENT_STRATEGY=batching geométrico
MEASUREMENT_BATCH_SIZE=100
MEASUREMENT_BATCH_COUNT=24
MEASUREMENT_BATCHES_COMPLETED=24
MAX_SIMULTANEOUS_MEASUREMENT_UNITS=100
PREVIOUS_BATCH_DOM_RETAINED=NO
REAL_EDITORIAL_UNITS=NOT_PROVEN (inventário anterior: 3096; UI: 24 lotes)
REAL_MEASUREMENT_PASSES=24
REAL_MEASUREMENT_UNIT_COUNT=NOT_PROVEN
REAL_MEASUREMENT_DUPLICATE_COUNT=NOT_PROVEN
MEASUREMENT_FAILED_UNITS=NOT_PROVEN
MEASUREMENT_ZERO_HEIGHT_UNITS=NOT_PROVEN
UI_RESPONSIVE_BETWEEN_BATCHES=PASS
IMPORT_UI_FATAL_FREEZE=NO DURANTE MEDIÇÃO; CDP pesado após materialização
REAL_FLOW_PAGINATOR=PASS EXECUTADO, RESULTADO INCORRETO
LEGACY_PAGINATOR_ACTIVE_IN_REAL_FLOW=NOT_PROVEN
PAGINATION_RUNS=NOT_PROVEN
REAL_PAGINATED_UNITS=NOT_PROVEN
REAL_UNPAGINATED_UNITS=NOT_PROVEN
REAL_GEOMETRIC_PAGE_COUNT=2263 controles observados; coleção inconsistente
REPLACE_BOOK_CALLS_PER_IMPORT=NOT_PROVEN (efeito observado indiretamente)
DISPLAYED_PAGES_SOURCE=DOM real após importação
DISPLAYED_PAGE_COUNT=2264 nós; IDs duplicados
GEOMETRIC_PAGE_COUNT=2264 nós
COUNTS_MATCH=NO
REAL_PAGE_NAVIGATION=INCIDENT
IMPORT_TOTAL_MS=NOT_PROVEN
MEASUREMENT_TOTAL_MS=~837 ms pelos logs
PAGINATION_TOTAL_MS=NOT_PROVEN
BOOK_MATERIALIZATION_TOTAL_MS=NOT_PROVEN
MIN_BATCH_MS=1
AVG_BATCH_MS=~2
MAX_BATCH_MS=6
REAL_GEOMETRIC_PAGES_WITH_OVERFLOW=NOT_PROVEN
REAL_ORPHAN_HEADINGS=NOT_PROVEN
REAL_OVERSIZED_UNITS=NOT_PROVEN
REAL_EMPTY_PAGES=NOT_PROVEN
OVERFLOW_PARAGRAPH=NOT_PROVEN
OVERFLOW_LIST=NOT_PROVEN
OVERFLOW_TABLE=NOT_PROVEN
OVERFLOW_IMAGE=NOT_PROVEN
OVERFLOW_QUOTE=NOT_PROVEN
OVERFLOW_CODE=NOT_PROVEN
OVERFLOW_OTHER=NOT_PROVEN
BREAK_INITIAL=NOT_PROVEN
BREAK_OVERFLOW=NOT_PROVEN
BREAK_BEFORE=NOT_PROVEN
BREAK_KEEP_WITH_NEXT=NOT_PROVEN
BREAK_MANUAL=NOT_PROVEN
REAL_AVG_FILL_RATIO=NOT_PROVEN
REAL_MIN_FILL_RATIO=NOT_PROVEN
REAL_MAX_FILL_RATIO=NOT_PROVEN
REAL_PAGES_BELOW_25_PERCENT=NOT_PROVEN
REAL_PAGES_BELOW_50_PERCENT=NOT_PROVEN
REAL_PAGINATION_DETERMINISTIC=NOT_PROVEN
IR_BOOK_CONSERVATION=PASS (gate anterior, sem alteração nesta fase)
TYPECHECK=PASS
FILES_CHANGED_THIS_RUN=docs/BOOK_COMPOSER_PHASE_2A_6.md
OUT_OF_SCOPE_CHANGES=NO
COMMIT=NO
DEPLOY=NO
VERDICT=INCIDENT
PHASE_2A_6_COMPLETE=NO
PHASE_2A_COMPLETE=NO
BLOCKER=materialização excessiva e IDs geométricos duplicados após batching
REPORT=docs/BOOK_COMPOSER_PHASE_2A_6.md
```
