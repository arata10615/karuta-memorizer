import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  MY_CARD_IDS,
  OPPONENT_CARD_IDS,
  GRID_COLS,
  GRID_ROWS,
  placeCardsInGrid,
  splitTextIntoColumns,
} from "@/data/karuta";

type GameState = "placing" | "memorizing" | "stopped";
type Grid = (number | null)[][];

const OPPONENT_ROW_LABELS = ["下段", "中段", "上段"];
const MY_ROW_LABELS = ["上段", "中段", "下段"];

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null)
  );
}

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("placing");
  const [elapsed, setElapsed] = useState(0);
  const [opGrid, setOpGrid] = useState<Grid>(createEmptyGrid);
  const [selfGrid, setSelfGrid] = useState<Grid>(createEmptyGrid);
  const [handCards, setHandCards] = useState<number[]>([...MY_CARD_IDS]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [faceUpMap, setFaceUpMap] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    setOpGrid(placeCardsInGrid(OPPONENT_CARD_IDS));
    setSelfGrid(createEmptyGrid());
    setHandCards([...MY_CARD_IDS]);
    setSelectedCard(null);
    setElapsed(0);
    setGameState("placing");
    setFaceUpMap({});
  }, []);

  useEffect(() => { initBoard(); }, [initBoard]);

  const placedCount = selfGrid.flat().filter((c) => c !== null).length;
  const allPlaced = placedCount === MY_CARD_IDS.length;

  const handleHandCardClick = (cardId: number) => {
    if (gameState !== "placing") return;
    setSelectedCard((prev) => (prev === cardId ? null : cardId));
  };

  const handleSlotClick = (row: number, col: number) => {
    if (gameState !== "placing") return;
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
    if (gameState === "placing") {
      setSelectedCard((prev) => (prev === cardId ? null : cardId));
      return;
    }
    if (gameState === "stopped") {
      setFaceUpMap((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const handleOpCardClick = (cardId: number) => {
    if (gameState === "stopped") {
      setFaceUpMap((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const autoPlace = () => {
    const remaining = [...handCards];
    const g = selfGrid.map((r) => [...r]);
    const rowCounts = [10, 8, 7];
    for (let r = GRID_ROWS - 1; r >= 0 && remaining.length > 0; r--) {
      let placed = g[r].filter((c) => c !== null).length;
      for (let c = 0; c < GRID_COLS && remaining.length > 0 && placed < rowCounts[r]; c++) {
        if (g[r][c] === null) {
          g[r][c] = remaining.shift()!;
          placed++;
        }
      }
    }
    for (let r = 0; r < GRID_ROWS && remaining.length > 0; r++) {
      for (let c = 0; c < GRID_COLS && remaining.length > 0; c++) {
        if (g[r][c] === null) {
          g[r][c] = remaining.shift()!;
        }
      }
    }
    setSelfGrid(g);
    setHandCards(remaining);
    setSelectedCard(null);
  };

  const startMemorizing = () => {
    if (!allPlaced) return;
    setGameState("memorizing");
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopMemorizing = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setGameState("stopped");
    const allDown: Record<number, boolean> = {};
    [...selfGrid.flat(), ...opGrid.flat()].forEach((id) => {
      if (id !== null) allDown[id] = false;
    });
    setFaceUpMap(allDown);
  };

  const reset = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    initBoard();
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

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

  const renderCardInSlot = (cardId: number, field: "my" | "op", canFlip: boolean) => {
    const karuta = getCard(cardId);
    const faceUp = isFaceUp(cardId);
    const isSelected = selectedCard === cardId;
    const cols = splitTextIntoColumns(karuta.shimoHiragana);
    return (
      <div
        className={`karuta-card ${faceUp ? "face-up" : "face-down"} ${canFlip ? "can-flip" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => field === "my" ? handleGridCardClick(cardId) : handleOpCardClick(cardId)}
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
          <div className="card-back">
            <span className="card-back-mon">百</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGrid = (
    grid: Grid,
    field: "my" | "op",
    rowLabels: string[],
    fieldLabel: string,
    accentColor: string,
    isEditable: boolean
  ) => (
    <div className="field-wrap">
      <div className="field-name-vertical" style={{ color: accentColor, borderColor: accentColor }}>
        {fieldLabel}
      </div>
      <div className="field-rows">
        {grid.map((row, rIdx) => (
          <div key={rIdx} className="row-wrap">
            <div className="card-row grid-row">
              {row.map((cardId, cIdx) => (
                <div
                  key={cIdx}
                  className={`card-slot ${cardId !== null ? "filled" : "empty"} ${
                    selectedCard !== null && cardId === null && isEditable ? "droppable" : ""
                  }`}
                  onClick={() => isEditable && cardId === null ? handleSlotClick(rIdx, cIdx) : undefined}
                >
                  {cardId !== null && renderCardInSlot(cardId, field, gameState === "stopped")}
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
              <span className="place-counter">{placedCount}/{MY_CARD_IDS.length}枚配置済み</span>
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
              <span className="flip-hint">タップして確認</span>
              <button className="btn btn-reset" onClick={reset}>リセット</button>
            </>
          )}
        </div>
      </header>

      <main className="board-main">
        <div className="board-area">
          {renderGrid(opGrid, "op", OPPONENT_ROW_LABELS, "相手陣", "#8b1a1a", false)}

          <div className="center-gap">
            <div className="center-line" />
            <span className="center-text">— 中陣 —</span>
            <div className="center-line" />
          </div>

          {renderGrid(selfGrid, "my", MY_ROW_LABELS, "自　陣", "#1a3a6b", gameState === "placing")}

          {gameState === "placing" && handCards.length > 0 && (
            <div className="hand-area">
              <div className="hand-label">手持ち札（タップで選択→空きマスに配置）</div>
              <div className="hand-cards">
                {handCards.map((cardId) => {
                  const karuta = getCard(cardId);
                  const isSelected = selectedCard === cardId;
                  const cols = splitTextIntoColumns(karuta.shimoHiragana);
                  return (
                    <div
                      key={cardId}
                      className={`karuta-card face-up hand-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleHandCardClick(cardId)}
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
    </div>
  );
}
