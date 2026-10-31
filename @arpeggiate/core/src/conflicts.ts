import type { ConflictResult, Keymap } from "./types.js";
import { normalizeSequence } from "./normalizer.js";

const DEFAULT_RESERVED_SEQUENCES: readonly string[] = [
  "Ctrl+w",
  "Ctrl+t",
  "Ctrl+n",
  "Ctrl+Shift+n",
  "Ctrl+Shift+w",
  "Ctrl+Tab",
  "Ctrl+Shift+Tab",
  "Alt+F4",
];

export function detectConflicts<TActionId extends string = string>(
  bindings: Keymap<TActionId>,
  reservedBrowserKeys: readonly string[] = DEFAULT_RESERVED_SEQUENCES
): readonly ConflictResult<TActionId>[] {
  const conflicts: ConflictResult<TActionId>[] = [];
  const entries = Object.entries(bindings);

  // 1. Direct Collisions: Check for duplicate sequences in raw bindings
  const sequenceToActionMap = new Map<string, TActionId[]>();
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (typeof entry !== "undefined") {
      const [rawSeq, actionId] = entry;
      const normalized = normalizeSequence(rawSeq);
      const existing = sequenceToActionMap.get(normalized);
      if (typeof existing === "undefined") {
        sequenceToActionMap.set(normalized, [actionId]);
      } else if (!existing.includes(actionId)) {
        existing.push(actionId);
      }
    }
  }

  for (const [sequence, actionIds] of sequenceToActionMap.entries()) {
    if (actionIds.length > 1) {
      const first = actionIds[0];
      const second = actionIds[1];
      if (typeof first === "string" && typeof second === "string") {
        conflicts.push({
          type: "direct_collision",
          sequence,
          actionIds: [first, second, ...actionIds.slice(2)],
        });
      }
    }
  }

  // 2. Prefix Shadowing, Combo Shadowing, and Browser Reserved Checks
  const normalizedEntries: Array<{ sequence: string; actionId: TActionId; strokes: string[] }> = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (typeof entry !== "undefined") {
      const [rawSeq, actionId] = entry;
      const normalized = normalizeSequence(rawSeq);
      normalizedEntries.push({
        sequence: normalized,
        actionId,
        strokes: normalized.split(" "),
      });
    }
  }

  for (let i = 0; i < normalizedEntries.length; i += 1) {
    const itemA = normalizedEntries[i];
    if (typeof itemA === "undefined") continue;

    // Browser reserved check
    for (let r = 0; r < reservedBrowserKeys.length; r += 1) {
      const reserved = reservedBrowserKeys[r];
      if (typeof reserved === "string") {
        const normReserved = normalizeSequence(reserved);
        if (
          normReserved.length > 0 &&
          (itemA.sequence === normReserved || itemA.sequence.startsWith(`${normReserved} `))
        ) {
          conflicts.push({
            type: "reserved_browser",
            sequence: itemA.sequence,
            actionId: itemA.actionId,
          });
          break;
        }
      }
    }

    // Cross-entry comparisons
    for (let j = 0; j < normalizedEntries.length; j += 1) {
      if (i === j) continue;
      const itemB = normalizedEntries[j];
      if (typeof itemB === "undefined") continue;

      // Prefix Shadowing: itemA is a strict prefix of itemB
      if (itemB.sequence.startsWith(`${itemA.sequence} `)) {
        conflicts.push({
          type: "prefix_shadowing",
          prefixSequence: itemA.sequence,
          prefixActionId: itemA.actionId,
          longerSequence: itemB.sequence,
          longerActionId: itemB.actionId,
        });
      }

      // Combo Shadowing: single key in itemA is part of simultaneous combo in itemB
      const firstStrokeA = itemA.strokes[0];
      if (itemA.strokes.length === 1 && typeof firstStrokeA === "string" && !firstStrokeA.includes("+")) {
        const firstStrokeB = itemB.strokes[0];
        if (typeof firstStrokeB === "string" && firstStrokeB.includes("+")) {
          const comboKeys = firstStrokeB.split("+");
          if (comboKeys.includes(firstStrokeA)) {
            conflicts.push({
              type: "combo_shadowing",
              singleKeySequence: itemA.sequence,
              singleActionId: itemA.actionId,
              comboSequence: itemB.sequence,
              comboActionId: itemB.actionId,
            });
          }
        }
      }
    }
  }

  return conflicts;
}
