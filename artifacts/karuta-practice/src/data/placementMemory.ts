const STORAGE_KEY = "karuta_placement_memory";

interface PositionFrequency {
  [posKey: string]: number;
}

interface PlacementData {
  cardPositions: { [cardId: number]: PositionFrequency };
  totalSessions: number;
}

function loadData(): PlacementData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { cardPositions: {}, totalSessions: 0 };
}

function saveData(data: PlacementData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function recordPlacement(grid: (number | null)[][]) {
  const data = loadData();
  data.totalSessions++;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cardId = grid[r][c];
      if (cardId === null) continue;
      const key = `${r},${c}`;
      if (!data.cardPositions[cardId]) {
        data.cardPositions[cardId] = {};
      }
      data.cardPositions[cardId][key] = (data.cardPositions[cardId][key] || 0) + 1;
    }
  }

  saveData(data);
}

export function getSessionCount(): number {
  return loadData().totalSessions;
}

export function smartAutoPlace(
  cardIds: number[],
  existingGrid: (number | null)[][],
  gridRows: number,
  gridCols: number,
  rowCounts: number[]
): (number | null)[][] {
  const data = loadData();
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

  const availableSlots: { r: number; c: number }[] = [];
  for (let r = 0; r < gridRows; r++) {
    const currentRowCount = grid[r].filter((c) => c !== null).length;
    const maxForRow = rowCounts[r] || gridCols;
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] === null && currentRowCount < maxForRow && !occupiedSlots.has(`${r},${c}`)) {
        availableSlots.push({ r, c });
      }
    }
  }

  const hasHistory = data.totalSessions > 0;

  if (!hasHistory) {
    return fallbackPlace(remaining, grid, gridRows, gridCols, rowCounts);
  }

  type Assignment = { cardId: number; r: number; c: number; score: number };
  const candidates: Assignment[] = [];

  for (const cardId of remaining) {
    const prefs = data.cardPositions[cardId];
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

      const exactScore = totalForCard > 0 ? freq / totalForCard : 0;
      const rowScore = totalForCard > 0 ? rowFreq / totalForCard : 0;

      const colDist = Object.entries(prefs).reduce((best, [k, v]) => {
        const [, pc] = k.split(",").map(Number);
        const dist = Math.abs(pc - slot.c);
        const weight = v / totalForCard;
        return Math.min(best, dist * (1 - weight));
      }, gridCols);
      const proximityScore = 1 - colDist / gridCols;

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
    for (let r = 0; r < gridRows && stillRemaining.length > 0; r++) {
      for (let c = 0; c < gridCols && stillRemaining.length > 0; c++) {
        if (grid[r][c] === null) {
          grid[r][c] = stillRemaining.shift()!;
        }
      }
    }
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
  for (let r = gridRows - 1; r >= 0 && cards.length > 0; r--) {
    let placed = grid[r].filter((c) => c !== null).length;
    for (let c = 0; c < gridCols && cards.length > 0 && placed < rowCounts[r]; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = cards.shift()!;
        placed++;
      }
    }
  }
  for (let r = 0; r < gridRows && cards.length > 0; r++) {
    for (let c = 0; c < gridCols && cards.length > 0; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = cards.shift()!;
      }
    }
  }
  return grid;
}

export function clearMemory() {
  localStorage.removeItem(STORAGE_KEY);
}
