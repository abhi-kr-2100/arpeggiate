/**
 * Represents whitespace characters defining the Sequence Delimiter.
 */
export type Whitespace = " " | "\t" | "\n" | "\r";

/**
 * Statically trims leading whitespace from a string literal at compile time.
 */
export type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}`
  ? TrimLeft<Rest>
  : S;

/**
 * Statically trims trailing whitespace from a string literal at compile time.
 */
export type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}`
  ? TrimRight<Rest>
  : S;

/**
 * Statically trims leading and trailing whitespace from a string literal at compile time.
 */
export type Trim<S extends string> = TrimLeft<TrimRight<S>>;

/**
 * Statically extracts the next token up to whitespace at compile time.
 */
export type NextToken<
  S extends string,
  Acc extends string = "",
> = S extends `${infer Char}${infer Rest}`
  ? Char extends Whitespace
    ? [Acc, TrimLeft<Rest>]
    : NextToken<Rest, `${Acc}${Char}`>
  : [Acc, ""];

