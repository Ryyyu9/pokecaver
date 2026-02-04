# pokecavers ユニットテスト仕様書

**作成者:** Team Leader Agent
**テスト方針:** 意図（Intent）ベースのテスト設計

---

## 1. テスト方針

### 1.1 原則

| 原則 | 説明 |
|------|------|
| 意図を明確に | 「何をテストしているか」ではなく「なぜそれが重要か」を記述 |
| 境界値重視 | エッジケースと境界値を網羅 |
| 失敗ケース優先 | 正常系より異常系を重点的にテスト |
| 独立性 | 各テストは他に依存しない |

### 1.2 テストツール

- **テストランナー:** Vitest
- **アサーション:** Vitest 組み込み
- **モック:** Vitest モック機能
- **コンポーネントテスト:** React Testing Library

### 1.3 ファイル配置

```
src/
├── utils/
│   ├── cardUtils.ts
│   └── cardUtils.test.ts      # 同一ディレクトリに配置
├── services/
│   ├── DiffService.ts
│   └── DiffService.test.ts
└── ...
```

---

## 2. ユーティリティ関数テスト

### 2.1 cardUtils.ts

#### テストスイート: カード追加機能

**意図:** ユーザーがデッキにカードを追加するとき、正しく反映されることを保証する

```typescript
describe('cardUtils.addCard', () => {
  describe('新規カード追加', () => {
    it('空のデッキに新しいカードを追加できる', () => {
      // 意図: デッキ作成直後の空状態からカードを追加できる
      const cards: CardEntry[] = [];
      const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

      const result = cardUtils.addCard(cards, newCard);

      expect(result).toHaveLength(1);
      expect(result[0].cardName).toBe('ピカチュウex');
      expect(result[0].count).toBe(1);
    });

    it('既存カードと異なる名前のカードは別エントリとして追加される', () => {
      // 意図: 異なるカードは区別して管理される
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];
      const newCard = { cardName: 'ライチュウex', category: 'pokemon' as const };

      const result = cardUtils.addCard(cards, newCard);

      expect(result).toHaveLength(2);
    });
  });

  describe('既存カードへの追加', () => {
    it('同名カードを追加すると枚数が増加する', () => {
      // 意図: 同じカードを追加すると枚数が1増える（重複作成しない）
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];
      const newCard = { cardName: 'ピカチュウex', category: 'pokemon' as const };

      const result = cardUtils.addCard(cards, newCard);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(3);
    });
  });

  describe('イミュータビリティ', () => {
    it('元の配列は変更されない', () => {
      // 意図: 状態管理の安全性を保証
      const original: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 1 }
      ];
      const originalCopy = JSON.parse(JSON.stringify(original));

      cardUtils.addCard(original, { cardName: 'ライチュウex', category: 'pokemon' });

      expect(original).toEqual(originalCopy);
    });
  });
});
```

#### テストスイート: カード削除機能

**意図:** ユーザーがデッキからカードを削除したとき、正しく反映されることを保証する

```typescript
describe('cardUtils.removeCard', () => {
  it('指定したカードがデッキから削除される', () => {
    // 意図: 不要になったカードを取り除ける
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      { cardName: 'ライチュウex', category: 'pokemon', count: 1 }
    ];

    const result = cardUtils.removeCard(cards, 'ピカチュウex');

    expect(result).toHaveLength(1);
    expect(result[0].cardName).toBe('ライチュウex');
  });

  it('存在しないカード名を指定しても例外は発生しない', () => {
    // 意図: 防御的プログラミング - 不正入力でクラッシュしない
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    const result = cardUtils.removeCard(cards, '存在しないカード');

    expect(result).toHaveLength(1);
  });
});
```

#### テストスイート: 枚数変更機能

**意図:** ユーザーがカード枚数を変更したとき、正しく反映されることを保証する

```typescript
describe('cardUtils.updateCount', () => {
  it('指定したカードの枚数を変更できる', () => {
    // 意図: 試行錯誤で枚数を調整できる
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    const result = cardUtils.updateCount(cards, 'ピカチュウex', 4);

    expect(result[0].count).toBe(4);
  });

  it('枚数を0にするとカードが削除される', () => {
    // 意図: 0枚 = 削除と同義
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    const result = cardUtils.updateCount(cards, 'ピカチュウex', 0);

    expect(result).toHaveLength(0);
  });

  it('負の枚数は0として扱われる', () => {
    // 意図: 不正入力の防御
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    const result = cardUtils.updateCount(cards, 'ピカチュウex', -1);

    expect(result).toHaveLength(0);
  });
});
```

#### テストスイート: 合計枚数計算

**意図:** デッキ枚数制限を正しく判定するための基盤

```typescript
describe('cardUtils.getTotalCount', () => {
  it('全カードの枚数合計を返す', () => {
    // 意図: 60枚制限チェックの基盤
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
      { cardName: 'ふしぎなアメ', category: 'trainer', count: 4 },
      { cardName: '基本雷エネルギー', category: 'energy', count: 10 }
    ];

    const total = cardUtils.getTotalCount(cards);

    expect(total).toBe(18);
  });

  it('空のデッキは0を返す', () => {
    const result = cardUtils.getTotalCount([]);
    expect(result).toBe(0);
  });
});
```

---

### 2.2 validation.ts

#### テストスイート: デッキバリデーション

**意図:** ポケモンカードゲームのルールに従ったデッキ構築を強制する

```typescript
describe('validation.validateDeck', () => {
  describe('60枚制限', () => {
    it('60枚のデッキは有効', () => {
      // 意図: 正規のデッキサイズを許可
      const cards = createDeckWithTotalCount(60);

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('61枚以上のデッキは無効', () => {
      // 意図: ルール違反を防止
      const cards = createDeckWithTotalCount(61);

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DECK_OVER_60' })
      );
    });

    it('59枚以下のデッキは有効（構築中を許容）', () => {
      // 意図: 構築途中の状態を許可
      const cards = createDeckWithTotalCount(30);

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(true);
    });
  });

  describe('同名4枚制限', () => {
    it('同名カード4枚は有効', () => {
      // 意図: 最大枚数を許可
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 }
      ];

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('同名カード5枚以上は無効', () => {
      // 意図: ルール違反を防止
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 5 }
      ];

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CARD_OVER_4' })
      );
    });

    it('基本エネルギーは5枚以上でも有効', () => {
      // 意図: 基本エネルギーは例外ルール
      const cards: CardEntry[] = [
        { cardName: '基本雷エネルギー', category: 'energy', count: 20 }
      ];

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(true);
    });

    it('特殊エネルギーは4枚制限が適用される', () => {
      // 意図: 特殊エネルギーは基本エネルギーではない
      const cards: CardEntry[] = [
        { cardName: 'ダブルターボエネルギー', category: 'energy', count: 5 }
      ];

      const result = validation.validateDeck(cards);

      expect(result.isValid).toBe(false);
    });
  });
});
```

#### テストスイート: 基本エネルギー判定

**意図:** 基本エネルギーの4枚制限除外ルールを正しく適用する

```typescript
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
      expect(validation.isBasicEnergy(energy)).toBe(true);
    });
  });

  it('ダブルターボエネルギーは基本エネルギーではない', () => {
    expect(validation.isBasicEnergy('ダブルターボエネルギー')).toBe(false);
  });

  it('ジェットエネルギーは基本エネルギーではない', () => {
    expect(validation.isBasicEnergy('ジェットエネルギー')).toBe(false);
  });

  it('「基本」を含まないエネルギーは基本エネルギーではない', () => {
    expect(validation.isBasicEnergy('炎エネルギー')).toBe(false);
  });
});
```

#### テストスイート: コミットメッセージバリデーション

**意図:** 変更理由の記録を強制し、思考ログとしての価値を保証する

```typescript
describe('validation.validateCommitMessage', () => {
  it('空文字は無効', () => {
    // 意図: 理由なしの変更を防止
    const result = validation.validateCommitMessage('');

    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('MESSAGE_REQUIRED');
  });

  it('空白のみは無効', () => {
    // 意図: 実質的に空のメッセージを防止
    const result = validation.validateCommitMessage('   ');

    expect(result.isValid).toBe(false);
  });

  it('1文字以上のメッセージは有効', () => {
    // 意図: 最小限の記録を許可
    const result = validation.validateCommitMessage('調整');

    expect(result.isValid).toBe(true);
  });

  it('改行を含むメッセージは有効', () => {
    // 意図: 詳細な説明を許可
    const result = validation.validateCommitMessage('理由1\n理由2');

    expect(result.isValid).toBe(true);
  });
});
```

---

## 3. サービス層テスト

### 3.1 DiffService.ts

#### テストスイート: 差分計算

**意図:** デッキの変更を正確に検出し、履歴として記録可能にする

```typescript
describe('DiffService.calculateDiff', () => {
  describe('カード追加の検出', () => {
    it('新しいカードの追加を検出する', () => {
      // 意図: 新規投入カードを履歴に残す
      const before: CardEntry[] = [];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];

      const diff = DiffService.calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'added',
        afterCount: 2
      });
    });
  });

  describe('カード削除の検出', () => {
    it('カードの完全削除を検出する', () => {
      // 意図: 採用をやめたカードを履歴に残す
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];
      const after: CardEntry[] = [];

      const diff = DiffService.calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'removed',
        beforeCount: 2
      });
    });
  });

  describe('枚数変更の検出', () => {
    it('カード枚数の増加を検出する', () => {
      // 意図: 枚数調整を履歴に残す
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 }
      ];

      const diff = DiffService.calculateDiff(before, after);

      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        cardName: 'ピカチュウex',
        category: 'pokemon',
        type: 'changed',
        beforeCount: 2,
        afterCount: 4
      });
    });

    it('カード枚数の減少を検出する', () => {
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 }
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];

      const diff = DiffService.calculateDiff(before, after);

      expect(diff[0].type).toBe('changed');
      expect(diff[0].beforeCount).toBe(4);
      expect(diff[0].afterCount).toBe(2);
    });
  });

  describe('変更なしの検出', () => {
    it('変更がない場合は空配列を返す', () => {
      // 意図: 不要なバージョン作成を防止
      const cards: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];

      const diff = DiffService.calculateDiff(cards, cards);

      expect(diff).toHaveLength(0);
    });
  });

  describe('複合変更の検出', () => {
    it('追加・削除・変更が混在する場合も正しく検出する', () => {
      // 意図: 複雑な編集も正確に記録
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
        { cardName: 'ライチュウex', category: 'pokemon', count: 1 }
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ミュウex', category: 'pokemon', count: 1 }
      ];

      const diff = DiffService.calculateDiff(before, after);

      expect(diff).toHaveLength(3);
      expect(diff.find(d => d.cardName === 'ピカチュウex')?.type).toBe('changed');
      expect(diff.find(d => d.cardName === 'ライチュウex')?.type).toBe('removed');
      expect(diff.find(d => d.cardName === 'ミュウex')?.type).toBe('added');
    });
  });
});
```

#### テストスイート: 差分適用

**意図:** 保存された差分から過去のデッキ状態を正確に復元する

```typescript
describe('DiffService.applyDiff', () => {
  it('追加差分を適用するとカードが増える', () => {
    // 意図: 差分から状態を再構築できる
    const base: CardEntry[] = [];
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 }
    ];

    const result = DiffService.applyDiff(base, diff);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('削除差分を適用するとカードが減る', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'removed', beforeCount: 2 }
    ];

    const result = DiffService.applyDiff(base, diff);

    expect(result).toHaveLength(0);
  });

  it('変更差分を適用すると枚数が更新される', () => {
    const base: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'changed', beforeCount: 2, afterCount: 4 }
    ];

    const result = DiffService.applyDiff(base, diff);

    expect(result[0].count).toBe(4);
  });

  describe('可逆性の検証', () => {
    it('calculateDiff → applyDiff で元の状態に戻る', () => {
      // 意図: 差分計算と適用の整合性を保証
      const before: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
      ];
      const after: CardEntry[] = [
        { cardName: 'ピカチュウex', category: 'pokemon', count: 4 },
        { cardName: 'ミュウex', category: 'pokemon', count: 1 }
      ];

      const diff = DiffService.calculateDiff(before, after);
      const reconstructed = DiffService.applyDiff(before, diff);

      expect(reconstructed).toEqual(after);
    });
  });
});
```

#### テストスイート: 差分有無判定

**意図:** 変更がない場合のコミットを防止する

```typescript
describe('DiffService.hasDiff', () => {
  it('変更がある場合はtrueを返す', () => {
    const before: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];
    const after: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 4 }
    ];

    expect(DiffService.hasDiff(before, after)).toBe(true);
  });

  it('変更がない場合はfalseを返す', () => {
    const cards: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    expect(DiffService.hasDiff(cards, cards)).toBe(false);
  });

  it('配列の順序が違っても内容が同じならfalseを返す', () => {
    // 意図: 順序変更は差分とみなさない
    const before: CardEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 },
      { cardName: 'ミュウex', category: 'pokemon', count: 1 }
    ];
    const after: CardEntry[] = [
      { cardName: 'ミュウex', category: 'pokemon', count: 1 },
      { cardName: 'ピカチュウex', category: 'pokemon', count: 2 }
    ];

    expect(DiffService.hasDiff(before, after)).toBe(false);
  });
});
```

---

### 3.2 stateReconstructor.ts

#### テストスイート: 状態復元

**意図:** 任意のバージョン時点のデッキ状態を正確に復元する

```typescript
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
          { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 4 }
        ],
        createdAt: new Date()
      }
    ];

    const result = stateReconstructor.reconstruct(versions, 1);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(4);
  });

  it('Version 3 の状態を復元できる（差分を順に適用）', () => {
    // 意図: 累積的な変更を正しく適用
    const versions: Version[] = [
      {
        id: 'v1', deckId: 'deck1', versionNumber: 1, message: 'デッキを作成',
        diff: [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 }],
        createdAt: new Date()
      },
      {
        id: 'v2', deckId: 'deck1', versionNumber: 2, message: '枚数調整',
        diff: [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'changed', beforeCount: 2, afterCount: 4 }],
        createdAt: new Date()
      },
      {
        id: 'v3', deckId: 'deck1', versionNumber: 3, message: 'ミュウ追加',
        diff: [{ cardName: 'ミュウex', category: 'pokemon', type: 'added', afterCount: 1 }],
        createdAt: new Date()
      }
    ];

    const result = stateReconstructor.reconstruct(versions, 3);

    expect(result).toHaveLength(2);
    expect(result.find(c => c.cardName === 'ピカチュウex')?.count).toBe(4);
    expect(result.find(c => c.cardName === 'ミュウex')?.count).toBe(1);
  });

  it('中間バージョンの状態を復元できる', () => {
    // 意図: 任意の時点にさかのぼれる
    const versions: Version[] = [
      {
        id: 'v1', deckId: 'deck1', versionNumber: 1, message: 'デッキを作成',
        diff: [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 }],
        createdAt: new Date()
      },
      {
        id: 'v2', deckId: 'deck1', versionNumber: 2, message: '枚数調整',
        diff: [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'changed', beforeCount: 2, afterCount: 4 }],
        createdAt: new Date()
      },
      {
        id: 'v3', deckId: 'deck1', versionNumber: 3, message: '枚数調整',
        diff: [{ cardName: 'ピカチュウex', category: 'pokemon', type: 'changed', beforeCount: 4, afterCount: 3 }],
        createdAt: new Date()
      }
    ];

    const resultV2 = stateReconstructor.reconstruct(versions, 2);

    expect(resultV2[0].count).toBe(4); // V3の変更は含まれない
  });

  it('存在しないバージョンを指定すると空配列を返す', () => {
    // 意図: 不正な入力に対する防御
    const versions: Version[] = [];

    const result = stateReconstructor.reconstruct(versions, 5);

    expect(result).toEqual([]);
  });
});
```

---

## 4. コンポーネントテスト

### 4.1 CounterButton.tsx

**意図:** ユーザーが直感的に枚数を調整できることを保証する

```typescript
describe('CounterButton', () => {
  it('現在の枚数が表示される', () => {
    render(<CounterButton value={3} onChange={() => {}} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('+ボタンをクリックすると枚数が1増える', async () => {
    const handleChange = vi.fn();
    render(<CounterButton value={2} onChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: '+' }));

    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('-ボタンをクリックすると枚数が1減る', async () => {
    const handleChange = vi.fn();
    render(<CounterButton value={2} onChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: '-' }));

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('枚数が1のとき-ボタンは無効化される', () => {
    // 意図: 0枚未満にできない
    render(<CounterButton value={1} onChange={() => {}} min={1} />);

    expect(screen.getByRole('button', { name: '-' })).toBeDisabled();
  });

  it('枚数が上限のとき+ボタンは無効化される', () => {
    // 意図: 4枚制限を超えられない
    render(<CounterButton value={4} onChange={() => {}} max={4} />);

    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });
});
```

### 4.2 DiffView.tsx

**意図:** 変更内容が視覚的に明確に区別できることを保証する

```typescript
describe('DiffView', () => {
  it('追加カードは緑色で表示される', () => {
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'added', afterCount: 2 }
    ];

    render(<DiffView diff={diff} />);

    const item = screen.getByText('ピカチュウex').closest('[data-testid="diff-item"]');
    expect(item).toHaveClass('bg-green-100');
  });

  it('削除カードは赤色で表示される', () => {
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'removed', beforeCount: 2 }
    ];

    render(<DiffView diff={diff} />);

    const item = screen.getByText('ピカチュウex').closest('[data-testid="diff-item"]');
    expect(item).toHaveClass('bg-red-100');
  });

  it('変更カードは黄色で表示され、枚数変化が表示される', () => {
    const diff: DiffEntry[] = [
      { cardName: 'ピカチュウex', category: 'pokemon', type: 'changed', beforeCount: 2, afterCount: 4 }
    ];

    render(<DiffView diff={diff} />);

    expect(screen.getByText('2→4')).toBeInTheDocument();
    const item = screen.getByText('ピカチュウex').closest('[data-testid="diff-item"]');
    expect(item).toHaveClass('bg-yellow-100');
  });

  it('差分がない場合は「変更なし」と表示される', () => {
    render(<DiffView diff={[]} />);

    expect(screen.getByText('変更なし')).toBeInTheDocument();
  });
});
```

---

## 5. テストカバレッジ目標

| カテゴリ | 目標カバレッジ | 優先度 |
|----------|----------------|--------|
| ユーティリティ関数 | 100% | 必須 |
| サービス層（ロジック） | 90%+ | 必須 |
| Zustand Store | 80%+ | 高 |
| UIコンポーネント | 70%+ | 中 |
| ページコンポーネント | 50%+ | 低（E2Eでカバー） |

---

## 6. テスト実行コマンド

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage

# 特定ファイルのみ
npm run test -- cardUtils.test.ts
```
