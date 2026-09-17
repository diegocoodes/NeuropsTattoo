export function canUseMotion() {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;

  return !navigator.webdriver && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;
}
