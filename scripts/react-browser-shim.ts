const React =
  typeof window !== "undefined" && typeof (window as unknown as { React: unknown }).React !== "undefined"
    ? (window as unknown as { React: typeof import("react") }).React
    : typeof globalThis !== "undefined" && typeof (globalThis as unknown as { React: unknown }).React !== "undefined"
      ? (globalThis as unknown as { React: typeof import("react") }).React
      : ({} as typeof import("react"));

export const createContext = React.createContext;
export const useContext = React.useContext;
export const useEffect = React.useEffect;
export const useRef = React.useRef;
export const useState = React.useState;
export default React;
