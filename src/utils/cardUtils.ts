/**
 * pokecavers - Card Utility Functions
 * TASK-020: CardEntry 操作ユーティリティ
 *
 * すべての操作はイミュータブル（元の配列を変更しない）
 */

import type { CardEntry, CardCategory } from '../types';

/**
 * カードをデッキに追加する
 * 同名カードが既に存在する場合は枚数を1増加させる
 *
 * @param cards - 現在のカード配列
 * @param card - 追加するカード（countを除く）
 * @returns 新しいカード配列
 */
export function addCard(
  cards: CardEntry[],
  card: Omit<CardEntry, 'count'>
): CardEntry[] {
  const existingIndex = cards.findIndex((c) => c.cardName === card.cardName);

  if (existingIndex >= 0) {
    // 既存カードの枚数を増加
    return cards.map((c, i) =>
      i === existingIndex ? { ...c, count: c.count + 1 } : c
    );
  }

  // 新規カードを追加
  return [...cards, { ...card, count: 1 }];
}

/**
 * カードをデッキから削除する
 *
 * @param cards - 現在のカード配列
 * @param cardName - 削除するカード名
 * @returns 新しいカード配列
 */
export function removeCard(cards: CardEntry[], cardName: string): CardEntry[] {
  return cards.filter((c) => c.cardName !== cardName);
}

/**
 * カードの枚数を更新する
 * 0以下を指定した場合はカードを削除する
 *
 * @param cards - 現在のカード配列
 * @param cardName - 更新するカード名
 * @param count - 新しい枚数
 * @returns 新しいカード配列
 */
export function updateCount(
  cards: CardEntry[],
  cardName: string,
  count: number
): CardEntry[] {
  // 0以下は削除扱い
  if (count <= 0) {
    return removeCard(cards, cardName);
  }

  return cards.map((c) => (c.cardName === cardName ? { ...c, count } : c));
}

/**
 * デッキの合計枚数を計算する
 *
 * @param cards - カード配列
 * @returns 合計枚数
 */
export function getTotalCount(cards: CardEntry[]): number {
  return cards.reduce((sum, card) => sum + card.count, 0);
}

/**
 * 指定したカード名の枚数を取得する
 *
 * @param cards - カード配列
 * @param cardName - カード名
 * @returns 枚数（存在しない場合は0）
 */
export function getCardCount(cards: CardEntry[], cardName: string): number {
  const card = cards.find((c) => c.cardName === cardName);
  return card?.count ?? 0;
}

/**
 * カードをカテゴリ別にグループ化する
 *
 * @param cards - カード配列
 * @returns カテゴリをキーとしたグループ
 */
export function groupByCategory(
  cards: CardEntry[]
): Record<CardCategory, CardEntry[]> {
  const result: Record<CardCategory, CardEntry[]> = {
    pokemon: [],
    trainer: [],
    energy: [],
  };

  for (const card of cards) {
    result[card.category].push(card);
  }

  return result;
}

/**
 * カード名でカードを検索する
 *
 * @param cards - カード配列
 * @param cardName - カード名
 * @returns 見つかったカード（存在しない場合はundefined）
 */
export function findCard(
  cards: CardEntry[],
  cardName: string
): CardEntry | undefined {
  return cards.find((c) => c.cardName === cardName);
}

/**
 * 2つのカード配列が同じ内容かどうかを判定する
 * 配列の順序は考慮しない
 *
 * @param a - カード配列1
 * @param b - カード配列2
 * @returns 同じ内容ならtrue
 */
export function isEqual(a: CardEntry[], b: CardEntry[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const mapA = new Map(a.map((c) => [c.cardName, c.count]));

  for (const card of b) {
    const countA = mapA.get(card.cardName);
    if (countA !== card.count) {
      return false;
    }
  }

  return true;
}

// エクスポート用オブジェクト（名前空間的に使う場合用）
export const cardUtils = {
  addCard,
  removeCard,
  updateCount,
  getTotalCount,
  getCardCount,
  groupByCategory,
  findCard,
  isEqual,
};
