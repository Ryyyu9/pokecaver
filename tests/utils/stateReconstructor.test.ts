/**
 * pokecavers - State Reconstructor Tests
 * Intent-based testing following docs/40_unit_test_specs.md
 */

import { describe, it, expect } from 'vitest';
import {
  reconstruct,
  accumulateDiff,
  hasVersion,
  getLatestVersionNumber,
} from '../../src/utils/stateReconstructor';
import type { Version, CardEntry } from '../../src/types';

// =============================================================================
// Test: reconstruct
// =============================================================================

describe('stateReconstructor.reconstruct', () => {
  it('Version 1 の状態を復元できる', () => {
    // 意図: 初期状態を復元
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 4 },
        ],
        createdAt: new Date(),
      },
    ];

    const result = reconstruct(versions, 1);

    expect(result).toHaveLength(1);
    expect(result[0].cardName).toBe('ピカチュウex');
    expect(result[0].count).toBe(4);
  });

  it('Version 3 の状態を復元できる（差分を順に適用）', () => {
    // 意図: 累積的な変更を正しく適用
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: '枚数調整',
        diff: [
          {
            cardName: 'ピカチュウex',
            category: 'pokemon',
            type: 'changed',
            beforeCount: 2,
            afterCount: 4,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v3',
        deckId: 'deck1',
        versionNumber: 3,
        message: 'ミュウ追加',
        diff: [
          { cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 },
        ],
        createdAt: new Date(),
      },
    ];

    const result = reconstruct(versions, 3);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.cardName === 'ピカチュウex')?.count).toBe(4);
    expect(result.find((c) => c.cardName === 'ミュウex')?.count).toBe(1);
  });

  it('中間バージョンの状態を復元できる', () => {
    // 意図: 任意の時点にさかのぼれる
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: '枚数調整',
        diff: [
          {
            cardName: 'ピカチュウex',
            category: 'pokemon',
            type: 'changed',
            beforeCount: 2,
            afterCount: 4,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v3',
        deckId: 'deck1',
        versionNumber: 3,
        message: '枚数調整',
        diff: [
          {
            cardName: 'ピカチュウex',
            category: 'pokemon',
            type: 'changed',
            beforeCount: 4,
            afterCount: 3,
          },
        ],
        createdAt: new Date(),
      },
    ];

    const resultV2 = reconstruct(versions, 2);

    expect(resultV2[0].count).toBe(4); // V3の変更は含まれない
  });

  it('存在しないバージョンを指定すると空配列を返す', () => {
    // 意図: 不正な入力に対する防御
    const versions: Version[] = [];

    const result = reconstruct(versions, 5);

    expect(result).toEqual([]);
  });

  it('バージョン配列がソートされていなくても正しく復元できる', () => {
    // 意図: 入力順序に依存しない
    const versions: Version[] = [
      {
        id: 'v3',
        deckId: 'deck1',
        versionNumber: 3,
        message: 'ミュウ追加',
        diff: [
          { cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: '枚数調整',
        diff: [
          {
            cardName: 'ピカチュウex',
            category: 'pokemon',
            type: 'changed',
            beforeCount: 2,
            afterCount: 4,
          },
        ],
        createdAt: new Date(),
      },
    ];

    const result = reconstruct(versions, 3);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.cardName === 'ピカチュウex')?.count).toBe(4);
  });

  it('削除を含むバージョンを正しく復元できる', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 4 },
          { cardName: 'ライチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: 'ライチュウ削除',
        diff: [
          {
            cardName: 'ライチュウex',
            category: 'pokemon',
            type: 'removed',
            beforeCount: 2,
          },
        ],
        createdAt: new Date(),
      },
    ];

    const resultV1 = reconstruct(versions, 1);
    const resultV2 = reconstruct(versions, 2);

    expect(resultV1).toHaveLength(2);
    expect(resultV2).toHaveLength(1);
    expect(resultV2[0].cardName).toBe('ピカチュウex');
  });

  it('Version 0を指定すると空配列を返す', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 4 },
        ],
        createdAt: new Date(),
      },
    ];

    const result = reconstruct(versions, 0);

    expect(result).toEqual([]);
  });
});

// =============================================================================
// Test: accumulateDiff
// =============================================================================

describe('stateReconstructor.accumulateDiff', () => {
  it('2バージョン間の累積差分を計算する', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: '枚数調整',
        diff: [
          {
            cardName: 'ピカチュウex',
            category: 'pokemon',
            type: 'changed',
            beforeCount: 2,
            afterCount: 4,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v3',
        deckId: 'deck1',
        versionNumber: 3,
        message: 'ミュウ追加',
        diff: [
          { cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 },
        ],
        createdAt: new Date(),
      },
    ];

    const diff = accumulateDiff(versions, 1, 3);

    expect(diff).toHaveLength(2);
    expect(diff.find((d) => d.cardName === 'ピカチュウex')?.type).toBe('changed');
    expect(diff.find((d) => d.cardName === 'ミュウex')?.type).toBe('added');
  });

  it('同じバージョン間の差分は空', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
    ];

    const diff = accumulateDiff(versions, 1, 1);

    expect(diff).toHaveLength(0);
  });

  it('逆方向（新→旧）の差分も計算できる', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 },
        ],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: 'ミュウ追加',
        diff: [
          { cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 },
        ],
        createdAt: new Date(),
      },
    ];

    const diff = accumulateDiff(versions, 2, 1);

    expect(diff.find((d) => d.cardName === 'ミュウex')?.type).toBe('removed');
  });
});

// =============================================================================
// Test: hasVersion
// =============================================================================

describe('stateReconstructor.hasVersion', () => {
  const versions: Version[] = [
    {
      id: 'v1',
      deckId: 'deck1',
      versionNumber: 1,
      message: 'デッキを作成',
      diff: [],
      createdAt: new Date(),
    },
    {
      id: 'v2',
      deckId: 'deck1',
      versionNumber: 2,
      message: '更新',
      diff: [],
      createdAt: new Date(),
    },
  ];

  it('存在するバージョンはtrueを返す', () => {
    expect(hasVersion(versions, 1)).toBe(true);
    expect(hasVersion(versions, 2)).toBe(true);
  });

  it('存在しないバージョンはfalseを返す', () => {
    expect(hasVersion(versions, 3)).toBe(false);
    expect(hasVersion(versions, 0)).toBe(false);
  });

  it('空の配列はfalseを返す', () => {
    expect(hasVersion([], 1)).toBe(false);
  });
});

// =============================================================================
// Test: getLatestVersionNumber
// =============================================================================

describe('stateReconstructor.getLatestVersionNumber', () => {
  it('最新バージョン番号を返す', () => {
    const versions: Version[] = [
      {
        id: 'v1',
        deckId: 'deck1',
        versionNumber: 1,
        message: 'デッキを作成',
        diff: [],
        createdAt: new Date(),
      },
      {
        id: 'v3',
        deckId: 'deck1',
        versionNumber: 3,
        message: '更新',
        diff: [],
        createdAt: new Date(),
      },
      {
        id: 'v2',
        deckId: 'deck1',
        versionNumber: 2,
        message: '更新',
        diff: [],
        createdAt: new Date(),
      },
    ];

    expect(getLatestVersionNumber(versions)).toBe(3);
  });

  it('空の配列は0を返す', () => {
    expect(getLatestVersionNumber([])).toBe(0);
  });

  it('1つのバージョンのみでも正しく返す', () => {
    const versions: Version[] = [
      {
        id: 'v5',
        deckId: 'deck1',
        versionNumber: 5,
        message: '更新',
        diff: [],
        createdAt: new Date(),
      },
    ];

    expect(getLatestVersionNumber(versions)).toBe(5);
  });
});
