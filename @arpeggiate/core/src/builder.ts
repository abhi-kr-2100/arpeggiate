import type { Keymap, ValidateKeySequence } from "./types.js";
import { normalizeSequence } from "./normalizer.js";

export class KeymapBuilder<TActionId extends string = string> {
  private readonly map = new Map<string, TActionId>();

  public bind<TSeq extends string>(
    sequence: ValidateKeySequence<TSeq>,
    actionId: TActionId
  ): this {
    const normalized = normalizeSequence(sequence);
    this.map.set(normalized, actionId);
    return this;
  }

  public unbind<TSeq extends string>(sequence: ValidateKeySequence<TSeq>): this {
    const normalized = normalizeSequence(sequence);
    this.map.delete(normalized);
    return this;
  }

  public clear(): this {
    this.map.clear();
    return this;
  }

  public build(): Keymap<TActionId> {
    const keymap: Record<string, TActionId> = {};
    for (const [seq, actionId] of this.map.entries()) {
      keymap[seq] = actionId;
    }
    return keymap as Keymap<TActionId>;
  }
}
