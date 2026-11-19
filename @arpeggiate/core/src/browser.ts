/**
 * Browser entry point that exposes the Parser subsystem on the global scope.
 */

import * as ArpeggiateNamespace from "./index.js";

declare global {
  /**
   * Global browser namespace for arpeggiate.
   */
  // eslint-disable-next-line no-var
  var arpeggiate: typeof ArpeggiateNamespace | undefined;
}

const targetGlobal =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof window !== "undefined" && window) ||
  undefined;

if (targetGlobal) {
  (
    targetGlobal as unknown as { arpeggiate: typeof ArpeggiateNamespace }
  ).arpeggiate = ArpeggiateNamespace;
}

export * from "./index.js";
