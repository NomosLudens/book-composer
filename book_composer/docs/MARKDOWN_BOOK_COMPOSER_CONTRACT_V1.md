# Markdown para BOOK-COMPOSER — Contrato Editorial v1

Status: **CONGELADO PARA AUTORIA**  
Data: 2026-09-11

Este documento define o Markdown que deve ser usado para alimentar o BOOK-COMPOSER. Ele separa conteúdo, hierarquia e composição. O importador deve interpretar este contrato; não deve inferir paginação a partir de um livro específico.

## Regra principal

Uma página não é definida por quantidade de caracteres. O importador deve construir unidades editoriais e o Composer deve paginá-las pela altura renderizada.

Uma unidade editorial é o título e o conteúdo que pertence a ele: parágrafos, listas, tabelas, regras e notas. Uma unidade nunca deve ser cortada no meio sem que o autor permita.

## Estrutura do manuscrito

```markdown
---
title: "Título do livro"
subtitle: "Subtítulo"
author: "Autor"
format: "140x210"
language: "pt-BR"
toc: true
---

# PARTE I — NOME DA PARTE

## Nome do capítulo

### Nome do tópico

Parágrafo introdutório.

#### Nome do subtópico

Texto do subtópico.
```

### Níveis congelados

| Markdown | Significado | Comportamento |
|---|---|---|
| `#` | Parte | abre uma página de parte |
| `##` | Capítulo | abre capítulo e entra no sumário |
| `###` | Tópico | unidade editorial, não necessariamente nova página |
| `####` | Subtópico | permanece junto do primeiro bloco quando possível |
| `#####` | Item | unidade curta; nunca usar para separar frases |
| `######` | Detalhe | não abre página; pertence ao item anterior |

Não usar níveis para simular espaço, quebra de página ou destaque visual.

## O que não deve ser escrito

Não colocar no manuscrito:

- paginação manual;
- números de página no texto;
- um sumário preenchido manualmente;
- títulos repetidos para forçar quebra;
- várias formas do Merge em um único parágrafo;
- `---` como tentativa de controlar página;
- hashes Markdown dentro de parágrafos;
- linhas com apenas espaços para criar respiro.

O Composer gera o sumário e os números de página depois da composição.

## Blocos de regras

Cada regra autônoma deve começar em um subtítulo e ter seus campos em linhas separadas:

```markdown
#### Forma: Travessia

**Custo:** 1 Fluxo  
**Limite:** uma vez por cena  
**Alcance:** uma zona  
**Efeito:** descreva o efeito completo em um ou mais parágrafos.
```

O mesmo padrão vale para técnicas, poderes, criaturas, itens, condições e entradas de glossário.

## Listas

Uma lista pertence ao bloco imediatamente anterior. Não misturar itens de assuntos diferentes na mesma lista.

```markdown
#### Benefícios

- primeiro benefício;
- segundo benefício;
- terceiro benefício.
```

Se um item tiver mais de um parágrafo, manter a indentação de quatro espaços.

## Tabelas

Usar tabela Markdown somente para dados realmente tabulares:

```markdown
| Resultado | Consequência |
|---|---|
| Falha | A consequência acontece. |
| Sucesso | O objetivo é alcançado. |
```

Não usar tabelas para diagramar texto, duas colunas literárias ou caixas decorativas.

## Merge e conjuntos repetidos

Cada forma, técnica ou entrada deve ser uma unidade própria:

```markdown
### Merge

Introdução do sistema.

#### Forma: Nome da forma

**Custo:** ...  
**Efeito:** ...

#### Forma: Outra forma

**Custo:** ...  
**Efeito:** ...
```

O Composer pode mover uma forma inteira para a página seguinte. Ele nunca deve dividir uma forma entre páginas, salvo quando a própria forma exceder uma página física.

## Sumário

Escrever apenas a âncora editorial:

```markdown
## Sumário
```

O conteúdo abaixo desse título não deve ser uma lista manual. O Composer deve gerar o bloco `toc` usando as partes e capítulos efetivamente paginados.

## Glifos, símbolos e Unicode

Usar Unicode literal no arquivo UTF-8 quando o símbolo for conteúdo:

```markdown
Luz: ☼ · Escuridão: ☾ · Ressonância: ◇
```

Não usar glifos como controle de layout. Para um símbolo necessário à composição, o importador deve preservar o caractere e o preflight deve verificar se a fonte consegue renderizá-lo.

## Separação entre conteúdo e composição

O Markdown define:

- texto;
- hierarquia;
- listas;
- tabelas;
- relações entre unidades.

O Composer define:

- template de página;
- margens;
- colunas;
- viúvas e órfãs;
- quebra entre unidades;
- sumário;
- fólio;
- continuidade de tabelas.

O autor não deve tentar resolver composição física com caracteres, espaços ou títulos falsos.

## Critérios de aceite do importador

Uma importação só pode ser considerada válida quando:

1. nenhum hash de heading aparece dentro de texto;
2. nenhum heading fica sozinho no final de uma página;
3. uma unidade editorial não é cortada entre páginas sem autorização;
4. listas e tabelas permanecem íntegras;
5. o sumário é gerado depois da paginação;
6. os números do sumário correspondem aos fólios reais;
7. glifos preservados passam pelo preflight de fonte;
8. não há páginas artificialmente vazias por cortes arbitrários;
9. não há páginas estouradas na renderização real;
10. o resultado é revisado no navegador e no modo de impressão.

Este contrato é a referência para novos manuscritos. O arquivo atual do KALLISTIS deve ser adaptado a ele antes de uma nova materialização editorial.
