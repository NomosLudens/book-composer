import { emptyBook } from "./empty-book";

/**
 * Compatibilidade histórica do módulo `canonical-book`.
 *
 * O Book Composer público não incorpora uma cópia do manuscrito KALLISTIS.
 * O estado inicial canônico do produto é o livro vazio genérico.
 */
export const canonicalBook = emptyBook;
