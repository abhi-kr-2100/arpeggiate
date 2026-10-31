import * as ArpeggiateReact from "./index.js";

if (typeof window !== "undefined") {
  const win = window as unknown as {
    ArpeggiateReact: typeof ArpeggiateReact;
  };
  win.ArpeggiateReact = ArpeggiateReact;
}

if (typeof globalThis !== "undefined") {
  const glob = globalThis as unknown as {
    ArpeggiateReact: typeof ArpeggiateReact;
  };
  glob.ArpeggiateReact = ArpeggiateReact;
}

export default ArpeggiateReact;
export * from "./index.js";
