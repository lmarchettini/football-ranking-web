const runtime = window.__APP_CONFIG__ ?? {};

export function apiUrl(runtimeKey, viteKey, fallback) {
  return runtime[runtimeKey] || import.meta.env[viteKey] || fallback;
}
