import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_CARDS,
  MY_CARD_IDS,
  ROW_SIZES,
  splitIntoRows,
} from "@/data/karuta";

type GameState = "setup" | "memorizing" | "stopped";

interface BoardCard {
  cardId: number;
  faceUp: boolean;
}

const MY_ROW_LABELS = ["上段", "中段", "下段"];

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [myRows, setMyRows] = useState<BoardCard[][]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    const myRowsData = splitIntoRows([...MY_CARD_IDS], ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );
    setMyRows(myRowsData);
    setElapsed(0);
    setGameState("setup");
  }, []);

  useEffect(() => { initBoard(); }, [initBoard]);

  const startMemorizing = () => {
    setGameState("memorizing");
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopMemorizing = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setGameState("stopped");
    setMyRows((prev) => prev.map((row) => row.map((c) => ({ ...c, faceUp: false }))));
  };

  const toggleMyCard = (r: number, ci: number) => {
    if (gameState !== "stopped") return;
    setMyRows((prev) =>
      prev.map((row, ri) =>
        row.map((c, i) => (ri === r && i === ci ? { ...c, faceUp: !c.faceUp } : c))
      )
    );
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

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">競技かるた</h1>
          <span className="app-subtitle">暗記練習　自陣</span>
        </div>
        <div className="header-controls">
          {gameState === "setup" && (
            <button className="btn btn-start" onClick={startMemorizing} data-testid="button-start">
              暗記開始
            </button>
          )}
          {gameState === "memorizing" && (
            <>
              <div className="timer-display" data-testid="timer-display">
                <span className="timer-label">暗記中</span>
                <span className="timer-value">{formatTime(elapsed)}</span>
              </div>
              <button className="btn btn-stop" onClick={stopMemorizing} data-testid="button-stop">
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
              <span className="flip-hint" data-testid="hint-flip">タップして確認</span>
              <button className="btn btn-reset" onClick={reset} data-testid="button-reset">
                リセット
              </button>
            </>
          )}
        </div>
      </header>

      <main className="board-main">
        <div className="board-area" data-testid="grid-my">
          <div className="field-wrap">
            <div className="field-name-vertical" style={{ color: "#1a3a6b", borderColor: "#1a3a6b" }}>
              自　陣
            </div>
            <div className="field-rows">
              {myRows.map((row, rIdx) => (
                <div key={rIdx} className="row-wrap">
                  <div className="card-row">
                    {row.map((card, cIdx) => {
                      const karuta = getCard(card.cardId);
                      const canFlip = gameState === "stopped";
                      return (
                        <div
                          key={card.cardId}
                          className={`karuta-card ${card.faceUp ? "face-up" : "face-down"} ${canFlip ? "can-flip" : ""}`}
                          onClick={() => canFlip && toggleMyCard(rIdx, cIdx)}
                          data-testid={`card-my-${card.cardId}`}
                          title={card.faceUp ? karuta.shimoHiragana : "タップで確認"}
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
                    })}
                  </div>
                  <div className="row-label-box">
                    <span className="row-label">{MY_ROW_LABELS[rIdx]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {gameState === "memorizing" && (
        <div className="memo-toast" data-testid="banner-memorizing">
          札の位置を覚えてください
        </div>
      )}
    </div>
  );
}
