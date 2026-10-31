/**
 * Normalizes a raw keyboard event key string into canonical Arpeggiate format.
 *
 * @internal
 * @param rawKey - The raw `KeyboardEvent.key` value.
 * @returns The canonical key name.
 */
export function normalizeKey(rawKey: string): string {
  return rawKey === " " ? "Space" : rawKey;
}

/**
 * Normalizes an iterable collection of key tokens into deduplicated canonical key names.
 *
 * @internal
 * @param tokens - Iterable collection of key token strings.
 * @returns Array of deduplicated, normalized key names.
 */
export function normalizeTokens(tokens: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(tokens, normalizeKey)));
}

/**
 * Sorts and formats stroke keys into a canonical lexicographically sorted representation.
 *
 * @internal
 * @param keys - Iterable collection of key tokens.
 * @returns Sorted stroke string joined by `+`.
 */
export function sortStroke(keys: Iterable<string>): string {
  return normalizeTokens(keys).sort().join("+");
}

/**
 * Tokenizes a single shortcut stroke into constituent key tokens.
 *
 * @internal
 * @param stroke - Raw stroke string (e.g. `"Control+k"`, `"Control++"`, `"++Control"`).
 * @returns Array of individual key token strings.
 */
export function tokenizeStroke(stroke: string): string[] {
  if (!stroke) return [];
  if (stroke === "+") return ["+"];

  return stroke
    .replaceAll("+++", "+\0+")
    .replace(/^\+\+/, "\0+")
    .replace(/\+\+$/, "+\0")
    .split("+")
    .filter(Boolean)
    .map((k) => (k === "\0" ? "+" : k));
}

/**
 * Tokenizes a shortcut sequence string into strokes of key tokens.
 *
 * Whitespace serves strictly as the delimiter between strokes.
 * The space key is canonically represented as `"Space"`.
 *
 * @internal
 * @param seq - Raw shortcut sequence string (e.g. `"Control+k g g"`, `"Space Space"`).
 * @returns Array of strokes, each containing constituent key token strings.
 */
export function tokenizeSequence(seq: string): string[][] {
  const trimmed = seq.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).map(tokenizeStroke);
}

/**
 * Normalizes a shortcut sequence string into canonical stroke format.
 *
 * Parses each stroke, normalizes individual keys,
 * sorts each stroke, and rejoins strokes with a single space.
 *
 * @internal
 * @param seq - Raw sequence string (e.g. `"Control+k"`, `"g g"`, `"Control++"`).
 * @returns Canonical sequence string.
 */
export function normalizeSequence(seq: string): string {
  return tokenizeSequence(seq)
    .map(sortStroke)
    .filter((s) => s.length > 0)
    .join(" ");
}
