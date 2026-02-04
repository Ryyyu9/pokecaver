/**
 * pokecavers - Diff Service
 * TASK-030: DiffService 実装
 *
 * 差分計算ロジック - デッキの変更を検出し、履歴として記録可能にする
 */

import type { CardEntry, DiffEntry } from '../types';

/**
 * 2つのカード配列から差分を計算する
 *
 * @param before - 変更前のカード配列
 * @param after - 変更後のカード配列
 * @returns 差分エントリの配列
 */
export function calculateDiff(
  before: CardEntry[],
  after: CardEntry[]
): DiffEntry[] {
  const diff: DiffEntry[] = [];

  // beforeをMapに変換
  const beforeMap = new Map<string, CardEntry>();
  for (const card of before) {
    beforeMap.set(card.cardName, card);
  }

  // afterをMapに変換
  const afterMap = new Map<string, CardEntry>();
  for (const card of after) {
    afterMap.set(card.cardName, card);
  }

  // 追加・変更の検出（afterにあるカード）
  for (const [cardName, afterCard] of afterMap) {
    const beforeCard = beforeMap.get(cardName);

    if (!beforeCard) {
      // 新規追加
      diff.push({
        cardName,
        cardId: afterCard.cardId,
        category: afterCard.category,
        type: 'added',
        afterCount: afterCard.count,
      });
    } else if (beforeCard.count !== afterCard.count) {
      // 枚数変更
      diff.push({
        cardName,
        cardId: afterCard.cardId,
        category: afterCard.category,
        type: 'changed',
        beforeCount: beforeCard.count,
        afterCount: afterCard.count,
      });
    }
  }

  // 削除の検出（beforeにあってafterにないカード）
  for (const [cardName, beforeCard] of beforeMap) {
    if (!afterMap.has(cardName)) {
      diff.push({
        cardName,
        cardId: beforeCard.cardId,
        category: beforeCard.category,
        type: 'removed',
        beforeCount: beforeCard.count,
      });
    }
  }

  return diff;
}

/**
 * 差分があるかどうかを判定する
 * 配列の順序は考慮しない
 *
 * @param before - 変更前のカード配列
 * @param after - 変更後のカード配列
 * @returns 差分があればtrue
 */
export function hasDiff(before: CardEntry[], after: CardEntry[]): boolean {
  // 長さが違えば差分あり
  if (before.length !== after.length) {
    return true;
  }

  // beforeをMapに変換
  const beforeMap = new Map<string, number>();
  for (const card of before) {
    beforeMap.set(card.cardName, card.count);
  }

  // afterの各カードがbeforeに同じ枚数で存在するかチェック
  for (const card of after) {
    const beforeCount = beforeMap.get(card.cardName);
    if (beforeCount !== card.count) {
      return true;
    }
  }

  return false;
}

/**
 * 差分を適用して新しい状態を生成する
 *
 * @param base - 基準となるカード配列
 * @param diff - 適用する差分
 * @returns 新しいカード配列
 */
export function applyDiff(base: CardEntry[], diff: DiffEntry[]): CardEntry[] {
  // baseをMapに変換（ディープコピー）
  const resultMap = new Map<string, CardEntry>();
  for (const card of base) {
    resultMap.set(card.cardName, { ...card });
  }

  // 差分を適用
  for (const entry of diff) {
    switch (entry.type) {
      case 'added':
        resultMap.set(entry.cardName, {
          cardName: entry.cardName,
          cardId: entry.cardId,
          category: entry.category,
          count: entry.afterCount!,
        });
        break;

      case 'removed':
        resultMap.delete(entry.cardName);
        break;

      case 'changed':
        const existing = resultMap.get(entry.cardName);
        if (existing) {
          resultMap.set(entry.cardName, {
            ...existing,
            count: entry.afterCount!,
          });
        }
        break;
    }
  }

  return Array.from(resultMap.values());
}

/**
 * 複数の差分を順に適用する
 *
 * @param base - 基準となるカード配列
 * @param diffs - 適用する差分の配列（順序通りに適用）
 * @returns 新しいカード配列
 */
export function applyDiffs(
  base: CardEntry[],
  diffs: DiffEntry[][]
): CardEntry[] {
  let result = base;

  for (const diff of diffs) {
    result = applyDiff(result, diff);
  }

  return result;
}

/**
 * 差分を逆適用して元の状態に戻す
 * （デバッグ・検証用）
 *
 * @param current - 現在のカード配列
 * @param diff - 逆適用する差分
 * @returns 元のカード配列
 */
export function reverseDiff(
  current: CardEntry[],
  diff: DiffEntry[]
): CardEntry[] {
  // 差分を逆変換
  const reversedDiff: DiffEntry[] = diff.map((entry) => {
    switch (entry.type) {
      case 'added':
        return {
          ...entry,
          type: 'removed' as const,
          beforeCount: entry.afterCount,
          afterCount: undefined,
        };

      case 'removed':
        return {
          ...entry,
          type: 'added' as const,
          afterCount: entry.beforeCount,
          beforeCount: undefined,
        };

      case 'changed':
        return {
          ...entry,
          beforeCount: entry.afterCount,
          afterCount: entry.beforeCount,
        };
    }
  });

  return applyDiff(current, reversedDiff);
}

// エクスポート用オブジェクト
export const DiffService = {
  calculateDiff,
  hasDiff,
  applyDiff,
  applyDiffs,
  reverseDiff,
};
