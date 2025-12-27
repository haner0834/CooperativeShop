export const isPwa = () =>
  window.matchMedia("(display-mode: standalone)").matches || // Android/PC Chrome/Edge
  (window.navigator as any).standalone || // iOS Safari
  document.referrer.includes("android-app://"); // Android TWA (受信任的 Web 活動)
