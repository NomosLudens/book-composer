<div align="center">

# Book Composer

### Composição editorial estruturada, do manuscrito ao PDF.

**Automatize a repetição. Preserve a decisão editorial.**

Um editor visual local-first para criar, paginar, revisar e exportar livros reais sem acoplar o engine a um único projeto.

[Por quê](#por-que-book-composer) · [Produto](#o-que-o-book-composer-faz) · [Autoridade editorial](#onde-a-autoridade-vive) · [Fluxo](#fluxo-editorial) · [Arquitetura](#arquitetura) · [Estado](#estado-verificado) · [Quick start](#quick-start)

</div>

---

> **O engine organiza. O preflight mede. A pessoa decide.**

Book Composer é um editor / diagramador genérico de livros com modelo serializável, composição visual, preflight geométrico e pipeline determinístico de PDF.

Ele nasceu durante a produção de **KALLISTIS — Manual do Mundo**, mas KALLISTIS não é o produto. É um projeto editorial real usado como stress test de um engine deliberadamente genérico.

## Por que Book Composer

Livros estruturados repetem muito trabalho mecânico: materialização de conteúdo, paginação, continuidade de blocos, aplicação de templates, conferência de margens, sangria, overflow, imagens e saída final.

Automatizar isso ajuda. Automatizar a decisão editorial, não.

O Book Composer separa essas camadas:

- o **engine** executa composição, persistência, medições e exportação;
- o **projeto** define formato, identidade visual, conteúdo e regras locais;
- o **editor humano** decide ritmo, hierarquia, imagem, composição e exceções;
- o **preflight** reporta problemas físicos — não corrige silenciosamente o livro.

A régua é simples:

> **um livro novo deve poder existir sem carregar nenhuma característica obrigatória de KALLISTIS.**

## O que o Book Composer faz

- **Projetos de livro serializáveis** em JSON, com páginas, blocos, assets, fontes, spreads, templates e configurações editoriais.
- **Formatos físicos por projeto** — A4, A5, Letter, 6×9", 140×210 mm ou dimensões personalizadas.
- **Edição visual** com seleção, drag, resize, multiseleção, agrupamento, bloqueio, alinhamento e distribuição.
- **Templates editoriais** para capa, front matter, partes, capítulos, narrativa, regras em colunas, perfis, tabelas, citações, arte, mapas e cronologia.
- **Smart guides, réguas e grade** para composição manual precisa.
- **Assets e camadas** integrados ao projeto.
- **Persistência local** com snapshots, IndexedDB e File System Access API quando disponível.
- **Preflight estático + geométrico** para overflow, trim, assets, tabelas e outras ocorrências editoriais.
- **Superfície de impressão independente** em `/print`.
- **Exportação PDF real** via Chromium / Playwright, respeitando o tamanho físico definido pelo projeto.
- **Importação e materialização** de conteúdo estruturado para acelerar a construção inicial do livro.

## Onde a autoridade vive

| Camada | Responsabilidade | Não substitui |
| --- | --- | --- |
| **Engine** | renderizar, medir, paginar, persistir e exportar | julgamento editorial |
| **Projeto** | definir formato, tipografia, paleta, assets, páginas e regras locais | engine genérico |
| **Editor humano** | decidir composição, ritmo, hierarquia, imagens e exceções | automação |
| **Preflight** | tornar erros físicos e editoriais visíveis | decisão sobre o que o livro deve ser |

A regra operacional é:

> **erro real deve aparecer; decisão editorial deve continuar legível.**

## Genérico por construção

O Book Composer não fixa:

- identidade visual;
- tamanho de página;
- número de páginas;
- família tipográfica;
- paleta;
- biblioteca de assets;
- tipo de livro;
- projeto de origem.

O mesmo engine pode compor romance, livro de RPG, suplemento, manual técnico, livro didático, catálogo, zine, documentação ou obra ilustrada.

KALLISTIS permanece como um projeto complexo de validação — não como default do engine.

## Fluxo editorial

```text
manuscrito / conteúdo estruturado
              ↓
      importação / materialização
              ↓
       templates editoriais
              ↓
        páginas e spreads
              ↓
       edição visual humana
              ↓
            preflight
              ↓
          /print
              ↓
           PDF final
```

A automação produz estrutura e reduz trabalho repetitivo. O ajuste editorial final continua explícito no canvas.

## Preflight e PDF

O produto distingue duas superfícies:

- **screen** — diagnóstico da geometria do editor;
- **print** — autoridade de release em `/print + media=print`.

Essa separação evita fingir equivalência entre geometrias diferentes.

O export normal usa o preflight de impressão como gate real. `--force` existe para diagnóstico e não altera regras nem medições.

O pipeline de produção usa:

- Chromium / Playwright;
- página física derivada do projeto;
- composição em `/print`;
- geração de PDF no tamanho final configurado.

## KALLISTIS como stress test

KALLISTIS continua sendo o caso de regressão mais exigente do repositório:

- **431 páginas**;
- **140×210 mm**;
- composição narrativa, regras em colunas, tabelas, imagens e páginas especiais;
- save / reload / restore provados;
- preflight final com **0 errors em screen e 0 errors em print**;
- export normal sem `--force`;
- PDF final estrutural e visualmente validado.

Isso prova o engine em um projeto editorial grande sem transformar KALLISTIS em requisito arquitetural.

## Estado verificado

Estado promovido à `master` em **18/09/2026**.

| Capacidade | Estado |
| --- | --- |
| Engine genérico | PASS |
| Editor visual | PASS |
| Thumbnail lazy-mount / DOM controlado | PASS |
| Save / reload / restore | PASS |
| Screen preflight | **0 errors** |
| Print preflight | **0 errors** |
| Export normal | PASS |
| PDF final | PASS |
| Typecheck | PASS |
| Testes | PASS |
| Build | PASS |

Release verificado: `17daa4fd041eff4adcc7af172d3d21732f50bef9`.

### Limite de evidência conhecido

A conservação IR passou nos fixtures disponíveis, mas a prova contra uma fonte canônica externa não distribuída neste repositório não é afirmada como concluída.

Isso é registrado como **evidence gap**, não como falha observada do engine.

## Arquitetura

```text
BOOK COMPOSER
│
├── ENGINE
│   ├── modelo Book serializável
│   ├── renderer de páginas e blocos
│   ├── templates
│   ├── edição visual
│   ├── assets / layers
│   ├── persistência
│   ├── preflight
│   └── /print + PDF
│
├── PROJETO
│   ├── metadata
│   ├── formato físico / bleed / margens
│   ├── tipografia
│   ├── aparência
│   ├── assets
│   ├── páginas / spreads
│   └── configuração de exportação
│
└── CONTEÚDO / MATERIALIZAÇÃO
    ├── Markdown estruturado
    ├── importadores
    ├── materializadores
    └── presets / projetos editoriais
```

### Stack

- TypeScript
- React 19
- TanStack Start / Router
- Vite 8
- Bun
- Playwright / Chromium
- IndexedDB
- File System Access API
- Cloudflare adapters disponíveis para ambientes compatíveis

## Quick start

```bash
git clone https://github.com/NomosLudens/book-composer.git
cd book-composer/book_composer
bun install --frozen-lockfile
bun run dev
```

O editor abre na rota `/`. A rota `/print` é a superfície limpa usada para impressão e PDF.

Para checks principais:

```bash
bun run typecheck
bun run test
bun run build
```

Para exportação PDF:

```bash
bun run export:pdf -- --in <projeto.json> --out <arquivo.pdf> --url <url-do-app>
```

## Estrutura do repositório

```text
book-composer/
├── README.md
└── book_composer/
    ├── src/
    │   ├── book/       # modelo editorial, renderer, templates e estilos
    │   ├── editor/     # canvas, toolbar, painéis e estado
    │   ├── lib/        # persistência, preflight e assets
    │   └── routes/     # editor e /print
    ├── scripts/        # importação, materialização e PDF
    ├── projects/       # projetos serializáveis
    ├── fixtures/
    ├── docs/
    └── package.json
```

## O que este repositório é

Este é o **repositório canônico do Book Composer**.

Ele contém o engine, o editor, scripts de produção, fixtures, documentação e projetos usados para validar o fluxo editorial real.

O princípio de desenvolvimento é o mesmo adotado nos demais projetos da Nomos Ludens:

> **Reality over simulated success.**

Build verde ajuda. Teste automatizado ajuda. Mas funcionamento real do editor, persistência, geometria de impressão e PDF continuam sendo a evidência final do produto.

## Licença

Este repositório **não declara atualmente uma licença de software**.

A visibilidade pública do código não constitui, por si só, autorização para copiar, redistribuir ou relicenciar o conteúdo.

---

<div align="center">

### Nomos Ludens

**Technology for human agency.**  
**Empower, not replace.**

[Nomos Ludens](https://github.com/NomosLudens) · [Kuan](https://github.com/NomosLudens/kuan) · [OmniTreco](https://github.com/NomosLudens/omnitreco-repicable)

</div>
