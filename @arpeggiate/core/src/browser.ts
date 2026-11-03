import * as ArpeggiateCore from "./index.js";

if (typeof window !== "undefined") {
  const win = window as unknown as {
    ArpeggiateCore: typeof ArpeggiateCore;
    Arpeggiate: typeof ArpeggiateCore;
  };
  win.ArpeggiateCore = ArpeggiateCore;
  win.Arpeggiate = ArpeggiateCore;
}

if (typeof globalThis !== "undefined") {
  const glob = globalThis as unknown as {
    ArpeggiateCore: typeof ArpeggiateCore;
    Arpeggiate: typeof ArpeggiateCore;
  };
  glob.ArpeggiateCore = ArpeggiateCore;
  glob.Arpeggiate = ArpeggiateCore;
}

export default ArpeggiateCore;
export * from "./index.js";
