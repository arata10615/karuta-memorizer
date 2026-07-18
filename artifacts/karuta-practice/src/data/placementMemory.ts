import { apiUrl } from "./api";

const USER_ID_KEY = "karuta_user_id";
const DISPLAY_NAME_KEY = "karuta_display_name";
const GOOGLE_LINKED_KEY = "karuta_google_linked";
const SESSION_TOKEN_KEY = "karuta_session_token";

let cachedUserId: string | null = null;

export function getUserId(): string | null {
  return cachedUserId || localStorage.getItem(USER_ID_KEY);
}

export function getDisplayName(): string | null {
  return localStorage.getItem(DISPLAY_NAME_KEY);
}

export function isGoogleLinked(): boolean {
  return Boolean(getSessionToken()) && localStorage.getItem(GOOGLE_LINKED_KEY) === "true";
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function getAuthenticatedHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(GOOGLE_LINKED_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
  cachedUserId = null;
}

export async function getGoogleClientId(): Promise<string | null> {
  const clientIdFromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (typeof clientIdFromEnv === "string" && clientIdFromEnv.trim().length > 0) {
    return clientIdFromEnv.trim();
  }
  try {
    const res = await fetch(apiUrl("/users/google-client-id"));
    if (!res.ok) return null;
    const data = await res.json();
    return data.clientId || null;
  } catch {
    return null;
  }
}

export async function loginWithGoogle(credential: string): Promise<{
  id: string;
  displayName: string | null;
} | null> {
  try {
    const res = await fetch(apiUrl("/users/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.user;
    if (user?.id && typeof user.sessionToken === "string") {
      localStorage.setItem(USER_ID_KEY, user.id);
      localStorage.setItem(SESSION_TOKEN_KEY, user.sessionToken);
      cachedUserId = user.id;
      if (user.displayName) localStorage.setItem(DISPLAY_NAME_KEY, user.displayName);
      localStorage.setItem(GOOGLE_LINKED_KEY, "true");
      return { id: user.id, displayName: user.displayName };
    }
    return null;
  } catch (err) {
    console.error("Failed to login with Google:", err);
    return null;
  }
}

export async function recordPlacement(): Promise<void> {
  // 敵陣学習機能の廃止準備: 学習データの保存は停止
}

const PRESET_ROW_COUNTS: number[][] = [
  [8, 8, 9],
  [9, 8, 8],
  [8, 9, 8],
  [7, 9, 9],
  [9, 9, 7],
];

export async function generateOpponentGrid(
  cardIds: number[],
  gridRows: number,
  gridCols: number,
): Promise<(number | null)[][]> {
  const grid: (number | null)[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => null),
  );
  const shuffled = [...cardIds].sort(() => Math.random() - 0.5);
  const rowCounts = PRESET_ROW_COUNTS[Math.floor(Math.random() * PRESET_ROW_COUNTS.length)];

  let index = 0;
  for (let row = 0; row < gridRows; row++) {
    const count = Math.min(rowCounts[row] || gridCols, shuffled.length - index);
    const leftCount = Math.ceil(count / 2);
    const rightCount = count - leftCount;

    for (let column = 0; column < leftCount && index < shuffled.length; column++) {
      grid[row][column] = shuffled[index++];
    }
    for (let column = 0; column < rightCount && index < shuffled.length; column++) {
      grid[row][gridCols - 1 - column] = shuffled[index++];
    }
  }
  return grid;
}
