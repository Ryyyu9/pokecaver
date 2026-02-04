/**
 * pokecavers - State Reconstructor
 * TASK-042: 状態復元ユーティリティ
 *
 * diffから過去状態を計算するロジック
 */

import type { CardEntry, DiffEntry, Version } from '../types';
import { applyDiff } from '../services/DiffService';

/**
 * Version 1 から指定バージョンまでの状態を復元する
 *
 * @param versions - バージョン配列（versionNumberでソートされていること）
 * @param targetVersion - 復元したいバージョン番号
 * @returns 復元されたカード配列
 */
export function reconstruct(
  versions: Version[],
  targetVersion: number
): CardEntry[] {
  // バージョン番号でソート（念のため）
  const sortedVersions = [...versions].sort(
    (a, b) => a.versionNumber - b.versionNumber
  );

  // 空の状態から開始
  let currentState: CardEntry[] = [];

  // 対象バージョンまでの差分を順に適用
  for (const version of sortedVersions) {
    if (version.versionNumber > targetVersion) {
      break;
    }

    currentState = applyDiff(currentState, version.diff);
  }

  return currentState;
}

/**
 * 2バージョン間の累積差分を計算する
 *
 * @param versions - バージョン配列
 * @param from - 開始バージョン番号
 * @param to - 終了バージョン番号
 * @returns 累積された差分エントリ
 */
export function accumulateDiff(
  versions: Version[],
  from: number,
  to: number
): DiffEntry[] {
  // fromとtoの状態を復元
  const fromState = reconstruct(versions, from);
  const toState = reconstruct(versions, to);

  // 2つの状態から差分を計算
  return calculateDiffFromStates(fromState, toState);
}

/**
 * 2つの状態から差分を計算する（内部ヘルパー）
 */
function calculateDiffFromStates(
  before: CardEntry[],
  after: CardEntry[]
): DiffEntry[] {
  const diff: DiffEntry[] = [];

  const beforeMap = new Map<string, CardEntry>();
  for (const card of before) {
    beforeMap.set(card.cardName, card);
  }

  const afterMap = new Map<string, CardEntry>();
  for (const card of after) {
    afterMap.set(card.cardName, card);
  }

  // 追加・変更の検出
  for (const [cardName, afterCard] of afterMap) {
    const beforeCard = beforeMap.get(cardName);

    if (!beforeCard) {
      diff.push({
        cardName,
        cardId: afterCard.cardId,
        category: afterCard.category,
        type: 'added',
        afterCount: afterCard.count,
      });
    } else if (beforeCard.count !== afterCard.count) {
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

  // 削除の検出
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
 * 特定バージョンが存在するかチェック
 *
 * @param versions - バージョン配列
 * @param versionNumber - チェックするバージョン番号
 * @returns 存在すればtrue
 */
export function hasVersion(
  versions: Version[],
  versionNumber: number
): boolean {
  return versions.some((v) => v.versionNumber === versionNumber);
}

/**
 * 最新バージョン番号を取得する
 *
 * @param versions - バージョン配列
 * @returns 最新バージョン番号（バージョンがない場合は0）
 */
export function getLatestVersionNumber(versions: Version[]): number {
  if (versions.length === 0) {
    return 0;
  }

  return Math.max(...versions.map((v) => v.versionNumber));
}

// エクスポート用オブジェクト
export const stateReconstructor = {
  reconstruct,
  accumulateDiff,
  hasVersion,
  getLatestVersionNumber,
};
