# pokecavers 実装タスク一覧

**作成者:** Team Leader Agent
**対象:** 開発チーム

---

## 1. タスク優先度定義

| 優先度 | 記号 | 説明 |
|--------|------|------|
| P0 | 🔴 | ブロッカー。これがないと他が進まない |
| P1 | 🟠 | コア機能。MVP必須 |
| P2 | 🟡 | 重要機能。MVP望ましい |
| P3 | 🟢 | 改善項目。MVP後でも可 |

---

## 2. 実装ユニット一覧

### Phase 1: プロジェクト基盤構築

#### TASK-001: プロジェクト初期化 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | Vite + React + TypeScript プロジェクトのセットアップ |
| 成果物 | 動作するボイラープレート |
| 依存 | なし |
| 担当 | - |

**実装内容:**
```
src/
├── main.tsx
├── App.tsx
├── vite-env.d.ts
├── index.css
tsconfig.json
vite.config.ts
package.json
```

**完了条件:**
- [ ] `npm run dev` で開発サーバー起動
- [ ] `npm run build` でビルド成功
- [ ] TypeScript エラーなし

---

#### TASK-002: Tailwind CSS 導入 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | Tailwind CSS のセットアップとベーススタイル定義 |
| 成果物 | tailwind.config.js, グローバルスタイル |
| 依存 | TASK-001 |

**実装内容:**
- Tailwind CSS インストール・設定
- カラーパレット定義（iOS風）
- フォント設定（system-ui）
- ダークモード対応準備（prefers-color-scheme）

**完了条件:**
- [ ] Tailwind クラスが適用される
- [ ] カスタムカラー定義済み

---

#### TASK-003: 共通UIコンポーネント 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | 再利用可能な基本コンポーネント作成 |
| 成果物 | src/components/ui/ 配下 |
| 依存 | TASK-002 |

**実装内容:**
```
src/components/ui/
├── Button.tsx          # プライマリ/セカンダリ/デンジャー
├── Input.tsx           # テキスト入力
├── Select.tsx          # ドロップダウン
├── Card.tsx            # カードコンテナ
├── Modal.tsx           # モーダルダイアログ
├── Toast.tsx           # 通知トースト
├── Spinner.tsx         # ローディングスピナー
├── Skeleton.tsx        # スケルトンローダー
└── index.ts            # バレルエクスポート
```

**完了条件:**
- [ ] 各コンポーネントが独立して動作
- [ ] Storybook or サンプルページで確認可能

---

#### TASK-004: Firebase プロジェクト設定 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | Firebase SDK 導入と初期設定 |
| 成果物 | src/lib/firebase.ts |
| 依存 | TASK-001 |

**実装内容:**
```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = { /* 環境変数から読み込み */ };

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// オフライン永続化
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Offline persistence failed:', err);
});
```

**完了条件:**
- [ ] Firebase コンソールでプロジェクト作成済み
- [ ] 環境変数 (.env.local) 設定済み
- [ ] Firestore 接続確認

---

#### TASK-005: Anonymous Auth 実装 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | 匿名認証の自動サインインとUID管理 |
| 成果物 | src/services/AuthService.ts, src/stores/authStore.ts |
| 依存 | TASK-004 |

**実装内容:**
```typescript
// src/services/AuthService.ts
export const AuthService = {
  async signInAnonymously(): Promise<string> { /* UID返却 */ },
  getCurrentUserId(): string | null { /* 現在のUID */ },
  onAuthStateChanged(callback: (uid: string | null) => void): Unsubscribe,
};

// src/stores/authStore.ts
interface AuthState {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

**完了条件:**
- [ ] アプリ起動時に自動サインイン
- [ ] リロード後も同じUIDを維持
- [ ] AuthStore で状態管理

---

#### TASK-006: Firestore セキュリティルール 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | セキュリティルールの定義とデプロイ |
| 成果物 | firestore.rules |
| 依存 | TASK-004, TASK-005 |

**実装内容:**
- 設計書 Section 1.5 のルールを実装
- Firebase CLI でデプロイ

**完了条件:**
- [ ] ルールがデプロイ済み
- [ ] 他ユーザーのデッキにアクセス不可を確認

---

#### TASK-007: React Router 設定 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | ルーティングとレイアウト設定 |
| 成果物 | src/routes/, src/layouts/ |
| 依存 | TASK-001 |

**実装内容:**
```typescript
// src/routes/index.tsx
const routes = [
  { path: '/', element: <DeckListPage /> },
  { path: '/decks/new', element: <DeckCreatePage /> },
  { path: '/decks/:id', element: <DeckDetailPage /> },
  { path: '/decks/:id/edit', element: <DeckEditPage /> },
  { path: '/decks/:id/commit', element: <CommitPage /> },
  { path: '/decks/:id/history', element: <HistoryPage /> },
  { path: '/decks/:id/diff/:v1/:v2', element: <DiffPage /> },
];
```

**完了条件:**
- [ ] 全ルートが定義済み
- [ ] 404ページ実装
- [ ] ナビゲーション動作確認

---

#### TASK-008: PWA 設定 🟡 P2

| 項目 | 内容 |
|------|------|
| 概要 | manifest.json と Service Worker 設定 |
| 成果物 | public/manifest.json, vite-plugin-pwa 設定 |
| 依存 | TASK-001 |

**実装内容:**
- vite-plugin-pwa 導入
- アイコン生成（192x192, 512x512）
- オフラインフォールバック

**完了条件:**
- [ ] Lighthouse PWA スコア合格
- [ ] ホーム画面追加可能

---

### Phase 2: デッキ管理機能

#### TASK-010: 型定義 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | ドメインモデルの TypeScript 型定義 |
| 成果物 | src/types/ |
| 依存 | TASK-001 |

**実装内容:**
```typescript
// src/types/index.ts
export interface Deck { ... }
export interface CardEntry { ... }
export interface Version { ... }
export interface DiffEntry { ... }

// src/types/regulation.ts
export type Regulation = 'standard' | 'expanded' | 'unlimited';

// src/types/category.ts
export type CardCategory = 'pokemon' | 'trainer' | 'energy';
```

**完了条件:**
- [ ] 設計書のモデル全て定義
- [ ] エクスポート済み

---

#### TASK-011: DeckService 実装 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | デッキCRUD操作のサービス層 |
| 成果物 | src/services/DeckService.ts |
| 依存 | TASK-004, TASK-005, TASK-010 |

**実装内容:**
```typescript
export const DeckService = {
  // 一覧取得（自分のデッキのみ）
  async getDecks(userId: string): Promise<Deck[]>,

  // 単一取得
  async getDeck(deckId: string): Promise<Deck | null>,

  // 作成（Version 1も同時作成）
  async createDeck(userId: string, data: CreateDeckInput): Promise<string>,

  // 更新
  async updateDeck(deckId: string, data: UpdateDeckInput): Promise<void>,

  // 削除（カスケード）
  async deleteDeck(deckId: string): Promise<void>,
};
```

**完了条件:**
- [ ] 全メソッド実装
- [ ] Batched Write 使用
- [ ] エラーハンドリング

---

#### TASK-012: DeckStore 実装 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | デッキ状態管理（Zustand） |
| 成果物 | src/stores/deckStore.ts |
| 依存 | TASK-011 |

**実装内容:**
```typescript
interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDecks: () => Promise<void>;
  fetchDeck: (id: string) => Promise<void>;
  createDeck: (data: CreateDeckInput) => Promise<string>;
  deleteDeck: (id: string) => Promise<void>;
}
```

**完了条件:**
- [ ] 状態更新が正しく動作
- [ ] ローディング状態管理
- [ ] エラー状態管理

---

#### TASK-013: デッキ一覧画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | デッキリストの表示UI |
| 成果物 | src/pages/DeckListPage.tsx |
| 依存 | TASK-003, TASK-012 |

**実装内容:**
- デッキカードリスト
- 空状態表示（「デッキがありません」）
- FAB（新規作成ボタン）
- プルトゥリフレッシュ

**完了条件:**
- [ ] デッキ一覧表示
- [ ] 空状態表示
- [ ] 新規作成への遷移

---

#### TASK-014: デッキ作成画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | 新規デッキ作成フォーム |
| 成果物 | src/pages/DeckCreatePage.tsx |
| 依存 | TASK-003, TASK-011 |

**実装内容:**
- デッキ名入力
- レギュレーション選択
- メモ入力（任意）
- 作成ボタン

**完了条件:**
- [ ] フォームバリデーション
- [ ] 作成後にデッキ詳細へ遷移
- [ ] Version 1 自動作成確認

---

#### TASK-015: デッキ詳細画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | デッキ内容と履歴サマリ表示 |
| 成果物 | src/pages/DeckDetailPage.tsx |
| 依存 | TASK-013 |

**実装内容:**
- デッキ基本情報
- カード一覧（カテゴリ別）
- 最新3件の履歴サマリ
- 編集ボタン、履歴ボタン、削除ボタン

**完了条件:**
- [ ] カード表示（枚数付き）
- [ ] 履歴サマリ表示
- [ ] 各アクションへの遷移

---

#### TASK-016: デッキ削除機能 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | 確認ダイアログ付きの削除機能 |
| 成果物 | src/components/DeleteConfirmDialog.tsx |
| 依存 | TASK-003, TASK-011 |

**実装内容:**
- 確認ダイアログ
- 「デッキ名を入力して削除」パターン
- カスケード削除実行

**完了条件:**
- [ ] 誤削除防止
- [ ] 削除後に一覧へ遷移
- [ ] 関連Version全削除

---

### Phase 3: カード編集機能

#### TASK-020: CardEntry 操作ユーティリティ 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | カード配列の操作ヘルパー関数 |
| 成果物 | src/utils/cardUtils.ts |
| 依存 | TASK-010 |

**実装内容:**
```typescript
export const cardUtils = {
  // カード追加（既存なら枚数増加）
  addCard(cards: CardEntry[], card: Omit<CardEntry, 'count'>): CardEntry[],

  // カード削除
  removeCard(cards: CardEntry[], cardName: string): CardEntry[],

  // 枚数変更
  updateCount(cards: CardEntry[], cardName: string, count: number): CardEntry[],

  // 合計枚数計算
  getTotalCount(cards: CardEntry[]): number,

  // 同名カード枚数取得
  getCardCount(cards: CardEntry[], cardName: string): number,

  // カテゴリ別グループ化
  groupByCategory(cards: CardEntry[]): Record<CardCategory, CardEntry[]>,
};
```

**完了条件:**
- [ ] 全関数実装
- [ ] イミュータブル操作
- [ ] 単体テスト合格

---

#### TASK-021: バリデーションロジック 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | デッキルールのバリデーション |
| 成果物 | src/utils/validation.ts |
| 依存 | TASK-010, TASK-020 |

**実装内容:**
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  code: 'DECK_OVER_60' | 'CARD_OVER_4' | 'MESSAGE_REQUIRED';
  message: string;
  field?: string;
}

export const validation = {
  validateDeck(cards: CardEntry[]): ValidationResult,
  validateCardAddition(cards: CardEntry[], newCard: CardEntry): ValidationResult,
  validateCommitMessage(message: string): ValidationResult,
  isBasicEnergy(cardName: string): boolean,
};
```

**完了条件:**
- [ ] 60枚制限チェック
- [ ] 同名4枚制限チェック（基本エネルギー除外）
- [ ] メッセージ必須チェック
- [ ] 単体テスト合格

---

#### TASK-022: デッキ編集画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | カードの追加・削除・枚数変更UI |
| 成果物 | src/pages/DeckEditPage.tsx |
| 依存 | TASK-020, TASK-021 |

**実装内容:**
- カード追加フォーム
- カード一覧（編集可能）
- 枚数カウンター（+/-）
- 削除ボタン/スワイプ
- 変更プレビュー
- コミットへ進むボタン

**完了条件:**
- [ ] カード操作が正常動作
- [ ] バリデーションエラー表示
- [ ] 変更ありの場合のみコミット可能

---

#### TASK-023: カード入力コンポーネント 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | カード名入力とカテゴリ選択 |
| 成果物 | src/components/CardInputForm.tsx |
| 依存 | TASK-003 |

**実装内容:**
- カード名テキスト入力
- カテゴリ選択（ポケモン/トレーナー/エネルギー）
- 追加ボタン
- 入力クリア

**完了条件:**
- [ ] 必須項目バリデーション
- [ ] 追加後に入力クリア

---

#### TASK-024: カードリストコンポーネント 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | カテゴリ別カード一覧表示 |
| 成果物 | src/components/CardList.tsx |
| 依存 | TASK-020 |

**実装内容:**
- カテゴリ別セクション
- カード行（名前、枚数、操作ボタン）
- 合計枚数表示

**完了条件:**
- [ ] カテゴリ別グループ表示
- [ ] 各カードの枚数表示

---

#### TASK-025: 枚数カウンターコンポーネント 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | +/- ボタン付き枚数変更UI |
| 成果物 | src/components/CounterButton.tsx |
| 依存 | TASK-003 |

**実装内容:**
- "-" ボタン（1未満で無効化）
- 現在枚数表示
- "+" ボタン（上限で無効化）
- 長押しで連続増減

**完了条件:**
- [ ] 範囲外で無効化
- [ ] タッチフィードバック

---

### Phase 4: バージョン管理機能

#### TASK-030: DiffService 実装 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | 差分計算ロジック |
| 成果物 | src/services/DiffService.ts |
| 依存 | TASK-010 |

**実装内容:**
```typescript
export const DiffService = {
  // 2つのカード配列から差分を計算
  calculateDiff(before: CardEntry[], after: CardEntry[]): DiffEntry[],

  // 差分があるかどうか
  hasDiff(before: CardEntry[], after: CardEntry[]): boolean,

  // 差分を適用して新しい状態を生成
  applyDiff(base: CardEntry[], diff: DiffEntry[]): CardEntry[],

  // 複数の差分を順に適用
  applyDiffs(base: CardEntry[], diffs: DiffEntry[][]): CardEntry[],
};
```

**完了条件:**
- [ ] 追加・削除・変更を正しく検出
- [ ] applyDiff の可逆性確認
- [ ] 単体テスト合格

---

#### TASK-031: VersionService 実装 🔴 P0

| 項目 | 内容 |
|------|------|
| 概要 | バージョンCRUDと状態復元 |
| 成果物 | src/services/VersionService.ts |
| 依存 | TASK-011, TASK-030 |

**実装内容:**
```typescript
export const VersionService = {
  // バージョン一覧取得
  async getVersions(deckId: string): Promise<Version[]>,

  // 単一バージョン取得
  async getVersion(deckId: string, versionId: string): Promise<Version | null>,

  // コミット（Deck更新 + Version作成）
  async commit(deckId: string, newCards: CardEntry[], message: string): Promise<void>,

  // 特定バージョン時点のデッキ状態を復元
  async reconstructState(deckId: string, versionNumber: number): Promise<CardEntry[]>,
};
```

**完了条件:**
- [ ] Batched Write でアトミック操作
- [ ] versionNumber の自動採番
- [ ] 状態復元の正確性

---

#### TASK-032: コミット画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | 差分プレビューとメッセージ入力 |
| 成果物 | src/pages/CommitPage.tsx |
| 依存 | TASK-030, TASK-031 |

**実装内容:**
- 差分プレビュー表示
- 修正メッセージ入力（テキストエリア）
- コミットボタン
- キャンセルボタン

**完了条件:**
- [ ] 差分が色分け表示
- [ ] メッセージ必須バリデーション
- [ ] コミット後にデッキ詳細へ遷移

---

#### TASK-033: 履歴一覧画面 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | バージョン履歴のタイムライン表示 |
| 成果物 | src/pages/HistoryPage.tsx |
| 依存 | TASK-031 |

**実装内容:**
- タイムライン形式のリスト
- バージョン番号、メッセージ、日時
- ページネーション（20件ずつ）
- バージョン詳細への遷移

**完了条件:**
- [ ] 時系列順表示（新しい順）
- [ ] ページネーション動作
- [ ] 100件超でもフリーズしない

---

#### TASK-034: バージョン詳細画面 🟡 P2

| 項目 | 内容 |
|------|------|
| 概要 | 特定バージョン時点のデッキ状態表示 |
| 成果物 | src/pages/VersionDetailPage.tsx |
| 依存 | TASK-031 |

**実装内容:**
- バージョン情報（番号、メッセージ、日時）
- その時点のデッキ構成（復元表示）
- 直前バージョンとの差分表示
- 比較バージョン選択

**完了条件:**
- [ ] 状態復元が正確
- [ ] 差分表示

---

### Phase 5: 差分表示機能

#### TASK-040: 差分表示コンポーネント 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | 差分の視覚的表示 |
| 成果物 | src/components/DiffView.tsx |
| 依存 | TASK-030 |

**実装内容:**
- 追加カード: 緑背景 + "+" アイコン
- 削除カード: 赤背景 + "-" アイコン
- 変更カード: 黄背景 + "2→3" 表示
- カテゴリ別グループ化

**完了条件:**
- [ ] 色分けが明確
- [ ] アクセシビリティ考慮（色だけに依存しない）

---

#### TASK-041: バージョン比較画面 🟡 P2

| 項目 | 内容 |
|------|------|
| 概要 | 任意の2バージョン間の差分表示 |
| 成果物 | src/pages/DiffPage.tsx |
| 依存 | TASK-031, TASK-040 |

**実装内容:**
- バージョン選択UI（from / to）
- 差分計算・表示
- サイドバイサイド or 統合表示

**完了条件:**
- [ ] 任意の2バージョン選択可能
- [ ] 差分が正しく計算

---

#### TASK-042: 状態復元ユーティリティ 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | diffから過去状態を計算するロジック |
| 成果物 | src/utils/stateReconstructor.ts |
| 依存 | TASK-030 |

**実装内容:**
```typescript
export const stateReconstructor = {
  // Version 1 から指定バージョンまでの状態を復元
  reconstruct(versions: Version[], targetVersion: number): CardEntry[],

  // 2バージョン間の累積差分を計算
  accumulateDiff(versions: Version[], from: number, to: number): DiffEntry[],
};
```

**完了条件:**
- [ ] 復元結果の正確性
- [ ] パフォーマンス（100バージョンでも1秒以内）

---

### Phase 7: UI/UX改善

#### TASK-050: エラーハンドリング 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | グローバルエラーハンドリングとToast通知 |
| 成果物 | src/components/ErrorBoundary.tsx, src/components/ToastProvider.tsx |
| 依存 | TASK-003 |

**実装内容:**
- ErrorBoundary（クラッシュ時のフォールバック）
- ToastProvider（通知表示）
- useToast フック

**完了条件:**
- [ ] エラー時にユーザーフレンドリーなメッセージ
- [ ] 自動消去（3秒後）

---

#### TASK-051: ローディング状態 🟠 P1

| 項目 | 内容 |
|------|------|
| 概要 | 各画面のローディング表示 |
| 成果物 | 各ページにスケルトン/スピナー追加 |
| 依存 | TASK-003 |

**実装内容:**
- ページスケルトン
- インラインスピナー
- Suspense 対応

**完了条件:**
- [ ] データ取得中に適切な表示
- [ ] チラつきなし（最低表示時間）

---

#### TASK-052: 複数タブ検出 🟢 P3

| 項目 | 内容 |
|------|------|
| 概要 | 同一デッキの複数タブ編集警告 |
| 成果物 | src/hooks/useTabConflict.ts |
| 依存 | - |

**実装内容:**
- BroadcastChannel API 使用
- 編集開始時に他タブへ通知
- 警告ダイアログ表示

**完了条件:**
- [ ] 複数タブで同一デッキ編集時に警告

---

## 3. 実装順序（推奨）

```
Week 1:
├── TASK-001 プロジェクト初期化
├── TASK-002 Tailwind CSS
├── TASK-004 Firebase設定
├── TASK-005 Anonymous Auth
├── TASK-006 Security Rules
└── TASK-010 型定義

Week 2:
├── TASK-003 共通UIコンポーネント
├── TASK-007 React Router
├── TASK-011 DeckService
├── TASK-012 DeckStore
└── TASK-020 CardUtils

Week 3:
├── TASK-013 デッキ一覧画面
├── TASK-014 デッキ作成画面
├── TASK-015 デッキ詳細画面
├── TASK-016 デッキ削除機能
└── TASK-021 バリデーション

Week 4:
├── TASK-022 デッキ編集画面
├── TASK-023 カード入力
├── TASK-024 カードリスト
├── TASK-025 枚数カウンター
└── TASK-030 DiffService

Week 5:
├── TASK-031 VersionService
├── TASK-032 コミット画面
├── TASK-033 履歴一覧画面
├── TASK-040 差分表示
└── TASK-042 状態復元

Week 6:
├── TASK-034 バージョン詳細
├── TASK-041 バージョン比較
├── TASK-050 エラーハンドリング
├── TASK-051 ローディング
└── TASK-008 PWA設定
```

---

## 4. タスク依存関係図

```
TASK-001 ──┬── TASK-002 ── TASK-003 ──┬── TASK-013
           │                          ├── TASK-014
           │                          ├── TASK-022
           │                          └── TASK-050
           │
           ├── TASK-004 ── TASK-005 ── TASK-006
           │      │
           │      └── TASK-011 ── TASK-012 ── TASK-013
           │             │
           │             └── TASK-031 ── TASK-032
           │
           ├── TASK-007
           │
           └── TASK-010 ── TASK-020 ── TASK-021 ── TASK-022
                  │
                  └── TASK-030 ── TASK-031
                         │
                         └── TASK-040 ── TASK-041
```
