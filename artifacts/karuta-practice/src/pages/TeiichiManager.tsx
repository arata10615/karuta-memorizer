import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ALL_CARDS,
  splitTextIntoColumns,
} from "@/data/karuta";
import {
  TeiichiPattern,
  loadPatterns,
  createPattern,
  deletePattern,
  renamePattern,
  setActivePattern,
  updateCardPositions,
  clearAllCards,
  TEIICHI_ROWS,
  TEIICHI_COLS,
  BLOCK_SIZE,
  CardPosition,
  syncPatternsFromServer,
} from "@/data/teiichiPattern";

export default function TeiichiManager() {
  const [, navigate] = useLocation();
  const [patterns, setPatterns] = useState<TeiichiPattern[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [board, setBoard] = useState<(number | null)[][]>(() => createEmptyBoard());
  const [cardPositions, setCardPositions] = useState<Record<number, CardPosition>>({});
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedPositions, setSavedPositions] = useState<Record<number, CardPosition>>({});
  function createEmptyBoard(): (number | null)[][] {
    return Array.from({ length: TEIICHI_ROWS }, () =>
      Array.from({ length: TEIICHI_COLS }, () => null)
    );
  }

  const refreshPatterns = useCallback(() => {
    const p = loadPatterns();
    setPatterns(p);
    return p;
  }, []);

 useEffect(() => {
  let alive = true;

  (async () => {
    const p = await syncPatternsFromServer();
    if (!alive) return;

    setPatterns(p);

    if (p.length > 0) {
      const active = p.find((pat) => pat.isActive) || p[0];
      selectPattern(active);
    }
  })();

  return () => {
    alive = false;
  };
}, []);

  const selectPattern = (pattern: TeiichiPattern) => {
    if (hasUnsavedChanges) {
      if (!confirm("変更が保存されていません。保存せずに切り替えますか？")) return;
    }
    setSelectedPatternId(pattern.patternId);
    setCardPositions({ ...pattern.cardPositions });
    setSavedPositions({ ...pattern.cardPositions });
    setHasUnsavedChanges(false);
    const newBoard = createEmptyBoard();
    for (const [idStr, pos] of Object.entries(pattern.cardPositions)) {
      const id = Number(idStr);
      if (pos.row >= 0 && pos.row < TEIICHI_ROWS && pos.col >= 0 && pos.col < TEIICHI_COLS) {
        newBoard[pos.row][pos.col] = id;
      }
    }
    setBoard(newBoard);
    setSelectedCardId(null);
  };

  const handleCreate = () => {
    if (patterns.length >= 10) return;
    const name = `パターン${patterns.length + 1}`;
    const newP = createPattern(name);
    if (newP) {
      const p = refreshPatterns();
      const created = p.find((pat) => pat.patternId === newP.patternId);
      if (created) selectPattern(created);
    }
  };

  const handleDelete = (patternId: string) => {
    if (!confirm("このパターンを削除しますか？")) return;
    deletePattern(patternId);
    const p = refreshPatterns();
    if (selectedPatternId === patternId) {
      if (p.length > 0) {
        selectPattern(p[0]);
      } else {
        setSelectedPatternId(null);
        setBoard(createEmptyBoard());
        setCardPositions({});
      }
    }
  };

  const handleRename = (patternId: string) => {
    if (editingName.trim()) {
      renamePattern(patternId, editingName.trim());
      refreshPatterns();
    }
    setEditingNameId(null);
  };

  const handleActivate = (patternId: string) => {
    setActivePattern(patternId);
    refreshPatterns();
  };

  const handleSave = () => {
    if (selectedPatternId) {
      updateCardPositions(selectedPatternId, cardPositions);
      setSavedPositions({ ...cardPositions });
      setHasUnsavedChanges(false);
      refreshPatterns();
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!confirm("変更が保存されていません。保存せずに戻りますか？")) return;
    }
    navigate("/");
  };

  const handleCellClick = (row: number, col: number) => {
    if (!selectedPatternId) return;

    const existing = board[row][col];

    if (existing !== null && selectedCardId === null) {
      setSelectedCardId(existing);
      return;
    }

    if (existing !== null && selectedCardId !== null) {
      if (existing === selectedCardId) {
        setSelectedCardId(null);
        return;
      }
      const newBoard = board.map((r) => [...r]);
      const newPositions = { ...cardPositions };

      const selectedPos = newPositions[selectedCardId];
      if (selectedPos) {
        newBoard[selectedPos.row][selectedPos.col] = existing;
        newPositions[existing] = { row: selectedPos.row, col: selectedPos.col };
      } else {
        for (let r = 0; r < TEIICHI_ROWS; r++) {
          for (let c = 0; c < TEIICHI_COLS; c++) {
            if (newBoard[r][c] === existing) newBoard[r][c] = null;
          }
        }
        delete newPositions[existing];
      }
      newBoard[row][col] = selectedCardId;
      newPositions[selectedCardId] = { row, col };

      setBoard(newBoard);
      setCardPositions(newPositions);
      setHasUnsavedChanges(true);
      setSelectedCardId(null);
      return;
    }

    if (selectedCardId !== null) {
      const newBoard = board.map((r) => [...r]);
      const newPositions = { ...cardPositions };

      const oldPos = newPositions[selectedCardId];
      if (oldPos) {
        newBoard[oldPos.row][oldPos.col] = null;
      }

      newBoard[row][col] = selectedCardId;
      newPositions[selectedCardId] = { row, col };

      setBoard(newBoard);
      setCardPositions(newPositions);
      setHasUnsavedChanges(true);
      setSelectedCardId(null);
    }
  };

  const handleUnplacedCardClick = (cardId: number) => {
    if (!selectedPatternId) return;

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      return;
    }

    if (selectedCardId !== null && cardPositions[selectedCardId]) {
      const newBoard = board.map((r) => [...r]);
      const newPositions = { ...cardPositions };
      const oldPos = newPositions[selectedCardId];
      newBoard[oldPos.row][oldPos.col] = null;
      delete newPositions[selectedCardId];
      setBoard(newBoard);
      setCardPositions(newPositions);
      setHasUnsavedChanges(true);
      setSelectedCardId(null);
      return;
    }

    setSelectedCardId(cardId);
  };

  const handlePlacedCardClick = (cardId: number) => {
    if (!selectedPatternId) return;
    if (selectedCardId === cardId) {
      const newBoard = board.map((r) => [...r]);
      const newPositions = { ...cardPositions };
      const pos = newPositions[cardId];
      if (pos) {
        newBoard[pos.row][pos.col] = null;
        delete newPositions[cardId];
        setBoard(newBoard);
        setCardPositions(newPositions);
        setHasUnsavedChanges(true);
      }
      setSelectedCardId(null);
      return;
    }
    setSelectedCardId(cardId);
  };

  const handleClearAll = () => {
    if (!selectedPatternId) return;
    if (!confirm("全ての札の配置を消去しますか？")) return;
    setBoard(createEmptyBoard());
    setCardPositions({});
    setSelectedCardId(null);
    setHasUnsavedChanges(true);
  };

  const placedCardIds = new Set(Object.keys(cardPositions).map(Number));
  const unplacedCards = ALL_CARDS.filter((c) => !placedCardIds.has(c.id));

  const selectedPattern = patterns.find((p) => p.patternId === selectedPatternId);

  return (
    <div className="teiichi-page">
      <header className="teiichi-header">
        <div className="teiichi-header-left">
          <button className="btn btn-back" onClick={handleBack}>戻る</button>
          <h1 className="teiichi-title">定位置管理</h1>
          {hasUnsavedChanges && <span className="teiichi-unsaved-badge">未保存</span>}
        </div>
        <div className="teiichi-header-right">
          <button
            className="teiichi-btn teiichi-btn-save"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            保存
          </button>
        </div>
      </header>

      <div className="teiichi-content">
        <section className="teiichi-patterns">
          <div className="teiichi-patterns-header">
            <h2 className="teiichi-section-title">パターン一覧</h2>
            <button
              className="teiichi-btn teiichi-btn-create"
              onClick={handleCreate}
              disabled={patterns.length >= 10}
            >
              + 新規作成
            </button>
          </div>

          <div className="teiichi-pattern-list">
            {patterns.map((p) => (
              <div
                key={p.patternId}
                className={`teiichi-pattern-item ${selectedPatternId === p.patternId ? "selected" : ""} ${p.isActive ? "active" : ""}`}
                onClick={() => selectPattern(p)}
              >
                <div className="teiichi-pattern-info">
                  {editingNameId === p.patternId ? (
                    <input
                      className="teiichi-name-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(p.patternId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(p.patternId);
                        if (e.key === "Escape") setEditingNameId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="teiichi-pattern-name">{p.patternName}</span>
                  )}
                  <span className="teiichi-pattern-count">
                    {Object.keys(p.cardPositions).length}/100枚
                  </span>
                  {p.isActive && <span className="teiichi-active-badge">適用中</span>}
                </div>
                <div className="teiichi-pattern-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="teiichi-action-btn"
                    onClick={() => {
                      setEditingNameId(p.patternId);
                      setEditingName(p.patternName);
                    }}
                    title="名前変更"
                  >
                    ✏️
                  </button>
                  {!p.isActive && (
                    <button
                      className="teiichi-action-btn teiichi-activate-btn"
                      onClick={() => handleActivate(p.patternId)}
                      title="適用"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="teiichi-action-btn teiichi-delete-btn"
                    onClick={() => handleDelete(p.patternId)}
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {patterns.length === 0 && (
              <p className="teiichi-empty-msg">パターンがありません。「新規作成」で作成してください。</p>
            )}
          </div>
        </section>

        {selectedPattern && (
          <>
            <section className="teiichi-board-section">
              <div className="teiichi-board-header">
                <h2 className="teiichi-section-title">
                  盤面: {selectedPattern.patternName}
                </h2>
                <div className="teiichi-board-actions">
                  <span className="teiichi-placed-count">
                    配置済み: {Object.keys(cardPositions).length}/100
                  </span>
                  <button
                    className="teiichi-btn teiichi-btn-expand"
                    onClick={() => setShowFullscreen(true)}
                    disabled={Object.keys(cardPositions).length === 0}
                    title="盤面を拡大表示"
                  >
                    拡大
                  </button>
                  <button
                    className="teiichi-btn teiichi-btn-clear"
                    onClick={handleClearAll}
                    disabled={Object.keys(cardPositions).length === 0}
                  >
                    全消去
                  </button>
                </div>
              </div>

              <div className="teiichi-board-scroll">
                <div className="teiichi-board">
                  {Array.from({ length: TEIICHI_ROWS }, (_, rowIdx) => (
                    <div key={rowIdx} className="teiichi-row">
                      <div className="teiichi-row-label">
                        {["上段", "中段", "下段"][rowIdx]}
                      </div>
                      <div className="teiichi-row-cells">
                        {Array.from({ length: TEIICHI_COLS }, (_, colIdx) => {
                          const cardId = board[rowIdx][colIdx];
                          const isBlockBorder = colIdx === BLOCK_SIZE;
                          const isSelected = cardId !== null && selectedCardId === cardId;
                          const isDropTarget = cardId === null && selectedCardId !== null;

                          return (
                            <div
                              key={colIdx}
                              className={`teiichi-cell ${isBlockBorder ? "block-border" : ""} ${cardId !== null ? "filled" : "empty"} ${isSelected ? "selected" : ""} ${isDropTarget ? "drop-target" : ""}`}
                              onClick={() => {
                                if (cardId !== null && selectedCardId !== null && selectedCardId !== cardId) {
                                  handleCellClick(rowIdx, colIdx);
                                } else if (cardId !== null) {
                                  handlePlacedCardClick(cardId);
                                } else {
                                  handleCellClick(rowIdx, colIdx);
                                }
                              }}
                            >
                              {cardId !== null && (
                                <TeiichiCardMini cardId={cardId} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="teiichi-block-labels">
                    <div className="teiichi-block-label-spacer" />
                    <div className="teiichi-block-label">左ブロック（← 外側優先）</div>
                    <div className="teiichi-block-label">右ブロック（外側優先 →）</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="teiichi-unplaced">
              <h2 className="teiichi-section-title">
                未配置の札（{unplacedCards.length}枚）
              </h2>
              {selectedCardId !== null && !cardPositions[selectedCardId] && (
                <p className="teiichi-hint">盤面の空きマスをタップして配置</p>
              )}
              {selectedCardId !== null && cardPositions[selectedCardId] && (
                <p className="teiichi-hint">空きマスで移動 / 札タップで入れ替え / もう一度タップで取り外し</p>
              )}
              <div className="teiichi-unplaced-cards">
                {unplacedCards.map((card) => {
                  const isSelected = selectedCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      className={`teiichi-unplaced-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleUnplacedCardClick(card.id)}
                    >
                      <TeiichiCardMini cardId={card.id} />
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {showFullscreen && selectedPattern && (
        <div className="teiichi-fullscreen-overlay" onClick={() => setShowFullscreen(false)}>
          <div className="teiichi-fullscreen-header">
            <span className="teiichi-fullscreen-title">{selectedPattern.patternName}</span>
            <button className="teiichi-fullscreen-close" onClick={() => setShowFullscreen(false)}>
              閉じる
            </button>
          </div>
          <div className="teiichi-fullscreen-board" onClick={(e) => e.stopPropagation()}>
            <div className="teiichi-fullscreen-grid">
              {Array.from({ length: TEIICHI_ROWS }, (_, rowIdx) => (
                <div key={rowIdx} className="teiichi-fs-row">
                  <div className="teiichi-fs-row-label">
                    {["上段", "中段", "下段"][rowIdx]}
                  </div>
                  <div className="teiichi-fs-row-cells">
                    {Array.from({ length: TEIICHI_COLS }, (_, colIdx) => {
                      const cardId = board[rowIdx][colIdx];
                      const isBlockBorder = colIdx === BLOCK_SIZE;
                      return (
                        <div
                          key={colIdx}
                          className={`teiichi-fs-cell ${isBlockBorder ? "block-border" : ""} ${cardId !== null ? "filled" : "empty"}`}
                        >
                          {cardId !== null && (
                            <TeiichiCardMini cardId={cardId} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="teiichi-block-labels">
                <div className="teiichi-block-label-spacer" />
                <div className="teiichi-block-label">左ブロック（← 外側優先）</div>
                <div className="teiichi-block-label">右ブロック（外側優先 →）</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeiichiCardMini({ cardId }: { cardId: number }) {
  const card = ALL_CARDS.find((c) => c.id === cardId);
  if (!card) return null;
  const cols = splitTextIntoColumns(card.shimoHiragana);

  return (
    <div className="teiichi-card-mini">
      <div className="teiichi-card-text" translate="no">
        {cols.map((col, i) => (
          <span key={i} className="teiichi-card-col">{col}</span>
        ))}
      </div>
      <span className="teiichi-card-no">{cardId}</span>
    </div>
  );
}
