/**
 * pokecavers - CardUtils Tests
 * Intent-based testing following docs/40_unit_test_specs.md
 */

import { describe, it, expect } from 'vitest';
import {
  addCard,
  removeCard,
  updateCount,
  getTotalCount,
  getCardCount,
  groupByCategory,
  isEqual,
} from '../../src/utils/cardUtils';
import type { CardEntry } from '../../src/types';

// =============================================================================
// Test: addCard
// =============================================================================

describe('cardUtils.addCard', () => {
  describe('新規カード追加', () => {
    it('空のデッキに新しいカードを追加できる', () => {
      // 意図: デッキ作成直後の空状態からカードを追加できる
      const cards: CardEntry[] = [];
      const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

      const result = addCard(cards, newCard);

      expect(result).toHaveLength(1);
      expect(result[0].cardName).toBe('ピカチュウex');
      expect(result[0].count).toBe(1);
    });

    it('既存カードと異なる名前のカードは別エントリとして追加される', () => {
      // 意図: 異なるカードは区別して管理される
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const newCard = { cardName: 'ライチュウex', category: 'pokemon' as const };

      const result = addCard(cards, newCard);

      expect(result).toHaveLength(2);
      expect(result[1].cardName).toBe('ライチュウex');
      expect(result[1].count).toBe(1);
    });

    it('カテゴリ情報も正しく保存される', () => {
      const cards: CardEntry[] = [];
      const newCard = { cardName: 'ふしぎなアメ', category: 'trainer' as const };

      const result = addCard(cards, newCard);

      expect(result[0].category).toBe('trainer');
    });
  });

  describe('既存カードへの追加', () => {
    it('同名カードを追加すると枚数が増加する', () => {
      // 意図: 同じカードを追加すると枚数が1増える（重複作成しない）
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

      const result = addCard(cards, newCard);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(3);
    });
  });

  describe('イミュータビリティ', () => {
    it('元の配列は変更されない', () => {
      // 意図: 状態管理の安全性を保証
      const original: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 1 },
      ];
      const originalCopy = JSON.parse(JSON.stringify(original));

      addCard(original, { cardName: 'ライチュウex', category: 'pokemon' });

      expect(original).toEqual(originalCopy);
    });

    it('元のオブジェクトへの参照は共有されない', () => {
      const original: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 1 },
      ];

      const result = addCard(original, {
        cardName: 'ピカチュウex',
        category: 'pokemon',
      });

      // 枚数を変更しても元には影響しない
      result[0].count = 999;
      expect(original[0].count).toBe(1);
    });
  });
});

// =============================================================================
// Test: removeCard
// =============================================================================

describe('cardUtils.removeCard', () => {
  it('指定したカードがデッキから削除される', () => {
    // 意図: 不要になったカードを取り除ける
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      { cardName: 'ライチュウex', category: 'pokemon', count: 1 },
    ];

    const result = removeCard(cards, 'ピカチュウex');

    expect(result).toHaveLength(1);
    expect(result[0].cardName).toBe('ライチュウex');
  });

  it('存在しないカード名を指定しても例外は発生しない', () => {
    // 意図: 防御的プログラミング - 不正入力でクラッシュしない
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = removeCard(cards, '存在しないカード');

    expect(result).toHaveLength(1);
  });

  it('元の配列は変更されない', () => {
    const original: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    removeCard(original, 'ピカチュウex');

    expect(original).toHaveLength(1);
  });
});

// =============================================================================
// Test: updateCount
// =============================================================================

describe('cardUtils.updateCount', () => {
  it('指定したカードの枚数を変更できる', () => {
    // 意図: 試行錯誤で枚数を調整できる
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = updateCount(cards, 'ピカチュウex', 4);

    expect(result[0].count).toBe(4);
  });

  it('枚数を0にするとカードが削除される', () => {
    // 意図: 0枚 = 削除と同義
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = updateCount(cards, 'ピカチュウex', 0);

    expect(result).toHaveLength(0);
  });

  it('負の枚数は0として扱われる（削除される）', () => {
    // 意図: 不正入力の防御
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = updateCount(cards, 'ピカチュウex', -1);

    expect(result).toHaveLength(0);
  });

  it('存在しないカードの枚数変更は何もしない', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = updateCount(cards, '存在しないカード', 4);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('元の配列は変更されない', () => {
    const original: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    updateCount(original, 'ピカチュウex', 4);

    expect(original[0].count).toBe(2);
  });
});

// =============================================================================
// Test: getTotalCount
// =============================================================================

describe('cardUtils.getTotalCount', () => {
  it('全カードの枚数合計を返す', () => {
    // 意図: 60枚制限チェックの基盤
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      { cardName: '基本雷エネルギー', category: 'energy', count: 10 },
    ];

    const total = getTotalCount(cards);

    expect(total).toBe(18);
  });

  it('空のデッキは0を返す', () => {
    const result = getTotalCount([]);
    expect(result).toBe(0);
  });

  it('1種類のカードのみでも正しく計算される', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];

    expect(getTotalCount(cards)).toBe(4);
  });
});

// =============================================================================
// Test: getCardCount
// =============================================================================

describe('cardUtils.getCardCount', () => {
  it('指定したカードの枚数を返す', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 3 },
      { cardName: 'ライチュウex', category: 'pokemon', count: 2 },
    ];

    expect(getCardCount(cards, 'ピカチュウex')).toBe(3);
  });

  it('存在しないカードは0を返す', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 3 },
    ];

    expect(getCardCount(cards, '存在しないカード')).toBe(0);
  });
});

// =============================================================================
// Test: groupByCategory
// =============================================================================

describe('cardUtils.groupByCategory', () => {
  it('カードをカテゴリ別にグループ化する', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      { cardName: '基本雷エネルギー', category: 'energy', count: 10 },
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
    ];

    const grouped = groupByCategory(cards);

    expect(grouped.pokemon).toHaveLength(2);
    expect(grouped.trainer).toHaveLength(1);
    expect(grouped.energy).toHaveLength(1);
  });

  it('空のデッキでも全カテゴリが存在する', () => {
    const grouped = groupByCategory([]);

    expect(grouped.pokemon).toEqual([]);
    expect(grouped.trainer).toEqual([]);
    expect(grouped.energy).toEqual([]);
  });

  it('特定カテゴリのカードがなくても空配列が返る', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];

    const grouped = groupByCategory(cards);

    expect(grouped.trainer).toEqual([]);
    expect(grouped.energy).toEqual([]);
  });
});

// =============================================================================
// Test: isEqual
// =============================================================================

describe('cardUtils.isEqual', () => {
  it('同じ内容の配列はtrueを返す', () => {
    const a: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const b: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];

    expect(isEqual(a, b)).toBe(true);
  });

  it('枚数が違うとfalseを返す', () => {
    const a: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const b: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 3 },
    ];

    expect(isEqual(a, b)).toBe(false);
  });

  it('配列の順序が違っても内容が同じならtrueを返す', () => {
    // 意図: 順序変更は差分とみなさない
    const a: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
    ];
    const b: CardEntry[] = [
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];

    expect(isEqual(a, b)).toBe(true);
  });

  it('長さが違うとfalseを返す', () => {
    const a: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const b: CardEntry[] = [];

    expect(isEqual(a, b)).toBe(false);
  });
});
