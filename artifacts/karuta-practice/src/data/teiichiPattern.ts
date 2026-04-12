export interface CardPosition {
  row: number;
  col: number;
}

export interface TeiichiPattern {
  patternId: string;
  patternName: string;
  isActive: boolean;
  cardPositions: Record<number, CardPosition>;
  thumbnail?: string;
}

const STORAGE_KEY = "karuta_teiichi_patterns";
const MAX_PATTERNS = 10;
export const TEIICHI_ROWS = 3;
export const TEIICHI_COLS = 50;
export const BLOCK_SIZE = 25;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function validatePattern(p: unknown): p is TeiichiPattern {
  if (!p || typeof p !== "object") return false;
  const obj = p as Record<string, unknown>;
  if (typeof obj.patternId !== "string" || typeof obj.patternName !== "string") return false;
  if (typeof obj.isActive !== "boolean") return false;
  if (!obj.cardPositions || typeof obj.cardPositions !== "object") return false;
  const positions = obj.cardPositions as Record<string, unknown>;
  for (const [key, val] of Object.entries(positions)) {
    const id = Number(key);
    if (isNaN(id) || id < 1 || id > 100) return false;
    if (!val || typeof val !== "object") return false;
    const pos = val as Record<string, unknown>;
    if (typeof pos.row !== "number" || typeof pos.col !== "number") return false;
    if (pos.row < 0 || pos.row >= TEIICHI_ROWS || pos.col < 0 || pos.col >= TEIICHI_COLS) return false;
  }
  return true;
}

export function loadPatterns(): TeiichiPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validatePattern);
  } catch {
    return [];
  }
}

function savePatterns(patterns: TeiichiPattern[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

export function createPattern(name: string): TeiichiPattern | null {
  const patterns = loadPatterns();
  if (patterns.length >= MAX_PATTERNS) return null;
  const newPattern: TeiichiPattern = {
    patternId: generateId(),
    patternName: name,
    isActive: patterns.length === 0,
    cardPositions: {},
  };
  patterns.push(newPattern);
  savePatterns(patterns);
  return newPattern;
}

export function deletePattern(patternId: string): void {
  let patterns = loadPatterns();
  const wasActive = patterns.find((p) => p.patternId === patternId)?.isActive;
  patterns = patterns.filter((p) => p.patternId !== patternId);
  if (wasActive && patterns.length > 0) {
    patterns[0].isActive = true;
  }
  savePatterns(patterns);
}

export function renamePattern(patternId: string, newName: string): void {
  const patterns = loadPatterns();
  const p = patterns.find((pat) => pat.patternId === patternId);
  if (p) {
    p.patternName = newName;
    savePatterns(patterns);
  }
}

export function setActivePattern(patternId: string): void {
  const patterns = loadPatterns();
  for (const p of patterns) {
    p.isActive = p.patternId === patternId;
  }
  savePatterns(patterns);
}

export function getActivePattern(): TeiichiPattern | null {
  const patterns = loadPatterns();
  return patterns.find((p) => p.isActive) || null;
}

export function generateThumbnail(
  cardPositions: Record<number, CardPosition>
): string {
  const cellW = 6;
  const cellH = 16;
  const gap = 4;
  const padding = 4;
  const totalW = BLOCK_SIZE * cellW + gap + BLOCK_SIZE * cellW + padding * 2;
  const totalH = TEIICHI_ROWS * cellH + (TEIICHI_ROWS - 1) * 2 + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f5f0e5";
  ctx.fillRect(0, 0, totalW, totalH);

  const occupied = new Set<string>();
  for (const pos of Object.values(cardPositions)) {
    occupied.add(`${pos.row},${pos.col}`);
  }

  for (let r = 0; r < TEIICHI_ROWS; r++) {
    for (let c = 0; c < TEIICHI_COLS; c++) {
      const block = c < BLOCK_SIZE ? "left" : "right";
      const localCol = block === "left" ? c : c - BLOCK_SIZE;
      const xOffset = block === "left" ? 0 : BLOCK_SIZE * cellW + gap;
      const x = padding + xOffset + localCol * cellW;
      const y = padding + r * (cellH + 2);

      if (occupied.has(`${r},${c}`)) {
        ctx.fillStyle = "#2e7d32";
        ctx.fillRect(x, y, cellW - 1, cellH - 1);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 1, y + 1, cellW - 3, cellH - 3);
        ctx.fillStyle = "#2e7d32";
        ctx.fillRect(x + 2, y + 3, cellW - 5, cellH - 7);
      } else {
        ctx.fillStyle = "#e0d8c8";
        ctx.fillRect(x, y, cellW - 1, cellH - 1);
      }
    }
  }

  return canvas.toDataURL("image/png");
}

export function updateCardPositions(
  patternId: string,
  cardPositions: Record<number, CardPosition>
): void {
  const patterns = loadPatterns();
  const p = patterns.find((pat) => pat.patternId === patternId);
  if (p) {
    p.cardPositions = cardPositions;
    p.thumbnail = generateThumbnail(cardPositions);
    savePatterns(patterns);
  }
}

export function clearAllCards(patternId: string): void {
  const patterns = loadPatterns();
  const p = patterns.find((pat) => pat.patternId === patternId);
  if (p) {
    p.cardPositions = {};
    p.thumbnail = generateThumbnail({});
    savePatterns(patterns);
  }
}

export function getBlockIndex(col: number): "left" | "right" {
  return col < BLOCK_SIZE ? "left" : "right";
}

export function getTeiichiPriority(row: number, col: number): number {
  const block = getBlockIndex(col);
  let colPriority: number;
  if (block === "left") {
    colPriority = col;
  } else {
    colPriority = TEIICHI_COLS - 1 - col;
  }
  const blockOffset = block === "left" ? 0 : 1;
  return row * 2 * BLOCK_SIZE + blockOffset * BLOCK_SIZE + colPriority;
}

export function sortCardsByTeiichiPriority(
  cardIds: number[],
  pattern: TeiichiPattern
): number[] {
  const withPriority = cardIds
    .filter((id) => pattern.cardPositions[id] !== undefined)
    .map((id) => {
      const pos = pattern.cardPositions[id];
      return { id, priority: getTeiichiPriority(pos.row, pos.col) };
    });

  withPriority.sort((a, b) => a.priority - b.priority);

  const sorted = withPriority.map((x) => x.id);
  const remaining = cardIds.filter(
    (id) => pattern.cardPositions[id] === undefined
  );
  return [...sorted, ...remaining];
}

export function autoPlaceWithTeiichi(
  cardIds: number[],
  pattern: TeiichiPattern,
  gridRows: number,
  gridCols: number,
  rowCounts: number[]
): (number | null)[][] {
  const grid: (number | null)[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => null)
  );

  const sorted = sortCardsByTeiichiPriority(cardIds, pattern);

  let idx = 0;
  for (let r = 0; r < gridRows && idx < sorted.length; r++) {
    for (let c = 0; c < rowCounts[r] && idx < sorted.length; c++) {
      grid[r][c] = sorted[idx++];
    }
  }

  return grid;
}
