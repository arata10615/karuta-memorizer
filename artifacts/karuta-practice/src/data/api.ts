const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// 本番では例: https://api.example.com/api を設定する。未設定時はローカル開発用の同一オリジンAPIを使う。
export const API_BASE = (configuredApiBaseUrl || "/api").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
