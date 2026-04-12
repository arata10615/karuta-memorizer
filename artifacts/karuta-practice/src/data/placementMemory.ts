const API_BASE = "/api";

const DEVICE_ID_KEY = "karuta_device_id";
const USER_ID_KEY = "karuta_user_id";

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

let cachedUserId: string | null = null;

export async function ensureUser(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;

  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) {
    cachedUserId = stored;
    return stored;
  }

  try {
    const deviceId = getDeviceId();
    const res = await fetch(`${API_BASE}/users/device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const userId = data.user?.id;
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
      cachedUserId = userId;
    }
    return userId || null;
  } catch (err) {
    console.error("Failed to ensure user:", err);
    return null;
  }
}

export function getUserId(): string | null {
  return cachedUserId || localStorage.getItem(USER_ID_KEY);
}

let cachedSelfModel: Record<number, Record<string, number>> | null = null;
let cachedGlobalModel: Record<number, Record<string, number>> | null = null;
let cachedSelfPairs: { cardA: number; cardB: number; count: number }[] | null = null;
let cachedGlobalPairs: { cardA: number; cardB: number; count: number }[] | null = null;

export async function recordPlacement(
  selfGrid: (number | null)[][] | null,
  opGrid: (number | null)[][]
) {
  try {
    const userId = getUserId();
    const body: Record<string, unknown> = { opGrid, userId };
    if (selfGrid) body.selfGrid = selfGrid;
    await fetch(`${API_BASE}/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    cachedSelfModel = null;
    cachedGlobalModel = null;
    cachedSelfPairs = null;
    cachedGlobalPairs = null;
  } catch (err) {
    console.error("Failed to record placement:", err);
  }
}

interface PlacementModel {
  model: Record<number, Record<string, number>>;
  pairs: { cardA: number; cardB: number; count: number }[];
  totalSessions: number;
}

async function fetchModel(field: string, userId?: string | null): Promise<PlacementModel> {
  try {
    const params = new URLSearchParams({ field });
    if (userId) params.set("userId", userId);
    const res = await fetch(`${API_BASE}/placements/model?${params}`);
    if (!res.ok) return { model: {}, pairs: [], totalSessions: 0 };
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch placement model:", err);
    return { model: {}, pairs: [], totalSessions: 0 };
  }
}

export async function smartAutoPlace(
  cardIds: number[],
  existingGrid: (number | null)[][],
  gridRows: number,
  gridCols: number,
  rowCounts: number[],
  mode: "self" | "opponent"
): Promise<(number | null)[][]> {
  const grid = existingGrid.map((r) => [...r]);

  const alreadyPlaced = new Set<number>();
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] !== null) alreadyPlaced.add(grid[r][c]!);
    }
  }

  const remaining = cardIds.filter((id) => !alreadyPlaced.has(id));
  if (remaining.length === 0) return grid;

  let modelData: PlacementModel;
  if (mode === "self") {
    const userId = getUserId();
    if (!cachedSelfModel) {
      modelData = await fetchModel("self", userId);
      cachedSelfModel = modelData.model;
      cachedSelfPairs = modelData.pairs;
    } else {
      modelData = { model: cachedSelfModel, pairs: cachedSelfPairs || [], totalSessions: 0 };
    }
  } else {
    if (!cachedGlobalModel) {
      modelData = await fetchModel("self");
      cachedGlobalModel = modelData.model;
      cachedGlobalPairs = modelData.pairs;
    } else {
      modelData = { model: cachedGlobalModel, pairs: cachedGlobalPairs || [], totalSessions: 0 };
    }
  }

  const { model, pairs } = modelData;
  const hasData = Object.keys(model).length > 0;

  if (!hasData) {
    return fallbackPlace(remaining, grid, gridRows, gridCols, rowCounts);
  }

  return patternPlace(remaining, grid, gridRows, gridCols, rowCounts, model, pairs);
}

function patternPlace(
  remaining: number[],
  grid: (number | null)[][],
  gridRows: number,
  gridCols: number,
  rowCounts: number[],
  model: Record<number, Record<string, number>>,
  pairs: { cardA: number; cardB: number; count: number }[]
): (number | null)[][] {
  const availableSlots: { r: number; c: number }[] = [];
  for (let r = 0; r < gridRows; r++) {
    const maxForRow = rowCounts[r] || gridCols;
    const leftCount = Math.ceil(maxForRow / 2);
    const rightCount = maxForRow - leftCount;
    for (let c = 0; c < leftCount; c++) {
      if (grid[r][c] === null) availableSlots.push({ r, c });
    }
    for (let c = 0; c < rightCount; c++) {
      const col = gridCols - 1 - c;
      if (grid[r][col] === null) availableSlots.push({ r, c: col });
    }
  }

  const pairMap = new Map<string, number>();
  for (const p of pairs) {
    const key = p.cardA < p.cardB ? `${p.cardA},${p.cardB}` : `${p.cardB},${p.cardA}`;
    pairMap.set(key, (pairMap.get(key) || 0) + p.count);
  }

  const cards = [...remaining];
  const placed: { cardId: number; r: number; c: number }[] = [];

  for (let iter = 0; iter < cards.length && availableSlots.length > 0; iter++) {
    let bestCard = -1;
    let bestSlot = -1;
    let bestScore = -1;

    for (let ci = 0; ci < cards.length; ci++) {
      const cardId = cards[ci];
      const cardModel = model[cardId];

      for (let si = 0; si < availableSlots.length; si++) {
        const slot = availableSlots[si];
        let score = 0;

        if (cardModel) {
          const key = `${slot.r},${slot.c}`;
          score += (cardModel[key] || 0) * 10;
        }

        for (const p of placed) {
          if (p.r === slot.r && Math.abs(p.c - slot.c) === 1) {
            const pairKey = cardId < p.cardId ? `${cardId},${p.cardId}` : `${p.cardId},${cardId}`;
            score += (pairMap.get(pairKey) || 0) * 5;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestCard = ci;
          bestSlot = si;
        }
      }
    }

    if (bestCard >= 0 && bestSlot >= 0) {
      const slot = availableSlots[bestSlot];
      const cardId = cards[bestCard];
      grid[slot.r][slot.c] = cardId;
      placed.push({ cardId, r: slot.r, c: slot.c });
      cards.splice(bestCard, 1);
      availableSlots.splice(bestSlot, 1);
    }
  }

  if (cards.length > 0) {
    return fallbackPlace(cards, grid, gridRows, gridCols, rowCounts);
  }

  return grid;
}

function fallbackPlace(
  remaining: number[],
  grid: (number | null)[][],
  gridRows: number,
  gridCols: number,
  rowCounts: number[]
): (number | null)[][] {
  const cards = [...remaining];
  for (let r = 0; r < gridRows && cards.length > 0; r++) {
    const existing = grid[r].filter((c) => c !== null).length;
    const maxForRow = rowCounts[r] || gridCols;
    const need = Math.min(maxForRow - existing, cards.length);
    if (need <= 0) continue;

    const leftCount = Math.ceil(need / 2);
    const rightCount = need - leftCount;

    let placed = 0;
    for (let c = 0; c < gridCols && placed < leftCount; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = cards.shift()!;
        placed++;
      }
    }
    placed = 0;
    for (let c = 0; c < gridCols && placed < rightCount; c++) {
      if (grid[r][gridCols - 1 - c] === null) {
        grid[r][gridCols - 1 - c] = cards.shift()!;
        placed++;
      }
    }
  }
  return grid;
}
