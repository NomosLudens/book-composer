# BOOK COMPOSER — FASE 1B

## Resultado

REAL_MARKDOWN_SOURCE=/home/tonyus-dev/Downloads/KALLISTIS_LIVRO_II_REGRAS_DO_JOGO.md
REAL_MARKDOWN_BYTES=384121
REAL_MARKDOWN_LINES=7276
REAL_MARKDOWN_CHARACTERS=371832
MARKED_REAL_PARSE=PASS
IR_BUILD=PASS
BOOK_BUILD=PASS
PROCESS_COMPLETES_WITHOUT_MANUAL_INTERRUPT=YES

## Pipeline medido

Com instrumentação sem serializar a AST inteira:

    STAGE=MARKED
    INPUT_CHARS=371832
    OUTPUT_NODES=6191
    DURATION_MS=14666
    STATUS=PASS

    STAGE=IR
    INPUT_NODES=6191
    OUTPUT_NODES=6191
    DURATION_MS=14426
    STATUS=PASS

    STAGE=BOOK
    BOOK_NODES=29
    BOOK_PAGES=31
    BOOK_BLOCKS=3098
    DURATION_MS=14195
    STATUS=PASS

O lexer isolado via Node concluiu em aproximadamente 110 ms. O runtime Bun usado nos scripts levou aproximadamente 14–15 s por execução. O perfil inicial executava o parser três vezes e imprimia a árvore inteira, produzindo a falsa aparência de travamento. Não foi encontrado loop infinito.

## Causa localizada

    BOTTLENECK_STAGE=runtime/parser invocation under Bun
    ROOT_CAUSE=profiling e transform paths invocam marked independentemente; o perfil inicial serializava a AST inteira
    ROOT_CAUSE_TYPE=PERFORMANCE_COMPLEXITY / instrumentation amplification

O source mapping foi ajustado para pré-calcular offsets de linha e usar busca binária, removendo o recálculo de linhas por nó.

    FIX_APPLIED=YES

## Fonte real

    REAL_IR_CREATED=YES
    REAL_IR_NODE_COUNT=6191
    REAL_MARKDOWN_PARSED=YES
    REAL_BOOK_CREATED=YES
    REAL_BOOK_NODES=29
    REAL_BOOK_PAGES=31
    REAL_BOOK_BLOCKS=3098
    SOURCE_RANGES_MONOTONIC=YES

Diagnóstico preservado:

    UNSUPPORTED_NODE_COUNT=1
    UNSUPPORTED_NODE_TYPES=code
    UNSUPPORTED_SYNTAX_SILENTLY_DROPPED=NO

## Conservação

Fixture adversarial:

    ADVERSARIAL_TOKENS_EXPECTED=19
    ADVERSARIAL_TOKENS_FOUND=19
    ADVERSARIAL_TOKENS_MISSING=0
    ADVERSARIAL_TOKENS_DUPLICATED=0
    ADVERSARIAL_TOKENS_OUT_OF_ORDER=0

A conservação sem tokens artificiais no manuscrito real ainda não foi provada na fronteira IR→Book.

    REAL_SOURCE_UNITS=6191
    REAL_ACCOUNTED_UNITS=UNVERIFIED_AT_BOOK_BOUNDARY
    REAL_UNACCOUNTED_UNITS=UNVERIFIED
    REAL_DUPLICATED_UNITS=UNVERIFIED
    REAL_OUT_OF_ORDER_UNITS=UNVERIFIED

## Gates

    TYPECHECK=PASS
    TARGETED_CONSERVATION=PASS
    REAL_MARKDOWN_PARSE=PASS
    REAL_IR_BUILD=PASS
    REAL_BOOK_BUILD=PASS
    COMMIT=NO
    DEPLOY=NO

## Escopo não executado

Não foram implementados paginação geométrica, widow/orphan, recto/verso, TOC iterativo, PDF visual, algoritmo avançado de tabelas ou imagens, nem reimportação incremental.

## Veredito

    VERDICT=INCIDENT
    PHASE_1_COMPLETE=NO
    BLOCKER=conservação completa no limite IR→Book ainda não provada; runtime Bun precisa evitar parse duplicado

O bloqueio original foi localizado como custo de execução/instrumentação, não como loop infinito. A fase só poderá receber PASS depois que a conservação real for verificada também na fronteira do Book.
