import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  MY_FIELD_POSITIONS,
  OPPONENT_CARD_IDS,
  shuffleArray,
  type CardPlacement,
} from "@/data/karuta";

type GameState = "setup" | "memorizing" | "stopped";

interface PlacedCard {
  cardId: number;
  row: number;
  col: number;
  faceUp: boolean;
}

const COLS = 5;
const ROWS = 5;

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [myCards, setMyCards] = useState<PlacedCard[]>([]);
  const [opponentCards, setOpponentCards] = useState<PlacedCard[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    const myPlaced: PlacedCard[] = MY_FIELD_POSITIONS.map((p) => ({
      cardId: p.cardId,
      row: p.row,
      col: p.col,
      faceUp: true,
    }));

    const opponentPositions = shufflePositions(ROWS, COLS);
    const shuffledOpponent = shuffleArray(OPPONENT_CARD_IDS);
    const opPlaced: PlacedCard[] = shuffledOpponent.map((cardId, i) => ({
      cardId,
      row: opponentPositions[i].row,
      col: opponentPositions[i].col,
      faceUp: true,
    }));

    setMyCards(myPlaced);
    setOpponentCards(opPlaced);
    setElapsed(0);
    setGameState("setup");
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  function shufflePositions(rows: number, cols: number): { row: number; col: number }[] {
    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({ row: r, col: c });
      }
    }
    return shuffleArray(positions).slice(0, 25);
  }

  const startMemorizing = () => {
    setGameState("memorizing");
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopMemorizing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setGameState("stopped");
    setMyCards((prev) => prev.map((c) => ({ ...c, faceUp: false })));
    setOpponentCards((prev) => prev.map((c) => ({ ...c, faceUp: false })));
  };

  const toggleCard = (field: "my" | "opponent", cardId: number) => {
    if (gameState !== "stopped") return;
    if (field === "my") {
      setMyCards((prev) =>
        prev.map((c) => (c.cardId === cardId ? { ...c, faceUp: !c.faceUp } : c))
      );
    } else {
      setOpponentCards((prev) =>
        prev.map((c) => (c.cardId === cardId ? { ...c, faceUp: !c.faceUp } : c))
      );
    }
  };

  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    initBoard();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getCard = (cardId: number) => ALL_CARDS.find((c) => c.id === cardId)!;

  const renderGrid = (
    cards: PlacedCard[],
    field: "my" | "opponent",
    label: string,
    labelColor: string
  ) => {
    const grid: (PlacedCard | null)[][] = Array.from({ length: ROWS }, () =>
      Array(COLS).fill(null)
    );
    cards.forEach((c) => {
      if (c.row < ROWS && c.col < COLS) {
        grid[c.row][c.col] = c;
      }
    });

    return (
      <div className="field-section">
        <div
          className="field-label"
          style={{ color: labelColor, borderColor: labelColor }}
          data-testid={`label-${field}`}
        >
          {label}
        </div>
        <div className="karuta-grid" data-testid={`grid-${field}`}>
          {grid.map((row, rIdx) =>
            row.map((card, cIdx) => {
              if (!card) {
                return (
                  <div
                    key={`empty-${rIdx}-${cIdx}`}
                    className="card-slot empty-slot"
                  />
                );
              }
              const karutaCard = getCard(card.cardId);
              return (
                <div
                  key={card.cardId}
                  className={`card-slot karuta-card ${card.faceUp ? "face-up" : "face-down"} ${gameState === "stopped" ? "clickable" : ""}`}
                  onClick={() => toggleCard(field, card.cardId)}
                  data-testid={`card-${field}-${card.cardId}`}
                  title={card.faceUp ? karutaCard.shimoNoKu : "裏向き"}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <span className="card-text">{karutaCard.shimoNoKu}</span>
                      <span className="card-number">No.{karutaCard.id}</span>
                    </div>
                    <div className="card-back">
                      <span className="card-back-pattern">百</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">競技かるた 暗記練習</h1>
        <div className="controls">
          {gameState === "setup" && (
            <button
              className="btn btn-start"
              onClick={startMemorizing}
              data-testid="button-start"
            >
              暗記開始
            </button>
          )}
          {gameState === "memorizing" && (
            <>
              <div className="timer" data-testid="timer-display">
                {formatTime(elapsed)}
              </div>
              <button
                className="btn btn-stop"
                onClick={stopMemorizing}
                data-testid="button-stop"
              >
                ストップ
              </button>
            </>
          )}
          {gameState === "stopped" && (
            <>
              <div className="timer stopped" data-testid="timer-final">
                {formatTime(elapsed)}
              </div>
              <div className="hint-text" data-testid="hint-flip">
                札をタップして確認できます
              </div>
              <button
                className="btn btn-reset"
                onClick={reset}
                data-testid="button-reset"
              >
                リセット
              </button>
            </>
          )}
        </div>
      </header>

      <main className="board-container">
        <div className="board-wrapper">
          {renderGrid(opponentCards, "opponent", "相手陣地", "#c0392b")}
          <div className="field-divider">
            <span className="divider-text">── 中陣 ──</span>
          </div>
          {renderGrid(myCards, "my", "自陣", "#1a5276")}
        </div>
      </main>

      {gameState === "memorizing" && (
        <div className="memo-banner" data-testid="banner-memorizing">
          暗記中... 札の位置を覚えてください
        </div>
      )}
    </div>
  );
}
