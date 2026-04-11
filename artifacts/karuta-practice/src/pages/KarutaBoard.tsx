import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  dealRandomCards,
  GRID_COLS,
  GRID_ROWS,
  placeCardsInGrid,
  splitTextIntoColumns,
} from "@/data/karuta";
import {
  recordPlacement,
  smartAutoPlace,
} from "@/data/placementMemory";

type GameState = "placing" | "memorizing" | "stopped";
type Grid = (number | null)[][];
type FieldType = "my" | "op";

const OPPONENT_ROW_LABELS = ["下段", "中段", "上段"];
const MY_ROW_LABELS = ["上段", "中段", "下段"];
const LONG_PRESS_MS = 300;

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  );
}

interface DragState {
  cardId: number;
  sourceType: "grid" | "hand";
  sourceField?: FieldType;
  sourceRow?: number;
  sourceCol?: number;
  x: number;
  y: number;
}

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("placing");
  const [elapsed, setElapsed] = useState(0);
  const [reviewElapsed, setReviewElapsed] = useState(0);
  const [reviewRunning, setReviewRunning] = useState(false);
  const [opGrid, setOpGrid] = useState<Grid>(createEmptyGrid);
  const [selfGrid, setSelfGrid] = useState<Grid>(createEmptyGrid);
  const [handCards, setHandCards] = useState<number[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [faceUpMap, setFaceUpMap] = useState<Record<number, boolean>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDrag = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const myCardCount = useRef(25);

  const initBoard = useCallback(() => {
    const { myCards, opCards } = dealRandomCards();
    myCardCount.current = myCards.length;
    setOpGrid(placeCardsInGrid(opCards));
    setSelfGrid(createEmptyGrid());
    setHandCards([...myCards]);
    setSelectedCard(null);
    setElapsed(0);
    setGameState("placing");
    setFaceUpMap({});
    setDragState(null);
    dragRef.current = null;
  }, []);

  useEffect(() => { initBoard(); }, [initBoard]);

  const placedCount = selfGrid.flat().filter((c) => c !== null).length;
  const allPlaced = placedCount === myCardCount.current;

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const findSlotAt = (x: number, y: number): { field: FieldType; row: number; col: number } | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const slot = el.closest("[data-grid-slot]");
    if (!slot) return null;
    const field = slot.getAttribute("data-field") as FieldType | null;
    const row = parseInt(slot.getAttribute("data-row") || "", 10);
    const col = parseInt(slot.getAttribute("data-col") || "", 10);
    if (!field || isNaN(row) || isNaN(col)) return null;
    return { field, row, col };
  };

  const getGridSetter = (field: FieldType) => field === "my" ? setSelfGrid : setOpGrid;

  const cleanupDragListeners = useRef<(() => void) | null>(null);

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    cardId: number,
    sourceType: "grid" | "hand",
    sourceField?: FieldType,
    sourceRow?: number,
    sourceCol?: number
  ) => {
    if (gameState !== "placing") return;
    const pos = getClientPos(e);
    pressStart.current = pos;
    didDrag.current = false;
    cancelLongPress();

    if (cleanupDragListeners.current) {
      cleanupDragListeners.current();
    }

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      didDrag.current = true;
      const ds: DragState = { cardId, sourceType, sourceField, sourceRow, sourceCol, x: pos.x, y: pos.y };
      dragRef.current = ds;
      setDragState(ds);
    }, LONG_PRESS_MS);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const p = getClientPos(ev);

      if (longPressTimer.current) {
        const dx = p.x - pos.x;
        const dy = p.y - pos.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          cancelLongPress();
          cleanup();
        }
        return;
      }

      if (dragRef.current) {
        ev.preventDefault();
        const updated = { ...dragRef.current, x: p.x, y: p.y };
        dragRef.current = updated;
        setDragState(updated);
      }
    };

    const onUp = (ev: MouseEvent | TouchEvent) => {
      cancelLongPress();
      cleanup();

      const currentDrag = dragRef.current;
      if (!currentDrag) return;

      const p = getClientPos(ev);
      const target = findSlotAt(p.x, p.y);
      if (target) {
        const { field: targetField, row, col } = target;

        if (currentDrag.sourceType === "hand") {
          if (targetField === "my") {
            setSelfGrid((prev) => {
              const existing = prev[row][col];
              const g = prev.map((r) => [...r]);
              g[row][col] = currentDrag.cardId;
              if (existing !== null && existing !== currentDrag.cardId) {
                setHandCards((h) => [...h.filter((c) => c !== currentDrag.cardId), existing]);
              } else {
                setHandCards((h) => h.filter((c) => c !== currentDrag.cardId));
              }
              return g;
            });
          }
        } else if (currentDrag.sourceField === targetField) {
          const sr = currentDrag.sourceRow!;
          const sc = currentDrag.sourceCol!;
          if (sr !== row || sc !== col) {
            const setter = getGridSetter(targetField);
            setter((prev) => {
              const g = prev.map((r) => [...r]);
              const existing = g[row][col];
              g[sr][sc] = existing;
              g[row][col] = currentDrag.cardId;
              return g;
            });
          }
        }
      }

      dragRef.current = null;
      setDragState(null);
      setSelectedCard(null);
    };

    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      cleanupDragListeners.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    cleanupDragListeners.current = cleanup;
  };

  const handleHandCardClick = (cardId: number) => {
    if (gameState !== "placing" || didDrag.current) return;
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
  };

  const handleSlotClick = (row: number, col: number) => {
    if (gameState !== "placing" || didDrag.current) return;
    const existing = selfGrid[row][col];

    if (existing !== null) {
      if (selectedCard !== null) {
        const fromHand = handCards.includes(selectedCard);
        if (fromHand) {
          setSelfGrid((prev) => {
            const g = prev.map((r) => [...r]);
            g[row][col] = selectedCard;
            return g;
          });
          setHandCards((prev) => [...prev.filter((c) => c !== selectedCard), existing]);
        } else {
          setSelfGrid((prev) => {
            const g = prev.map((r) => [...r]);
            for (let r = 0; r < GRID_ROWS; r++)
              for (let c = 0; c < GRID_COLS; c++)
                if (g[r][c] === selectedCard) g[r][c] = existing;
            g[row][col] = selectedCard;
            return g;
          });
        }
        setSelectedCard(null);
      } else {
        setSelfGrid((prev) => {
          const g = prev.map((r) => [...r]);
          g[row][col] = null;
          return g;
        });
        setHandCards((prev) => [...prev, existing]);
      }
      return;
    }

    if (selectedCard === null) return;

    const fromHand = handCards.includes(selectedCard);
    if (fromHand) {
      setSelfGrid((prev) => {
        const g = prev.map((r) => [...r]);
        g[row][col] = selectedCard;
        return g;
      });
      setHandCards((prev) => prev.filter((c) => c !== selectedCard));
    } else {
      setSelfGrid((prev) => {
        const g = prev.map((r) => [...r]);
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (g[r][c] === selectedCard) g[r][c] = null;
        g[row][col] = selectedCard;
        return g;
      });
    }
    setSelectedCard(null);
  };

  const handleGridCardClick = (cardId: number) => {
    if (didDrag.current) return;
    if (gameState === "placing") {
      setSelectedCard((prev) => (prev === cardId ? null : cardId));
      return;
    }
    if (gameState === "stopped") {
      setFaceUpMap((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const handleOpCardClick = (cardId: number) => {
    if (didDrag.current) return;
    if (gameState === "placing") {
      setSelectedCard((prev) => (prev === cardId ? null : cardId));
      return;
    }
    if (gameState === "stopped") {
      setFaceUpMap((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const handleOpSlotClick = (row: number, col: number) => {
    if (gameState !== "placing" || didDrag.current) return;
    if (selectedCard === null) return;
    const isOpCard = opGrid.flat().includes(selectedCard);
    if (!isOpCard) return;

    const existing = opGrid[row][col];
    if (existing !== null) {
      setOpGrid((prev) => {
        const g = prev.map((r) => [...r]);
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (g[r][c] === selectedCard) g[r][c] = existing;
        g[row][col] = selectedCard;
        return g;
      });
    } else {
      setOpGrid((prev) => {
        const g = prev.map((r) => [...r]);
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (g[r][c] === selectedCard) g[r][c] = null;
        g[row][col] = selectedCard;
        return g;
      });
    }
    setSelectedCard(null);
  };

  const autoPlace = async () => {
    const rowCounts = [7, 8, 10];
    const newGrid = await smartAutoPlace(
      handCards,
      selfGrid,
      GRID_ROWS,
      GRID_COLS,
      rowCounts
    );
    setSelfGrid(newGrid);
    setHandCards([]);
    setSelectedCard(null);
  };

  const startMemorizing = () => {
    if (!allPlaced) return;
    recordPlacement(selfGrid);
    setGameState("memorizing");
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopMemorizing = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setGameState("stopped");
    setReviewElapsed(0);
    setReviewRunning(true);
    reviewIntervalRef.current = setInterval(() => setReviewElapsed((p) => p + 1), 1000);
    const allDown: Record<number, boolean> = {};
    [...selfGrid.flat(), ...opGrid.flat()].forEach((id) => {
      if (id !== null) allDown[id] = false;
    });
    setFaceUpMap(allDown);
  };

  const resetBoard = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (reviewIntervalRef.current) { clearInterval(reviewIntervalRef.current); reviewIntervalRef.current = null; }
    cancelLongPress();
    if (cleanupDragListeners.current) cleanupDragListeners.current();
    dragRef.current = null;
    initBoard();
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (reviewIntervalRef.current) clearInterval(reviewIntervalRef.current);
    cancelLongPress();
    if (cleanupDragListeners.current) cleanupDragListeners.current();
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getCard = (id: number) => ALL_CARDS.find((c) => c.id === id)!;

  const isFaceUp = (cardId: number) => {
    if (gameState === "placing" || gameState === "memorizing") return true;
    return faceUpMap[cardId] ?? false;
  };

  const renderCardContent = (cardId: number) => {
    const karuta = getCard(cardId);
    const faceUp = isFaceUp(cardId);
    const cols = splitTextIntoColumns(karuta.shimoHiragana);
    return (
      <div className="card-inner">
        <div className="card-front" style={{ opacity: faceUp ? 1 : 0, pointerEvents: faceUp ? "auto" : "none" }}>
          <div className="card-text-3col">
            {cols.map((col, i) => (
              <span key={i} className="card-col">{col}</span>
            ))}
          </div>
          <span className="card-no">No.{karuta.id}</span>
        </div>
        <div className="card-back" style={{ opacity: faceUp ? 0 : 1, pointerEvents: faceUp ? "none" : "auto" }}>
          <span className="card-back-mon">百</span>
        </div>
      </div>
    );
  };

  const renderCardInSlot = (cardId: number, field: FieldType, canFlip: boolean, row: number, col: number) => {
    const isSelected = selectedCard === cardId;
    const isDragging = dragState?.cardId === cardId;
    const canDrag = gameState === "placing";
    return (
      <div
        className={`karuta-card ${isFaceUp(cardId) ? "face-up" : "face-down"} ${canFlip ? "can-flip" : ""} ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""} ${field === "op" ? "opponent-card" : ""}`}
        onClick={() => field === "my" ? handleGridCardClick(cardId) : handleOpCardClick(cardId)}
        onMouseDown={(e) => {
          if (canDrag) startDrag(e, cardId, "grid", field, row, col);
        }}
        onTouchStart={(e) => {
          if (canDrag) startDrag(e, cardId, "grid", field, row, col);
        }}
      >
        {renderCardContent(cardId)}
      </div>
    );
  };

  const renderGrid = (
    grid: Grid,
    field: FieldType,
    rowLabels: string[],
    fieldLabel: string,
    accentColor: string,
    isEditable: boolean,
    reversed: boolean = false
  ) => {
    const isDragTarget = dragState !== null && (
      (dragState.sourceType === "hand" && field === "my") ||
      (dragState.sourceType === "grid" && dragState.sourceField === field)
    );

    const rowIndices = reversed
      ? Array.from({ length: grid.length }, (_, i) => grid.length - 1 - i)
      : Array.from({ length: grid.length }, (_, i) => i);

    return (
      <div className="field-wrap">
        <div className="field-name-vertical" style={{ color: accentColor, borderColor: accentColor }}>
          {fieldLabel}
        </div>
        <div className="field-rows">
          {rowIndices.map((rIdx) => (
            <div key={rIdx} className="row-wrap">
              <div className="card-row grid-row">
                {grid[rIdx].map((cardId, cIdx) => (
                  <div
                    key={cIdx}
                    className={`card-slot ${cardId !== null ? "filled" : "empty"} ${
                      selectedCard !== null && cardId === null && (isEditable || (field === "op" && opGrid.flat().includes(selectedCard!))) ? "droppable" : ""
                    } ${isDragTarget && cardId === null ? "drag-droppable" : ""}`}
                    onClick={() => {
                      if (field === "op") {
                        handleOpSlotClick(rIdx, cIdx);
                      } else if (isEditable) {
                        handleSlotClick(rIdx, cIdx);
                      }
                    }}
                    data-grid-slot="1"
                    data-field={field}
                    data-row={rIdx}
                    data-col={cIdx}
                  >
                    {cardId !== null && renderCardInSlot(cardId, field, gameState === "stopped", rIdx, cIdx)}
                  </div>
                ))}
              </div>
              <div className="row-label-box">
                <span className="row-label">{rowLabels[rIdx]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const dragCard = dragState ? getCard(dragState.cardId) : null;
  const dragCols = dragCard ? splitTextIntoColumns(dragCard.shimoHiragana) : [];

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">競技かるた</h1>
          <span className="app-subtitle">暗記練習</span>
        </div>
        <div className="header-controls">
          {gameState === "placing" && (
            <>
              <span className="place-counter">{placedCount}/{myCardCount.current}枚配置済み</span>
              <button className="btn btn-reset" onClick={resetBoard}>リセット</button>
              {handCards.length > 0 && (
                <button className="btn btn-auto" onClick={autoPlace}>自動配置</button>
              )}
              <button
                className={`btn btn-start ${!allPlaced ? "btn-disabled" : ""}`}
                onClick={startMemorizing}
                disabled={!allPlaced}
              >
                暗記開始
              </button>
            </>
          )}
          {gameState === "memorizing" && (
            <>
              <div className="timer-display">
                <span className="timer-label">暗記中</span>
                <span className="timer-value">{formatTime(elapsed)}</span>
              </div>
              <button className="btn btn-stop" onClick={stopMemorizing}>ストップ</button>
            </>
          )}
          {gameState === "stopped" && (
            <>
              <div className="timer-display stopped">
                <span className="timer-label">暗記時間</span>
                <span className="timer-value">{formatTime(elapsed)}</span>
              </div>
              <div className="timer-display review">
                <span className="timer-label">回答時間</span>
                <span className="timer-value">{formatTime(reviewElapsed)}</span>
              </div>
              {reviewRunning && (
                <button className="btn btn-stop" onClick={() => {
                  if (reviewIntervalRef.current) { clearInterval(reviewIntervalRef.current); reviewIntervalRef.current = null; }
                  setReviewRunning(false);
                }}>ストップ</button>
              )}
              <span className="flip-hint">タップして確認</span>
              <button className="btn btn-reset" onClick={resetBoard}>リセット</button>
            </>
          )}
        </div>
      </header>

      <main className="board-main">
        <div className="board-area">
          {renderGrid(opGrid, "op", OPPONENT_ROW_LABELS, "相手陣", "#8b1a1a", false, false)}

          <div className="center-gap">
            <div className="center-line" />
            <span className="center-text">— 中陣 —</span>
            <div className="center-line" />
          </div>

          {renderGrid(selfGrid, "my", MY_ROW_LABELS, "自　陣", "#1a3a6b", gameState === "placing")}

          {gameState === "placing" && handCards.length > 0 && (
            <div className="hand-area">
              <div className="hand-label">手持ち札（タップで選択→空きマスに配置 / 長押しでドラッグ移動）</div>
              <div className="hand-cards">
                {handCards.map((cardId) => {
                  const karuta = getCard(cardId);
                  const isSelected = selectedCard === cardId;
                  const isDragging = dragState?.cardId === cardId;
                  const cols = splitTextIntoColumns(karuta.shimoHiragana);
                  return (
                    <div
                      key={cardId}
                      className={`karuta-card face-up hand-card ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
                      onClick={() => handleHandCardClick(cardId)}
                      onMouseDown={(e) => startDrag(e, cardId, "hand")}
                      onTouchStart={(e) => startDrag(e, cardId, "hand")}
                    >
                      <div className="card-inner">
                        <div className="card-front">
                          <div className="card-text-3col">
                            {cols.map((col, i) => (
                              <span key={i} className="card-col">{col}</span>
                            ))}
                          </div>
                          <span className="card-no">No.{karuta.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {gameState === "memorizing" && (
        <div className="memo-toast">札の位置を覚えてください</div>
      )}

      {dragState && dragCard && (
        <div
          className="drag-ghost"
          style={{
            left: dragState.x,
            top: dragState.y,
          }}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-text-3col">
                {dragCols.map((col, i) => (
                  <span key={i} className="card-col">{col}</span>
                ))}
              </div>
              <span className="card-no">No.{dragCard.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
