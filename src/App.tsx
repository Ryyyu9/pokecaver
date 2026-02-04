import { useState } from 'react';
import type { CardEntry, Version, DiffEntry, CardCategory } from './types';
import { addCard, removeCard, updateCount, getTotalCount, groupByCategory } from './utils/cardUtils';
import { validateDeck, validateCardAddition, validateCommitMessage } from './utils/validation';
import { calculateDiff, hasDiff } from './services/DiffService';
import { reconstruct } from './utils/stateReconstructor';

type Tab = 'edit' | 'history';

export default function App() {
  // State
  const [currentCards, setCurrentCards] = useState<CardEntry[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [savedCards, setSavedCards] = useState<CardEntry[]>([]); // Last committed state
  const [activeTab, setActiveTab] = useState<Tab>('edit');

  // Input state
  const [cardName, setCardName] = useState('');
  const [category, setCategory] = useState<CardCategory>('pokemon');
  const [commitMessage, setCommitMessage] = useState('');

  // UI state
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Validation
  const deckValidation = validateDeck(currentCards);
  const hasChanges = hasDiff(savedCards, currentCards);
  const messageValidation = validateCommitMessage(commitMessage);

  // Handlers
  const handleAddCard = () => {
    if (!cardName.trim()) return;

    const newCard = { cardName: cardName.trim(), category };
    const validation = validateCardAddition(currentCards, newCard);

    if (!validation.isValid) {
      alert(validation.errors[0].message);
      return;
    }

    setCurrentCards(addCard(currentCards, newCard));
    setCardName('');
  };

  const handleUpdateCount = (name: string, count: number) => {
    setCurrentCards(updateCount(currentCards, name, count));
  };

  const handleRemoveCard = (name: string) => {
    setCurrentCards(removeCard(currentCards, name));
  };

  const handleCommit = () => {
    if (!hasChanges || !messageValidation.isValid) return;

    const diff = calculateDiff(savedCards, currentCards);
    const newVersion: Version = {
      id: `v${versions.length + 1}`,
      deckId: 'demo-deck',
      versionNumber: versions.length + 1,
      message: commitMessage.trim(),
      diff,
      createdAt: new Date(),
    };

    setVersions([...versions, newVersion]);
    setSavedCards([...currentCards]);
    setCommitMessage('');
    setSuccessMessage(`Version ${newVersion.versionNumber} を保存しました`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleViewVersion = (versionNumber: number) => {
    setSelectedVersion(selectedVersion === versionNumber ? null : versionNumber);
  };

  // Render helpers
  const renderCardList = () => {
    const grouped = groupByCategory(currentCards);
    const categoryLabels: Record<CardCategory, string> = {
      pokemon: 'ポケモン',
      trainer: 'トレーナーズ',
      energy: 'エネルギー',
    };
    const categories: CardCategory[] = ['pokemon', 'trainer', 'energy'];

    if (currentCards.length === 0) {
      return (
        <div className="empty-state">
          <p>カードがありません</p>
          <p style={{ fontSize: 12 }}>上のフォームからカードを追加してください</p>
        </div>
      );
    }

    return (
      <div className="card-list">
        {categories.map((cat) => {
          const cards = grouped[cat];
          if (cards.length === 0) return null;

          return (
            <div key={cat}>
              <div className="card-category">{categoryLabels[cat]}</div>
              {cards.map((card) => (
                <div key={card.cardName} className="card-item">
                  <span className="card-name">{card.cardName}</span>
                  <div className="card-controls">
                    <button
                      className="count-btn"
                      onClick={() => handleUpdateCount(card.cardName, card.count - 1)}
                    >
                      −
                    </button>
                    <span className="card-count">{card.count}</span>
                    <button
                      className="count-btn"
                      onClick={() => handleUpdateCount(card.cardName, card.count + 1)}
                      disabled={!validateCardAddition(currentCards, { ...card, count: 1 }).isValid}
                    >
                      +
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleRemoveCard(card.cardName)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        <div className="total-count">
          合計: <strong>{getTotalCount(currentCards)}</strong> / 60 枚
        </div>
      </div>
    );
  };

  const renderDiff = (diff: DiffEntry[]) => {
    if (diff.length === 0) {
      return <div className="empty-state"><p>変更なし</p></div>;
    }

    return (
      <div className="diff-view">
        {diff.map((entry, i) => (
          <div key={i} className={`diff-item ${entry.type}`}>
            <span className="diff-icon">
              {entry.type === 'added' && '+'}
              {entry.type === 'removed' && '−'}
              {entry.type === 'changed' && '△'}
            </span>
            <span className="diff-name">{entry.cardName}</span>
            <span className="diff-count">
              {entry.type === 'added' && `${entry.afterCount}枚`}
              {entry.type === 'removed' && `${entry.beforeCount}枚`}
              {entry.type === 'changed' && `${entry.beforeCount}→${entry.afterCount}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderEditTab = () => (
    <div className="content">
      <div className="section">
        <div className="section-title">カードを追加</div>
        <div className="card-input">
          <input
            type="text"
            placeholder="カード名"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value as CardCategory)}>
            <option value="pokemon">ポケモン</option>
            <option value="trainer">トレーナーズ</option>
            <option value="energy">エネルギー</option>
          </select>
          <button onClick={handleAddCard} disabled={!cardName.trim()}>
            追加
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">デッキ内容</div>
        {!deckValidation.isValid && (
          <div className="validation-error">
            {deckValidation.errors[0].message}
          </div>
        )}
        {renderCardList()}
      </div>

      {hasChanges && (
        <div className="commit-section">
          <div className="section-title">変更を保存</div>
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          <div className="section-title" style={{ marginTop: 8 }}>変更内容</div>
          {renderDiff(calculateDiff(savedCards, currentCards))}
          <input
            type="text"
            className="commit-input"
            placeholder="変更理由を入力（必須）"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            style={{ marginTop: 16 }}
          />
          <button
            className="commit-btn"
            onClick={handleCommit}
            disabled={!messageValidation.isValid || !deckValidation.isValid}
          >
            コミット（Version {versions.length + 1} として保存）
          </button>
        </div>
      )}

      {!hasChanges && versions.length > 0 && (
        <div className="empty-state">
          <p>変更はありません</p>
          <p style={{ fontSize: 12 }}>カードを編集するとコミットできます</p>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="content">
      <div className="section">
        <div className="section-title">バージョン履歴</div>
        {versions.length === 0 ? (
          <div className="empty-state">
            <p>履歴がありません</p>
            <p style={{ fontSize: 12 }}>編集タブでデッキを作成してコミットしてください</p>
          </div>
        ) : (
          <div className="version-list">
            {[...versions].reverse().map((version) => (
              <div key={version.id}>
                <div
                  className="version-item"
                  onClick={() => handleViewVersion(version.versionNumber)}
                >
                  <div className="version-header">
                    <span className="version-number">Version {version.versionNumber}</span>
                    <span className="version-date">
                      {version.createdAt.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="version-message">{version.message}</div>
                </div>
                {selectedVersion === version.versionNumber && (
                  <div style={{ padding: '0 16px 16px', background: '#f9f9f9' }}>
                    <div className="section-title">この時点のデッキ</div>
                    {renderVersionState(version.versionNumber)}
                    <div className="section-title" style={{ marginTop: 16 }}>変更差分</div>
                    {renderDiff(version.diff)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderVersionState = (versionNumber: number) => {
    const state = reconstruct(versions, versionNumber);
    const grouped = groupByCategory(state);
    const categoryLabels: Record<CardCategory, string> = {
      pokemon: 'ポケモン',
      trainer: 'トレーナーズ',
      energy: 'エネルギー',
    };
    const categories: CardCategory[] = ['pokemon', 'trainer', 'energy'];

    if (state.length === 0) {
      return <div className="empty-state"><p>カードなし</p></div>;
    }

    return (
      <div className="card-list">
        {categories.map((cat) => {
          const cards = grouped[cat];
          if (cards.length === 0) return null;
          return (
            <div key={cat}>
              <div className="card-category">{categoryLabels[cat]}</div>
              {cards.map((card) => (
                <div key={card.cardName} className="card-item">
                  <span className="card-name">{card.cardName}</span>
                  <span className="card-count" style={{ marginLeft: 'auto' }}>×{card.count}</span>
                </div>
              ))}
            </div>
          );
        })}
        <div className="total-count">
          合計: <strong>{getTotalCount(state)}</strong> 枚
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>pokecavers</h1>
        <p>デッキ構築バージョン管理</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          編集
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          履歴 ({versions.length})
        </button>
      </nav>

      {activeTab === 'edit' && renderEditTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </div>
  );
}
