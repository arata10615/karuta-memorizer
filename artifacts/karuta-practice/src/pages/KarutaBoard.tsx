import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  MY_CARD_IDS,
  OPPONENT_CARD_IDS,
  ROW_SIZES,
  shuffleArray,
  splitIntoRows,
} from "@/data/karuta";

type GameState = "setup" | "memorizing" | "stopped";

interface BoardCard {
  cardId: number;
  faceUp: boolean;
}

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [myRows, setMyRows] = useState<BoardCard[][]>([]);
  const [opponentRows, setOpponentRows] = useState<BoardCard[][]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    const myShuffled = [...MY_CARD_IDS];
    const myRowsData = splitIntoRows(myShuffled, ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );

    const opShuffled = shuffleArray([...OPPONENT_CARD_IDS]);
    const opRowsData = splitIntoRows(opShuffled, ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );

    setMyRows(myRowsData);
    setOpponentRows(opRowsData);
    setElapsed(0);
    setGameState("setup");
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

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
    setMyRows((prev) =>
      prev.map((row) => row.map((c) => ({ ...c, faceUp: false })))
    );
    setOpponentRows((prev) =>
      prev.map((row) => row.map((c) => ({ ...c, faceUp: false })))
    );
  };

  const toggleMyCard = (rowIdx: number, colIdx: number) => {
    if (gameState !== "stopped") return;
    setMyRows((prev) =>
      prev.map((row, r) =>
        row.map((c, ci) =>
          r === rowIdx && ci === colIdx ? { ...c, faceUp: !c.faceUp } : c
        )
      )
    );
  };

  const toggleOpponentCard = (rowIdx: number, colIdx: number) => {
    if (gameState !== "stopped") return;
    setOpponentRows((prev) =>
      prev.map((row, r) =>
        row.map((c, ci) =>
          r === rowIdx && ci === colIdx ? { ...c, faceUp: !c.faceUp } : c
        )
      )
    );
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

  const getCard = (id: number) => ALL_CARDS.find((c) => c.id === id)!;

  const renderField = (
    rows: BoardCard[][],
    field: "my" | "opponent",
    onToggle: (r: number, c: number) => void,
    label: string,
    accent: string
  ) => (
    <div className="field-section">
      <div className="field-label-row">
        <span className="field-label" style={{ borderColor: accent, color: accent }}>
          {label}
        </span>
        <span className="field-subtitle">
          {rows.reduce((sum, r) => sum + r.length, 0)}枚
        </span>
      </div>
      <div className="field-rows" data-testid={`grid-${field}`}>
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="card-row">
            {row.map((card, cIdx) => {
              const karuta = getCard(card.cardId);
              const canClick = gameState === "stopped";
              return (
                <div
                  key={card.cardId}
                  className={`karuta-card ${card.faceUp ? "face-up" : "face-down"} ${canClick ? "can-flip" : ""}`}
                  onClick={() => canClick && onToggle(rIdx, cIdx)}
                  data-testid={`card-${field}-${card.cardId}`}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <div className="card-front-content">
                        <span className="card-text">{karuta.shimoHiragana}</span>
                      </div>
                      <span className="card-id">No.{karuta.id}</span>
                    </div>
                    <div className="card-back">
                      <span className="card-back-kanji">百</span>
                      <span className="card-back-sub">人一首</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <div className="timer-display" data-testid="timer-display">
                <span className="timer-label">暗記中</span>
                <span className="timer-value">{formatTime(elapsed)}</span>
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
              <div className="timer-display stopped" data-testid="timer-final">
                <span className="timer-label">暗記時間</span>
                <span className="timer-value">{formatTime(elapsed)}</span>
              </div>
              <span className="flip-hint" data-testid="hint-flip">
                タップして確認
              </span>
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

      <main className="board-main">
        <div className="board-area">
          {renderField(
            opponentRows,
            "opponent",
            toggleOpponentCard,
            "相手陣地",
            "#8b1a1a"
          )}
          <div className="center-divider">
            <div className="divider-line" />
            <span className="divider-label">中　陣</span>
            <div className="divider-line" />
          </div>
          {renderField(
            myRows,
            "my",
            toggleMyCard,
            "自陣",
            "#1a3a6b"
          )}
        </div>
      </main>

      {gameState === "memorizing" && (
        <div className="memo-overlay" data-testid="banner-memorizing">
          札の位置を覚えてください
        </div>
      )}
    </div>
  );
}
