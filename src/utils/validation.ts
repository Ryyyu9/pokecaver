/**
 * pokecavers - Validation Logic
 * TASK-021: バリデーションロジック
 *
 * ポケモンカードゲームのルールに従ったデッキ構築を強制する
 */

import type { CardEntry, ValidationResult, ValidationError } from '../types';
import { getTotalCount } from './cardUtils';

// =============================================================================
// Constants
// =============================================================================

/** デッキの最大枚数 */
const MAX_DECK_SIZE = 60;

/** 同名カードの最大枚数（基本エネルギーを除く） */
const MAX_SAME_NAME_COUNT = 4;

/** 基本エネルギーの名前パターン */
const BASIC_ENERGY_PATTERN = /^基本.+エネルギー$/;

/** 基本エネルギーの一覧（完全一致用） */
const BASIC_ENERGY_NAMES = new Set([
  '基本草エネルギー',
  '基本炎エネルギー',
  '基本水エネルギー',
  '基本雷エネルギー',
  '基本超エネルギー',
  '基本闘エネルギー',
  '基本悪エネルギー',
  '基本鋼エネルギー',
  '基本フェアリーエネルギー',
  '基本ドラゴンエネルギー',
  '基本無色エネルギー',
]);

// =============================================================================
// Public Functions
// =============================================================================

/**
 * 基本エネルギーかどうかを判定する
 *
 * @param cardName - カード名
 * @returns 基本エネルギーならtrue
 */
export function isBasicEnergy(cardName: string): boolean {
  // 完全一致でチェック（より正確）
  if (BASIC_ENERGY_NAMES.has(cardName)) {
    return true;
  }
  // パターンマッチでもチェック（将来の拡張用）
  return BASIC_ENERGY_PATTERN.test(cardName);
}

/**
 * デッキ全体のバリデーションを行う
 *
 * @param cards - カード配列
 * @returns バリデーション結果
 */
export function validateDeck(cards: CardEntry[]): ValidationResult {
  const errors: ValidationError[] = [];

  // 60枚制限チェック
  const totalCount = getTotalCount(cards);
  if (totalCount > MAX_DECK_SIZE) {
    errors.push({
      code: 'DECK_OVER_60',
      message: `デッキは${MAX_DECK_SIZE}枚以下にしてください（現在: ${totalCount}枚）`,
    });
  }

  // 同名4枚制限チェック（基本エネルギーを除く）
  for (const card of cards) {
    if (!isBasicEnergy(card.cardName) && card.count > MAX_SAME_NAME_COUNT) {
      errors.push({
        code: 'CARD_OVER_4',
        message: `同名カードは${MAX_SAME_NAME_COUNT}枚までです: ${card.cardName}（${card.count}枚）`,
        field: card.cardName,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * カード追加時のバリデーションを行う
 * 追加後にルール違反になるかどうかを事前チェック
 *
 * @param cards - 現在のカード配列
 * @param newCard - 追加しようとしているカード
 * @returns バリデーション結果
 */
export function validateCardAddition(
  cards: CardEntry[],
  newCard: Omit<CardEntry, 'count'> & { count?: number }
): ValidationResult {
  const errors: ValidationError[] = [];
  const addCount = newCard.count ?? 1;

  // 60枚制限チェック
  const currentTotal = getTotalCount(cards);
  if (currentTotal + addCount > MAX_DECK_SIZE) {
    errors.push({
      code: 'DECK_OVER_60',
      message: `デッキは${MAX_DECK_SIZE}枚以下にしてください`,
    });
  }

  // 同名4枚制限チェック（基本エネルギーを除く）
  if (!isBasicEnergy(newCard.cardName)) {
    const existingCard = cards.find((c) => c.cardName === newCard.cardName);
    const existingCount = existingCard?.count ?? 0;

    if (existingCount + addCount > MAX_SAME_NAME_COUNT) {
      errors.push({
        code: 'CARD_OVER_4',
        message: `同名カードは${MAX_SAME_NAME_COUNT}枚までです`,
        field: newCard.cardName,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * コミットメッセージのバリデーションを行う
 *
 * @param message - コミットメッセージ
 * @returns バリデーション結果
 */
export function validateCommitMessage(message: string): ValidationResult {
  const errors: ValidationError[] = [];

  // 空文字・空白のみはNG
  if (!message || message.trim().length === 0) {
    errors.push({
      code: 'MESSAGE_REQUIRED',
      message: '変更理由を入力してください',
      field: 'message',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * カード名のバリデーションを行う
 *
 * @param cardName - カード名
 * @returns バリデーション結果
 */
export function validateCardName(cardName: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!cardName || cardName.trim().length === 0) {
    errors.push({
      code: 'CARD_NAME_REQUIRED',
      message: 'カード名を入力してください',
      field: 'cardName',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// エクスポート用オブジェクト
export const validation = {
  isBasicEnergy,
  validateDeck,
  validateCardAddition,
  validateCommitMessage,
  validateCardName,
};
