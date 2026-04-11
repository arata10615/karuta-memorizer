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
  const grid = existingGrid.map((r) => [...r]);

  const alreadyPlaced = new Set<number>();
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] !== null) {
        alreadyPlaced.add(grid[r][c]!);
      }
    }
  }

  const remaining = cardIds.filter((id) => !alreadyPlaced.has(id));
  if (remaining.length === 0) return grid;

  return fallbackPlace(remaining, grid, gridRows, gridCols, rowCounts);
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
