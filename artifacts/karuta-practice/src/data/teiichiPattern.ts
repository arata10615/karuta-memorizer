export interface CardPosition {
  row: number;
  col: number;
}

export interface TeiichiPattern {
  patternId: string;
  patternName: string;
  isActive: boolean;
  cardPositions: Record<number, CardPosition>;
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

export function updateCardPositions(
  patternId: string,
  cardPositions: Record<number, CardPosition>
): void {
  const patterns = loadPatterns();
  const p = patterns.find((pat) => pat.patternId === patternId);
  if (p) {
    p.cardPositions = cardPositions;
    savePatterns(patterns);
  }
}

export function clearAllCards(patternId: string): void {
  const patterns = loadPatterns();
  const p = patterns.find((pat) => pat.patternId === patternId);
  if (p) {
    p.cardPositions = {};
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

  const leftCards: { id: number; row: number; col: number }[] = [];
  const rightCards: { id: number; row: number; col: number }[] = [];
  const unpositioned: number[] = [];

  for (const id of cardIds) {
    const pos = pattern.cardPositions[id];
    if (pos !== undefined) {
      if (getBlockIndex(pos.col) === "left") {
        leftCards.push({ id, row: pos.row, col: pos.col });
      } else {
        rightCards.push({ id, row: pos.row, col: TEIICHI_COLS - 1 - pos.col });
      }
    } else {
      unpositioned.push(id);
    }
  }

  leftCards.sort((a, b) => a.row * BLOCK_SIZE + a.col - (b.row * BLOCK_SIZE + b.col));
  rightCards.sort((a, b) => a.row * BLOCK_SIZE + a.col - (b.row * BLOCK_SIZE + b.col));

  let li = 0;
  let ri = 0;

  const leftSlots: { r: number; c: number }[] = [];
  const rightSlots: { r: number; c: number }[] = [];

  for (let r = 0; r < gridRows; r++) {
    const count = rowCounts[r];
    const lc = Math.ceil(count / 2);
    const rc = count - lc;
    for (let c = 0; c < lc; c++) leftSlots.push({ r, c });
    for (let c = 0; c < rc; c++) rightSlots.push({ r, c: gridCols - 1 - c });
  }

  let lsi = 0;
  let rsi = 0;

  for (; li < leftCards.length && lsi < leftSlots.length; li++, lsi++) {
    const s = leftSlots[lsi];
    grid[s.r][s.c] = leftCards[li].id;
  }
  for (; ri < rightCards.length && rsi < rightSlots.length; ri++, rsi++) {
    const s = rightSlots[rsi];
    grid[s.r][s.c] = rightCards[ri].id;
  }

  const overflow: number[] = [];
  for (; li < leftCards.length; li++) overflow.push(leftCards[li].id);
  for (; ri < rightCards.length; ri++) overflow.push(rightCards[ri].id);
  overflow.push(...unpositioned);

  let oi = 0;
  for (; lsi < leftSlots.length && oi < overflow.length; lsi++, oi++) {
    const s = leftSlots[lsi];
    grid[s.r][s.c] = overflow[oi];
  }
  for (; rsi < rightSlots.length && oi < overflow.length; rsi++, oi++) {
    const s = rightSlots[rsi];
    grid[s.r][s.c] = overflow[oi];
  }

  return grid;
}
