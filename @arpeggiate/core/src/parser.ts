import { type NextToken, type Trim } from "./utils.js";

/**
 * An individual key identifier.
 */
type Key = string;

/**
 * A non-empty set of keys pressed simultaneously.
 */
type Stroke = ReadonlySet<Key>;

/**
 * An ordered succession of one or more strokes.
 */
export type Sequence = readonly [Stroke, ...Stroke[]];

/**
 * Statically parses a stroke string into a union of Key identifiers at compile time.
 */
type ParseStrokeKeys<S extends string> = S extends "+"
  ? "+"
  : S extends `++${infer Rest}`
    ? Rest extends ""
      ? never
      : ParseStrokeKeys<Rest> extends never
        ? never
        : "+" | ParseStrokeKeys<Rest>
    : S extends `+${string}`
      ? never
      : S extends `${infer Head}+${infer Rest}`
        ? Head extends ""
          ? never
          : ParseStrokeKeys<Rest> extends never
            ? never
            : Head | ParseStrokeKeys<Rest>
        : S extends ""
          ? never
          : S;

/**
 * Statically parses consecutive strokes separated by the Sequence Delimiter at compile time.
 */
type ParseStrokes<
  S extends string,
  Acc extends readonly Stroke[] = [],
> = NextToken<S> extends [infer Token extends string, infer Rest extends string]
  ? ParseStrokeKeys<Token> extends never
    ? never
    : Rest extends ""
      ? readonly [...Acc, ReadonlySet<ParseStrokeKeys<Token>>]
      : ParseStrokes<
          Rest,
          readonly [...Acc, ReadonlySet<ParseStrokeKeys<Token>>]
        >
  : never;

/**
 * Static verification and transformation of a Sequence String literal at compile time via the type system.
 */
type ParseSequence<S extends string> = string extends S
  ? never
  : Trim<S> extends ""
    ? never
    : ParseStrokes<Trim<S>>;

/**
 * Statically validates a Sequence String literal at compile time.
 */
type ParseSequenceString<S extends string> = ParseSequence<S> extends never
  ? never
  : S;

/**
 * Validates a Sequence String during program execution.
 */
type RuntimeSequenceString<S extends string> = S & (string extends S ? string : never);

/**
 * Parses a serialized stroke string into a Stroke.
 *
 * @param strokeString - The serialized string of concurrent Keys within a Stroke.
 * @returns A non-empty set of keys pressed simultaneously.
 */
function parseStroke(strokeString: string): Stroke {
  const keys = new Set<string>();
  let remaining = strokeString;

  while (remaining.length > 0) {
    if (remaining === "+") {
      keys.add("+");
      break;
    }

    if (remaining.startsWith("++")) {
      remaining = remaining.slice(2);
      if (remaining.length === 0) {
        throw new Error("Invalid Sequence String");
      }
      keys.add("+");
    } else if (remaining.startsWith("+")) {
      throw new Error("Invalid Sequence String");
    } else {
      const plusIndex = remaining.indexOf("+");
      if (plusIndex === -1) {
        keys.add(remaining);
        break;
      }
      keys.add(remaining.slice(0, plusIndex));
      remaining = remaining.slice(plusIndex + 1);
      if (remaining.length === 0) {
        throw new Error("Invalid Sequence String");
      }
    }
  }

  return keys;
}

/**
 * Validates a Sequence String literal at compile time and transforms it into a strongly typed Sequence.
 *
 * @param sequenceString - A serialized string representation of a Sequence adhering to Stroke Delimiter and Sequence Delimiter syntax.
 * @returns An ordered succession of one or more strokes.
 */
export function parse<S extends string>(
  sequenceString: ParseSequenceString<S>,
): ParseSequence<S>;
/**
 * Validates a Sequence String and transforms it into a Sequence during program execution.
 *
 * @param sequenceString - A serialized string representation of a Sequence adhering to Stroke Delimiter and Sequence Delimiter syntax.
 * @returns An ordered succession of one or more strokes.
 */
export function parse<S extends string = string>(
  sequenceString: RuntimeSequenceString<S>,
): Sequence;
export function parse(sequenceString: string): Sequence {
  const trimmed = sequenceString.trim();
  if (trimmed.length === 0) {
    throw new Error("Empty Sequence String");
  }

  const parts = trimmed.split(/\s+/);
  const strokes: Sequence = [
    parseStroke(parts[0]!),
    ...parts.slice(1).map(parseStroke),
  ];

  return strokes;
}
