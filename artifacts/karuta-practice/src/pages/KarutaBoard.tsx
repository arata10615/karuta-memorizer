import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  MY_CARD_IDS,
  OPPONENT_CARD_IDS,
  OPPONENT_ROW_SIZES,
  SELF_COLS,
  SELF_ROWS,
  shuffleArray,
  splitIntoRows,
} from "@/data/karuta";

type GameState = "placing" | "memorizing" | "stopped";

interface BoardCard {
  cardId: number;
  faceUp: boolean;
}

type SelfGrid = (number | null)[][];

const OPPONENT_ROW_LABELS = ["下段", "中段", "上段"];
const MY_ROW_LABELS = ["上段", "中段", "下段"];

function createEmptyGrid(): SelfGrid {
  return Array.from({ length: SELF_ROWS }, () =>
    Array.from({ length: SELF_COLS }, () => null)
  );
}

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("placing");
  const [elapsed, setElapsed] = useState(0);
  const [opponentRows, setOpponentRows] = useState<BoardCard[][]>([]);
  const [selfGrid, setSelfGrid] = useState<SelfGrid>(createEmptyGrid);
  const [handCards, setHandCards] = useState<number[]>([...MY_CARD_IDS]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selfFaceUp, setSelfFaceUp] = useState<Record<number, boolean>>({});
  const [opFaceUp, setOpFaceUp] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    const opShuffled = shuffleArray([...OPPONENT_CARD_IDS]);
    const opRowsData = splitIntoRows(opShuffled, OPPONENT_ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );
    setOpponentRows(opRowsData);
    setSelfGrid(createEmptyGrid());
    setHandCards([...MY_CARD_IDS]);
    setSelectedCard(null);
    setElapsed(0);
    setGameState("placing");
    setSelfFaceUp({});
    setOpFaceUp({});
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
          setSelectedCard(null);
        } else {
          setSelfGrid((prev) => {
            const g = prev.map((r) => [...r]);
            for (let r = 0; r < SELF_ROWS; r++)
              for (let c = 0; c < SELF_COLS; c++)
                if (g[r][c] === selectedCard) g[r][c] = existing;
            g[row][col] = selectedCard;
            return g;
          });
          setSelectedCard(null);
        }
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
        for (let r = 0; r < SELF_ROWS; r++)
          for (let c = 0; c < SELF_COLS; c++)
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
      setSelfFaceUp((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const handleOpCardClick = (cardId: number) => {
    if (gameState === "stopped") {
      setOpFaceUp((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    }
  };

  const autoPlace = () => {
    const remaining = [...handCards];
    const g = selfGrid.map((r) => [...r]);
    for (let r = 0; r < SELF_ROWS && remaining.length > 0; r++) {
      for (let c = 0; c < SELF_COLS && remaining.length > 0; c++) {
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
    selfGrid.flat().forEach((id) => { if (id !== null) allDown[id] = false; });
    setSelfFaceUp(allDown);
    const opDown: Record<number, boolean> = {};
    opponentRows.flat().forEach((c) => { opDown[c.cardId] = false; });
    setOpFaceUp(opDown);
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

  const isFaceUp = (cardId: number, field: "my" | "op") => {
    if (gameState === "placing" || gameState === "memorizing") return true;
    if (field === "my") return selfFaceUp[cardId] ?? false;
    return opFaceUp[cardId] ?? false;
  };

  const renderCardContent = (cardId: number, field: "my" | "op", canFlip: boolean) => {
    const karuta = getCard(cardId);
    const faceUp = isFaceUp(cardId, field);
    const isSelected = selectedCard === cardId;
    return (
      <div
        className={`karuta-card ${faceUp ? "face-up" : "face-down"} ${canFlip ? "can-flip" : ""} ${isSelected ? "selected" : ""}`}
        onClick={() => field === "my" ? handleGridCardClick(cardId) : handleOpCardClick(cardId)}
      >
        <div className="card-inner">
          <div className="card-front">
            <span className="card-text">{karuta.shimoHiragana}</span>
            <span className="card-no">No.{karuta.id}</span>
          </div>
          <div className="card-back">
            <span className="card-back-mon">百</span>
          </div>
        </div>
      </div>
    );
  };

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
          {/* 敵陣 — random 25 cards */}
          <div className="field-wrap">
            <div className="field-name-vertical" style={{ color: "#8b1a1a", borderColor: "#8b1a1a" }}>
              相手陣
            </div>
            <div className="field-rows">
              {opponentRows.map((row, rIdx) => (
                <div key={rIdx} className="row-wrap">
                  <div className="card-row">
                    {row.map((card) => (
                      <div key={card.cardId} className="card-slot filled">
                        {renderCardContent(card.cardId, "op", gameState === "stopped")}
                      </div>
                    ))}
                  </div>
                  <div className="row-label-box">
                    <span className="row-label">{OPPONENT_ROW_LABELS[rIdx]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="center-gap">
            <div className="center-line" />
            <span className="center-text">— 中陣 —</span>
            <div className="center-line" />
          </div>

          {/* 自陣 — 3×16 grid, user places cards */}
          <div className="field-wrap">
            <div className="field-name-vertical" style={{ color: "#1a3a6b", borderColor: "#1a3a6b" }}>
              自　陣
            </div>
            <div className="field-rows">
              {selfGrid.map((row, rIdx) => (
                <div key={rIdx} className="row-wrap">
                  <div className="card-row grid-row">
                    {row.map((cardId, cIdx) => (
                      <div
                        key={cIdx}
                        className={`card-slot ${cardId !== null ? "filled" : "empty"} ${
                          selectedCard !== null && cardId === null && gameState === "placing" ? "droppable" : ""
                        }`}
                        onClick={() => cardId === null ? handleSlotClick(rIdx, cIdx) : undefined}
                      >
                        {cardId !== null && renderCardContent(cardId, "my", gameState === "stopped")}
                      </div>
                    ))}
                  </div>
                  <div className="row-label-box">
                    <span className="row-label">{MY_ROW_LABELS[rIdx]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 手持ちカード */}
          {gameState === "placing" && handCards.length > 0 && (
            <div className="hand-area">
              <div className="hand-label">手持ち札（タップで選択→空きマスに配置）</div>
              <div className="hand-cards">
                {handCards.map((cardId) => {
                  const karuta = getCard(cardId);
                  const isSelected = selectedCard === cardId;
                  return (
                    <div
                      key={cardId}
                      className={`karuta-card face-up hand-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleHandCardClick(cardId)}
                    >
                      <div className="card-inner">
                        <div className="card-front">
                          <span className="card-text">{karuta.shimoHiragana}</span>
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
