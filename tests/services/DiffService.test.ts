/**
 * pokecavers - DiffService Tests
 * Intent-based testing following docs/40_unit_test_specs.md
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDiff,
  hasDiff,
  applyDiff,
  applyDiffs,
  reverseDiff,
} from '../../src/services/DiffService';
import type { CardEntry, DiffEntry } from '../../src/types';

// =============================================================================
// Test: calculateDiff
// =============================================================================

describe('DiffService.calculateDiff', () => {
  describe('カード追加の検出', () => {
    it('新しいカードの追加を検出する', () => {
      // 意図: 新規投入カードを履歴に残す
      const before: CardEntry[] = [];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        cardId: undefined,
        category: 'pokemon',
        type: 'added',
        afterCount: 2,
      });
    });

    it('複数カードの追加を検出する', () => {
      const before: CardEntry[] = [];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(2);
      expect(diff.every((d) => d.type === 'added')).toBe(true);
    });
  });

  describe('カード削除の検出', () => {
    it('カードの完全削除を検出する', () => {
      // 意図: 採用をやめたカードを履歴に残す
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const after: CardEntry[] = [];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        cardId: undefined,
        category: 'pokemon',
        type: 'removed',
        beforeCount: 2,
      });
    });

    it('複数カードの削除を検出する', () => {
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 2 },
      ];
      const after: CardEntry[] = [];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(2);
      expect(diff.every((d) => d.type === 'removed')).toBe(true);
    });
  });

  describe('枚数変更の検出', () => {
    it('カード枚数の増加を検出する', () => {
      // 意図: 枚数調整を履歴に残す
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        cardId: undefined,
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4,
      });
    });

    it('カード枚数の減少を検出する', () => {
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff[0].type).toBe('changed');
      expect(diff[0].beforeCount).toBe(4);
      expect(diff[0].afterCount).toBe(2);
    });
  });

  describe('変更なしの検出', () => {
    it('変更がない場合は空配列を返す', () => {
      // 意図: 不要なバージョン作成を防止
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];

      const diff = calculateDiff(cards, cards);

      expect(diff).toHaveLength(0);
    });

    it('同じ内容の異なる配列でも差分なし', () => {
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(0);
    });
  });

  describe('複合変更の検出', () => {
    it('追加・削除・変更が混在する場合も正しく検出する', () => {
      // 意図: 複雑な編集も正確に記録
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 1 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ミュウex', category: 'pokemon', count: 1 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff).toHaveLength(3);
      expect(diff.find((d) => d.cardName === 'ピカチュウex')?.type).toBe('changed');
      expect(diff.find((d) => d.cardName === 'ライチュウex')?.type).toBe('removed');
      expect(diff.find((d) => d.cardName === 'ミュウex')?.type).toBe('added');
    });
  });

  describe('cardId の保持', () => {
    it('cardId がある場合は差分に含まれる', () => {
      const before: CardEntry[] = [];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', cardId: 'card-123', category: 'pokemon', count: 2 },
      ];

      const diff = calculateDiff(before, after);

      expect(diff[0].cardId).toBe('card-123');
    });
  });
});

// =============================================================================
// Test: hasDiff
// =============================================================================

describe('DiffService.hasDiff', () => {
  it('変更がある場合はtrueを返す', () => {
    const before: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const after: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];

    expect(hasDiff(before, after)).toBe(true);
  });

  it('変更がない場合はfalseを返す', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    expect(hasDiff(cards, cards)).toBe(false);
  });

  it('配列の順序が違っても内容が同じならfalseを返す', () => {
    // 意図: 順序変更は差分とみなさない
    const before: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
    ];
    const after: CardEntry[] = [
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    expect(hasDiff(before, after)).toBe(false);
  });

  it('カードが追加された場合はtrueを返す', () => {
    const before: CardEntry[] = [];
    const after: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 1 },
    ];

    expect(hasDiff(before, after)).toBe(true);
  });

  it('カードが削除された場合はtrueを返す', () => {
    const before: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 1 },
    ];
    const after: CardEntry[] = [];

    expect(hasDiff(before, after)).toBe(true);
  });

  it('両方空の場合はfalseを返す', () => {
    expect(hasDiff([], [])).toBe(false);
  });
});

// =============================================================================
// Test: applyDiff
// =============================================================================

describe('DiffService.applyDiff', () => {
  it('追加差分を適用するとカードが増える', () => {
    // 意図: 差分から状態を再構築できる
    const base: CardEntry[] = [];
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
    ];

    const result = applyDiff(base, diff);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('削除差分を適用するとカードが減る', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'removed',
        beforeCount: 2,
      },
    ];

    const result = applyDiff(base, diff);

    expect(result).toHaveLength(0);
  });

  it('変更差分を適用すると枚数が更新される', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4,
      },
    ];

    const result = applyDiff(base, diff);

    expect(result[0].count).toBe(4);
  });

  it('複数の差分を同時に適用できる', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4,
      },
      { cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 },
    ];

    const result = applyDiff(base, diff);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.cardName === 'ピカチュウex')?.count).toBe(4);
    expect(result.find((c) => c.cardName === 'ミュウex')?.count).toBe(1);
  });

  it('元の配列は変更されない（イミュータブル）', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4,
      },
    ];

    applyDiff(base, diff);

    expect(base[0].count).toBe(2);
  });

  describe('可逆性の検証', () => {
    it('calculateDiff → applyDiff で元の状態に戻る', () => {
      // 意図: 差分計算と適用の整合性を保証
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ミュウex', category: 'pokemon', count: 1 },
      ];

      const diff = calculateDiff(before, after);
      const reconstructed = applyDiff(before, diff);

      // 名前でソートして比較
      const sortedAfter = [...after].sort((a, b) =>
        a.cardName.localeCompare(b.cardName)
      );
      const sortedReconstructed = [...reconstructed].sort((a, b) =>
        a.cardName.localeCompare(b.cardName)
      );

      expect(sortedReconstructed).toEqual(sortedAfter);
    });

    it('複雑な変更でも可逆性が保たれる', () => {
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 2 },
        { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
        { cardName: 'ミュウex', category: 'pokemon', count: 3 },
        { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
        { cardName: '基本雷エネルギー', category: 'energy', count: 10 },
      ];

      const diff = calculateDiff(before, after);
      const reconstructed = applyDiff(before, diff);

      const sortedAfter = [...after].sort((a, b) =>
        a.cardName.localeCompare(b.cardName)
      );
      const sortedReconstructed = [...reconstructed].sort((a, b) =>
        a.cardName.localeCompare(b.cardName)
      );

      expect(sortedReconstructed).toEqual(sortedAfter);
    });
  });
});

// =============================================================================
// Test: applyDiffs
// =============================================================================

describe('DiffService.applyDiffs', () => {
  it('複数の差分を順番に適用する', () => {
    const base: CardEntry[] = [];
    const diffs: DiffEntry[][] = [
      [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 }],
      [
        {
          cardName: 'ピカチュウex',
          category: 'pokemon',
          type: 'changed',
          beforeCount: 2,
          afterCount: 4,
        },
      ],
      [{ cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 }],
    ];

    const result = applyDiffs(base, diffs);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.cardName === 'ピカチュウex')?.count).toBe(4);
    expect(result.find((c) => c.cardName === 'ミュウex')?.count).toBe(1);
  });

  it('空の差分配列を渡すと元の状態が返る', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];

    const result = applyDiffs(base, []);

    expect(result).toEqual(base);
  });
});

// =============================================================================
// Test: reverseDiff
// =============================================================================

describe('DiffService.reverseDiff', () => {
  it('追加の逆適用で削除になる', () => {
    const current: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
    ];
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
    ];

    const result = reverseDiff(current, diff);

    expect(result).toHaveLength(0);
  });

  it('削除の逆適用で追加になる', () => {
    const current: CardEntry[] = [];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'removed',
        beforeCount: 2,
      },
    ];

    const result = reverseDiff(current, diff);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('変更の逆適用で元の枚数に戻る', () => {
    const current: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
    ];
    const diff: DiffEntry[] = [
      {
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4,
      },
    ];

    const result = reverseDiff(current, diff);

    expect(result[0].count).toBe(2);
  });
});
