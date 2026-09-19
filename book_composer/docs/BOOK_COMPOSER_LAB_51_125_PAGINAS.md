# BOOK COMPOSER — LABORATÓRIO DAS PÁGINAS 51–125

> Registro histórico da validação inicial em A4. A revalidação vigente em 14 × 21 cm está em [BOOK_COMPOSER_LAB_FORMATO_14X21.md](BOOK_COMPOSER_LAB_FORMATO_14X21.md).

## Escopo

- Manuscrito real: `/home/tonyus-dev/Downloads/KALLISTIS_Livros/KALLISTIS_LIVRO_COMPLETO_2.0.md`
- Fluxo usado: importação Markdown pelo próprio editor, paginação geométrica e inspeção no navegador interno.
- Faixa auditada: `geometric-page-51` até `geometric-page-125` — 75 páginas consecutivas.
- A capa não entra nessa numeração; o resultado visual atual possui 213 páginas físicas: capa + 212 páginas geométricas.

## Resultado final

| Verificação | Resultado |
|---|---:|
| Páginas auditadas | 75/75 |
| Páginas com overflow | 0 |
| Maior overflow observado | 0 px |
| Marcadores Markdown `**...**` visíveis | 0 páginas |
| Cabeçalhos Markdown crus (`# `) visíveis | 0 páginas |
| Tabelas no lote | páginas 69, 70, 74 e 115–125 |
| Continuações de tabela no lote | 10 |

Também foi feita uma varredura geométrica adicional nas 212 páginas do resultado completo: nenhuma página excedeu a área de conteúdo (`badCount=0`, `maxOverflow=0`).

## Blocker encontrado e correção do aplicativo

Na primeira passagem, a página geométrica 117 (folha 118 após a reimportação) recebeu a matriz das 76 formas como um único parágrafo/bloco. O resultado era um overflow de 6.856 px e exibia o Markdown da tabela como texto.

O defeito foi corrigido no aplicativo, de forma genérica:

1. o importador reconhece tabelas Markdown cuja linha separadora tenha um erro comum de exportação, sem reescrever a fonte;
2. o catálogo longo é dividido em blocos de continuação antes da paginação geométrica;
3. cada continuação repete o cabeçalho da tabela;
4. citações e células passam pelo renderer inline, removendo marcadores Markdown visíveis;
5. a paginação continua sendo governada pela medição real do navegador, não por ajuste específico do manuscrito.

Após a reimportação, a mesma região passou com overflow zero em todas as 75 páginas.

## Validações de código

Passaram:

```text
bun run typecheck
bun run test:ir-book-conservation
bun run test:geometric-materialization
git diff --check
```

Conservação do manuscrito real: 6.191 nós no IR, 3.095 unidades de impressão, 3.096 blocos importados no Book, 0 itens não contabilizados, 0 duplicações e 0 violações de ordem.

Este laboratório valida a faixa 51–125 e a varredura geométrica do resultado carregado. Ainda não constitui aprovação editorial final de todas as advertências de preflight; o editor continua reportando avisos de qualidade editorial que devem ser tratados em uma auditoria separada.
