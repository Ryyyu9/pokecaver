/**
 * pokecavers - Validation Tests
 * Intent-based testing following docs/40_unit_test_specs.md
 */

import { describe, it, expect } from 'vitest';
import {
  isBasicEnergy,
  validateDeck,
  validateCardAddition,
  validateCommitMessage,
} from '../../src/utils/validation';
import type { CardEntry } from '../../src/types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 指定した合計枚数のデッキを作成するヘルパー
 */
function createDeckWithTotalCount(totalCount: number): CardEntry[] {
  const cards: CardEntry[] = [];
  let remaining = totalCount;

  // 4枚ずつポケモンカードを追加
  let cardIndex = 1;
  while (remaining > 0) {
    const count = Math.min(4, remaining);
    cards.push({
      cardName: `テストポケモン${cardIndex}`,
      category: 'pokemon',
      count,
    });
    remaining -= count;
    cardIndex++;
  }

  return cards;
}

// =============================================================================
// Test: isBasicEnergy
// =============================================================================

describe('validation.isBasicEnergy', () => {
  const basicEnergies = [
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
  ];

  basicEnergies.forEach((energy) => {
    it(`「${energy}」は基本エネルギーと判定される`, () => {
      expect(isBasicEnergy(energy)).toBe(true);
    });
  });

  it('ダブルターボエネルギーは基本エネルギーではない', () => {
    expect(isBasicEnergy('ダブルターボエネルギー')).toBe(false);
  });

  it('ジェットエネルギーは基本エネルギーではない', () => {
    expect(isBasicEnergy('ジェットエネルギー')).toBe(false);
  });

  it('「基本」を含まないエネルギーは基本エネルギーではない', () => {
    expect(isBasicEnergy('炎エネルギー')).toBe(false);
  });

  it('レインボーエネルギーは基本エネルギーではない', () => {
    expect(isBasicEnergy('レインボーエネルギー')).toBe(false);
  });
});

// =============================================================================
// Test: validateDeck
// =============================================================================

describe('validation.validateDeck', () => {
  describe('60枚制限', () => {
    it('60枚のデッキは有効', () => {
      // 意図: 正規のデッキサイズを許可
      const cards = createDeckWithTotalCount(60);

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('61枚以上のデッキは無効', () => {
      // 意図: ルール違反を防止
      const cards = createDeckWithTotalCount(61);

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DECK_OVER_60' })
      );
    });

    it('59枚以下のデッキは有効（構築中を許容）', () => {
      // 意図: 構築途中の状態を許可
      const cards = createDeckWithTotalCount(30);

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('空のデッキは有効（構築開始時を許容）', () => {
      const result = validateDeck([]);

      expect(result.isValid).toBe(true);
    });
  });

  describe('同名4枚制限', () => {
    it('同名カード4枚は有効', () => {
      // 意図: 最大枚数を許可
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('同名カード5枚以上は無効', () => {
      // 意図: ルール違反を防止
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 5 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CARD_OVER_4' })
      );
    });

    it('基本エネルギーは5枚以上でも有効', () => {
      // 意図: 基本エネルギーは例外ルール
      const cards: CardEntry[] = [
        { cardName: '基本雷エネルギー', category: 'energy', count: 20 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('特殊エネルギーは4枚制限が適用される', () => {
      // 意図: 特殊エネルギーは基本エネルギーではない
      const cards: CardEntry[] = [
        { cardName: 'ダブルターボエネルギー', category: 'energy', count: 5 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
    });

    it('複数のカードがそれぞれ4枚は有効', () => {
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('複数のカードが5枚以上の場合、複数のエラーが返る', () => {
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 5 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 6 },
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors.filter((e) => e.code === 'CARD_OVER_4')).toHaveLength(2);
    });
  });

  describe('複合バリデーション', () => {
    it('60枚超過と同名5枚が同時に発生する場合、両方のエラーが返る', () => {
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 5 },
        ...createDeckWithTotalCount(56),
      ];

      const result = validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DECK_OVER_60')).toBe(true);
      expect(result.errors.some((e) => e.code === 'CARD_OVER_4')).toBe(true);
    });
  });
});

// =============================================================================
// Test: validateCardAddition
// =============================================================================

describe('validation.validateCardAddition', () => {
  it('追加後も60枚以内なら有効', () => {
    const cards = createDeckWithTotalCount(59);
    const newCard = { cardName: '新しいカード', category: 'pokemon' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(true);
  });

  it('追加後に61枚になる場合は無効', () => {
    const cards = createDeckWithTotalCount(60);
    const newCard = { cardName: '新しいカード', category: 'pokemon' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('DECK_OVER_60');
  });

  it('追加後も同名4枚以内なら有効', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 3 },
    ];
    const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(true);
  });

  it('追加後に同名5枚になる場合は無効', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('CARD_OVER_4');
  });

  it('基本エネルギーは5枚目以降も追加可能', () => {
    const cards: CardEntry[] = [
      { cardName: '基本雷エネルギー', category: 'energy', count: 10 },
    ];
    const newCard = { cardName: '基本雷エネルギー', category: 'energy' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(true);
  });

  it('新規カードの追加は常に有効（制限内なら）', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const newCard = { cardName: 'ミュウex', category: 'pokemon' as const };

    const result = validateCardAddition(cards, newCard);

    expect(result.isValid).toBe(true);
  });
});

// =============================================================================
// Test: validateCommitMessage
// =============================================================================

describe('validation.validateCommitMessage', () => {
  it('空文字は無効', () => {
    // 意図: 理由なしの変更を防止
    const result = validateCommitMessage('');

    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('MESSAGE_REQUIRED');
  });

  it('空白のみは無効', () => {
    // 意図: 実質的に空のメッセージを防止
    const result = validateCommitMessage('   ');

    expect(result.isValid).toBe(false);
  });

  it('タブや改行のみは無効', () => {
    const result = validateCommitMessage('\t\n');

    expect(result.isValid).toBe(false);
  });

  it('1文字以上のメッセージは有効', () => {
    // 意図: 最小限の記録を許可
    const result = validateCommitMessage('調整');

    expect(result.isValid).toBe(true);
  });

  it('改行を含むメッセージは有効', () => {
    // 意図: 詳細な説明を許可
    const result = validateCommitMessage('理由1\n理由2');

    expect(result.isValid).toBe(true);
  });

  it('長いメッセージも有効', () => {
    const longMessage = 'あ'.repeat(1000);
    const result = validateCommitMessage(longMessage);

    expect(result.isValid).toBe(true);
  });

  it('前後の空白は無視してバリデーションする', () => {
    // '  有効なメッセージ  ' はトリム後に有効
    const result = validateCommitMessage('  有効なメッセージ  ');

    expect(result.isValid).toBe(true);
  });
});
