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

const OPPONENT_ROW_LABELS = ["下段", "中段", "上段"];
const MY_ROW_LABELS = ["上段", "中段", "下段"];

export default function KarutaBoard() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [myRows, setMyRows] = useState<BoardCard[][]>([]);
  const [opponentRows, setOpponentRows] = useState<BoardCard[][]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initBoard = useCallback(() => {
    const myRowsData = splitIntoRows([...MY_CARD_IDS], ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );
    const opRowsData = splitIntoRows(shuffleArray([...OPPONENT_CARD_IDS]), ROW_SIZES).map((row) =>
      row.map((id) => ({ cardId: id, faceUp: true }))
    );
    setMyRows(myRowsData);
    setOpponentRows(opRowsData);
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
    setOpponentRows((prev) => prev.map((row) => row.map((c) => ({ ...c, faceUp: false }))));
  };

  const toggleMyCard = (r: number, ci: number) => {
    if (gameState !== "stopped") return;
    setMyRows((prev) => prev.map((row, ri) => row.map((c, i) => ri === r && i === ci ? { ...c, faceUp: !c.faceUp } : c)));
  };

  const toggleOpCard = (r: number, ci: number) => {
    if (gameState !== "stopped") return;
    setOpponentRows((prev) => prev.map((row, ri) => row.map((c, i) => ri === r && i === ci ? { ...c, faceUp: !c.faceUp } : c)));
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

  const renderCard = (
    card: BoardCard,
    field: string,
    rowIdx: number,
    colIdx: number,
    onToggle: (r: number, c: number) => void
  ) => {
    const karuta = getCard(card.cardId);
    const canFlip = gameState === "stopped";
    return (
      <div
        key={card.cardId}
        className={`karuta-card ${card.faceUp ? "face-up" : "face-down"} ${canFlip ? "can-flip" : ""}`}
        onClick={() => canFlip && onToggle(rowIdx, colIdx)}
        data-testid={`card-${field}-${card.cardId}`}
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
  };

  const renderField = (
    rows: BoardCard[][],
    field: "my" | "opponent",
    rowLabels: string[],
    onToggle: (r: number, c: number) => void,
    fieldLabel: string,
    accentColor: string
  ) => (
    <div className="field-wrap">
      <div
        className="field-name-vertical"
        style={{ color: accentColor, borderColor: accentColor }}
      >
        {fieldLabel}
      </div>
      <div className="field-rows" data-testid={`grid-${field}`}>
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="row-wrap">
            <div className="card-row">
              {row.map((card, cIdx) => renderCard(card, field, rIdx, cIdx, onToggle))}
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
        <div className="board-area">
          {renderField(opponentRows, "opponent", OPPONENT_ROW_LABELS, toggleOpCard, "相手陣", "#8b1a1a")}
          <div className="center-gap">
            <div className="center-line" /><span className="center-text">— 中陣 —</span><div className="center-line" />
          </div>
          {renderField(myRows, "my", MY_ROW_LABELS, toggleMyCard, "自陣", "#1a3a6b")}
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
