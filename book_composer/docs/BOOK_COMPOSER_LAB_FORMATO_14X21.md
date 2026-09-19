# BOOK COMPOSER — REVALIDAÇÃO EM 14 × 21 CM

## Resultado

- Formato físico aplicado: **140 × 210 mm**.
- Resultado atual: **438 páginas físicas** — capa + 437 páginas geométricas.
- Manuscrito: `/home/tonyus-dev/Downloads/KALLISTIS_Livros/KALLISTIS_LIVRO_COMPLETO_2.0.md`.
- Varredura das 437 páginas geométricas: **0 páginas com overflow**; maior overflow: **0 px**.
- Marcadores Markdown crus visíveis: **0**.
- Sumário: 3 páginas, 2 colunas por página, com 16/16/15 entradas e paginação recalculada.
- Tabelas: 42 páginas renderizadas como tabelas, sem overflow.

## Correções exigidas pelo formato menor

Ao trocar A4 por 14 × 21 cm, a auditoria encontrou parágrafos longos que não podiam continuar como um único bloco. O fluxo geométrico agora cria fragmentos editoriais apenas durante a paginação, preservando o nó Markdown original e evitando parágrafos que ultrapassam a folha.

O sumário também passou a ser dividido em páginas próprias quando não cabe em uma folha 14 × 21 cm. A divisão preserva as entradas e atualiza os números depois da materialização geométrica.

## Testes

```text
bun run typecheck
bun run test:ir-book-conservation
bun run test:geometric-materialization
git diff --check
```

Todos passaram. A aprovação editorial final ainda depende da inspeção visual das páginas e dos avisos de preflight; esta validação confirma formato, conservação, paginação e ausência de overflow.
