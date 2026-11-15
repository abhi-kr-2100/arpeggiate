/**
 * An individual key identifier.
 */
export type Key = string;

/**
 * A non-empty set of keys pressed simultaneously.
 */
export type Stroke = ReadonlySet<Key>;

/**
 * An ordered succession of one or more strokes.
 */
export type Sequence = readonly [Stroke, ...Stroke[]];

/**
 * Parses a serialized stroke string into a Stroke.
 *
 * @param strokeString - The serialized string of concurrent Keys within a Stroke.
 * @returns A non-empty set of keys pressed simultaneously.
 */
function parseStroke(strokeString: string): Stroke {
  const keys = new Set<string>();
  const parts = strokeString.split("+");

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part !== "") {
      keys.add(part);
    } else if (parts[i + 1] === "") {
      // A literal "+" key splits into two adjacent empty segments.
      keys.add("+");
      i++;
    } else {
      throw new Error("Invalid Sequence String");
    }
  }

  return keys;
}

/**
 * Validates a Sequence String and transforms it into a Sequence during program execution.
 *
 * @param sequenceString - A serialized string representation of a Sequence adhering to Stroke Delimiter and Sequence Delimiter syntax.
 * @returns An ordered succession of one or more strokes.
 */
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
