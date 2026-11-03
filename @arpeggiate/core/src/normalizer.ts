const MODIFIER_PRIORITIES: Readonly<Record<string, number>> = {
  Mod: 1,
  Ctrl: 2,
  Alt: 3,
  Shift: 4,
  Meta: 5,
};

const EVENT_KEY_MAP: Readonly<Record<string, string>> = {
  " ": "Space",
  Control: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Meta: "Meta",
};

export function normalizeEventKey(rawKey: string): string {
  if (rawKey in EVENT_KEY_MAP) {
    const mapped = EVENT_KEY_MAP[rawKey];
    if (typeof mapped === "string") {
      return mapped;
    }
  }

  // Symmetrical case: single character uppercase letters are lowercased
  if (rawKey.length === 1 && rawKey >= "A" && rawKey <= "Z") {
    return rawKey.toLowerCase();
  }

  return rawKey;
}

export function sortComboKeys(keys: readonly string[]): string[] {
  const list = [...keys];
  list.sort((a, b) => {
    const priorityA = a in MODIFIER_PRIORITIES ? (MODIFIER_PRIORITIES[a] as number) : 10;
    const priorityB = b in MODIFIER_PRIORITIES ? (MODIFIER_PRIORITIES[b] as number) : 10;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.localeCompare(b);
  });
  return list;
}

export function formatComboFromKeys(keys: Iterable<string>): string {
  const array = Array.from(keys);
  if (array.length === 0) {
    return "";
  }
  const sorted = sortComboKeys(array);
  return sorted.join("+");
}

export function normalizeStroke(stroke: string): string {
  const tokens = stroke.split("+").map((token) => token.trim()).filter((token) => token.length > 0);
  const normalizedTokens = tokens.map((token) => normalizeEventKey(token));
  return formatComboFromKeys(normalizedTokens);
}

export function normalizeSequence(sequence: string): string {
  const strokes = sequence.trim().split(/\s+/).filter((part) => part.length > 0);
  const normalizedStrokes = strokes.map((stroke) => normalizeStroke(stroke));
  return normalizedStrokes.join(" ");
}
