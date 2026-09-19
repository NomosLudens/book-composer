# BOOK COMPOSER — LABORATÓRIO DAS PRIMEIRAS 50 PÁGINAS

Data: 2026-09-12

## Escopo

Manuscrito real:

`/home/tonyus-dev/Downloads/KALLISTIS_Livros/KALLISTIS_LIVRO_COMPLETO_2.0.md`

O teste foi executado pelo fluxo real do aplicativo no navegador interno: colagem inteligente do Markdown, materialização geométrica, navegação página a página e leitura do DOM renderizado.

## Resultado do motor genérico

- unidades medidas: 4.545;
- unidades atribuídas: 4.545;
- unidades não atribuídas: 0;
- páginas geométricas: 202;
- páginas finais com capa: 203;
- sumário: unidade semântica em duas colunas;
- itens no sumário: 47;
- primeira entrada do sumário: `Abertura — 2`;
- título sintético da capa no sumário: não;
- avisos de preflight: 259;
- erros de preflight: 0.

## Validação 1–50

As 50 páginas geométricas foram selecionadas individualmente no navegador interno e medidas após a renderização final.

- páginas verificadas: 50/50;
- páginas com overflow: 0;
- maior overflow observado: 0 px;
- página do sumário: `geometric-page-2`, sem overflow;
- duplicação do título da capa no sumário: corrigida;
- importador acoplado ao nome “Abertura”: removido.

## Blocker fora do piloto

O lote completo ainda registra uma unidade não divisível maior que a caixa útil:

`OVERSIZED_UNSPLITTABLE_UNIT` / `PAGE_OVERFLOW`

Unidade: `editorial-unit-2203`.

Esse blocker não pertence às primeiras 50 páginas. O PDF completo não deve ser declarado pronto antes de resolver e revalidar essa tabela.

## Verificações executadas

```text
bun run typecheck
bun run test:ir-book-conservation
bun run test:geometric-materialization
git diff --check
```

Todas passaram. Isso comprova o contrato estrutural e a materialização; a prova visual deste relatório vem da navegação real das 50 páginas no aplicativo.
