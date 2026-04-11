const API_BASE = "/api";

let cachedModel: Record<number, Record<string, number>> | null = null;

export async function recordPlacement(grid: (number | null)[][]) {
  try {
    await fetch(`${API_BASE}/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid }),
    });
    cachedModel = null;
  } catch (err) {
    console.error("Failed to record placement:", err);
  }
}

async function fetchModel(): Promise<Record<number, Record<string, number>>> {
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch(`${API_BASE}/placements/model`);
    const data = await res.json();
    const model: Record<number, Record<string, number>> = data.model || {};
    cachedModel = model;
    return model;
  } catch (err) {
    console.error("Failed to fetch placement model:", err);
    return {};
  }
}

export async function smartAutoPlace(
  cardIds: number[],
  existingGrid: (number | null)[][],
  gridRows: number,
  gridCols: number,
  rowCounts: number[]
): Promise<(number | null)[][]> {
  const model = await fetchModel();
  const grid = existingGrid.map((r) => [...r]);

  const alreadyPlaced = new Set<number>();
  const occupiedSlots = new Set<string>();
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] !== null) {
        alreadyPlaced.add(grid[r][c]!);
        occupiedSlots.add(`${r},${c}`);
      }
    }
  }

  const remaining = cardIds.filter((id) => !alreadyPlaced.has(id));
  if (remaining.length === 0) return grid;

  const hasData = Object.keys(model).length > 0;

  if (!hasData) {
    return fallbackPlace(remaining, grid, gridRows, gridCols, rowCounts);
  }

  type Assignment = { cardId: number; r: number; c: number; score: number };
  const candidates: Assignment[] = [];

  const availableSlots: { r: number; c: number }[] = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] === null) {
        availableSlots.push({ r, c });
      }
    }
  }

  for (const cardId of remaining) {
    const prefs = model[cardId];
    if (!prefs) {
      for (const slot of availableSlots) {
        candidates.push({ cardId, r: slot.r, c: slot.c, score: 0 });
      }
      continue;
    }

    const totalForCard = Object.values(prefs).reduce((a, b) => a + b, 0);

    for (const slot of availableSlots) {
      const key = `${slot.r},${slot.c}`;
      const freq = prefs[key] || 0;
      const rowFreq = Object.entries(prefs)
        .filter(([k]) => k.startsWith(`${slot.r},`))
        .reduce((sum, [, v]) => sum + v, 0);

      const colDist = Object.entries(prefs).reduce((best, [k, v]) => {
        const [, pc] = k.split(",").map(Number);
        const dist = Math.abs(pc - slot.c);
        const weight = v / totalForCard;
        return Math.min(best, dist * (1 - weight));
      }, gridCols);
      const proximityScore = 1 - colDist / gridCols;

      const exactScore = totalForCard > 0 ? freq / totalForCard : 0;
      const rowScore = totalForCard > 0 ? rowFreq / totalForCard : 0;

      const score = exactScore * 5 + rowScore * 2 + proximityScore * 1;
      candidates.push({ cardId, r: slot.r, c: slot.c, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const assignedCards = new Set<number>();
  const assignedSlots = new Set<string>();

  for (const cand of candidates) {
    if (assignedCards.has(cand.cardId)) continue;
    const slotKey = `${cand.r},${cand.c}`;
    if (assignedSlots.has(slotKey)) continue;

    const rowCount = grid[cand.r].filter((c) => c !== null).length +
      [...assignedSlots].filter((s) => s.startsWith(`${cand.r},`)).length;
    if (rowCount >= (rowCounts[cand.r] || gridCols)) continue;

    grid[cand.r][cand.c] = cand.cardId;
    assignedCards.add(cand.cardId);
    assignedSlots.add(slotKey);
  }

  const stillRemaining = remaining.filter((id) => !assignedCards.has(id));
  if (stillRemaining.length > 0) {
    return fallbackPlace(stillRemaining, grid, gridRows, gridCols, rowCounts);
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
