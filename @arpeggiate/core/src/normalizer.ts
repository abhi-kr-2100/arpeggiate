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

export class KeyStroke {
  public readonly tokens: readonly string[];
  private readonly formatted: string;

  constructor(tokens: Iterable<string>) {
    const list = Array.from(tokens)
      .map((token) => normalizeEventKey(token.trim()))
      .filter((token) => token.length > 0);
    this.tokens = sortComboKeys(list);
    this.formatted = this.tokens.join("+");
  }

  public static parse(rawStroke: string): KeyStroke {
    const trimmed = rawStroke.trim();
    if (trimmed === "+") {
      return new KeyStroke(["+"]);
    }
    if (trimmed.endsWith("++")) {
      const prefix = trimmed.slice(0, -2);
      const prefixTokens = prefix
        .split("+")
        .map((token) => token.trim())
        .filter((token) => token.length > 0);
      return new KeyStroke([...prefixTokens, "+"]);
    }
    const tokens = trimmed
      .split("+")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    return new KeyStroke(tokens);
  }

  public toString(): string {
    return this.formatted;
  }

  public equals(other: KeyStroke | string): boolean {
    const target = typeof other === "string" ? other : other.toString();
    return this.formatted === target;
  }
}

export class KeySequence {
  public readonly strokes: readonly KeyStroke[];
  private readonly formatted: string;

  constructor(strokes: Iterable<KeyStroke>) {
    this.strokes = Array.from(strokes);
    this.formatted = this.strokes.map((stroke) => stroke.toString()).filter((s) => s.length > 0).join(" ");
  }

  public static parse(rawSequence: string): KeySequence {
    const parts = rawSequence
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);
    const strokes = parts.map((part) => KeyStroke.parse(part));
    return new KeySequence(strokes);
  }

  public get length(): number {
    return this.strokes.length;
  }

  public toString(): string {
    return this.formatted;
  }

  public equals(other: KeySequence | string): boolean {
    const target = typeof other === "string" ? other : other.toString();
    return this.formatted === target;
  }
}

export function normalizeStroke(stroke: string): string {
  return KeyStroke.parse(stroke).toString();
}

export function normalizeSequence(sequence: string): string {
  return KeySequence.parse(sequence).toString();
}
