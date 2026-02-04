# pokecavers 設計書 (v2.0)

**更新履歴:**
- v1.0: 初版作成
- v2.0: Tech Lead Review / Owner Review の指摘を反映

---

## 1. High-Level Design（高レベル設計）

### 1.1 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (PWA)                                 │
│                      React + TypeScript + Vite                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        UI Layer                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │  Deck   │ │ Version │ │  Diff   │ │ History │ │  Card   │ │  │
│  │  │  List   │ │ Commit  │ │ Viewer  │ │Timeline │ │ Search  │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    State Management                            │  │
│  │                        Zustand                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ DeckStore   │  │ AuthStore   │  │ UIStore     │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ DeckService │  │ AuthService │  │ DiffService │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Firestore SDK (with Offline Persistence)          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Firebase Backend                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Firestore     │  │  Anonymous Auth │  │ Cloud Storage   │     │
│  │   (Database)    │  │   (認証)         │  │ (カード画像)     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│           │                    │                     │              │
│           ▼                    ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Security Rules                              │   │
│  │  - ユーザーは自分のデッキのみ読み書き可能                      │   │
│  │  - カードマスタは全ユーザー読み取り可能                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 インフラストラクチャ詳細

#### Frontend Stack
| 技術 | 用途 | 選定理由 |
|------|------|----------|
| Vite | ビルドツール | 高速HMR、ESM対応 |
| React 18 | UIフレームワーク | エコシステム充実 |
| TypeScript | 型安全性 | バグ防止、IDE支援 |
| Zustand | 状態管理 | 軽量、TypeScript親和性高 |
| Tailwind CSS | スタイリング | ユーティリティファースト |
| React Router v6 | ルーティング | 標準的選択 |

#### Backend Stack (Firebase)
| サービス | 用途 | 設定 |
|----------|------|------|
| Firestore | データベース | オフライン永続化有効 |
| Anonymous Auth | 認証 | デバイス識別用 |
| Cloud Storage | 画像保存 | カード画像キャッシュ |
| Hosting | 静的配信 | PWA配信 |

#### オフライン戦略
- **方針:** Firestore 内蔵のオフライン永続化を使用
- **カスタム実装:** 不要（Firestore SDK に委譲）
- **コンフリクト解決:** Last-Write-Wins（Firestore デフォルト）
- **制限事項:** オフライン時は Version 採番を遅延（オンライン復帰後に確定）

---

### 1.3 データモデル

#### Firestore コレクション構造

```
firestore/
├── users/{userId}/
│   └── (将来の拡張用)
├── decks/{deckId}/
│   ├── ... (Deck fields)
│   └── versions/{versionId}/
│       └── ... (Version fields)
└── cardMaster/{cardId}/
    └── ... (CardMaster fields)
```

#### Deck（デッキ）
```typescript
interface Deck {
  id: string;
  userId: string;              // Anonymous Auth UID
  name: string;
  regulation: string;          // 'standard' | 'expanded' | 'unlimited'
  memo?: string;
  currentCards: CardEntry[];
  versionCount: number;        // Version採番用カウンター
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### CardEntry（カードエントリ）
```typescript
interface CardEntry {
  cardName: string;            // プライマリキー（MVP）
  cardId?: string;             // 将来拡張用（カードマスタ連携時）
  category: 'pokemon' | 'trainer' | 'energy';
  count: number;               // 1-4（基本エネルギーは無制限）
  imageUrl?: string;           // カード画像URL（カードマスタから取得）
}
```

#### Version（バージョン）- 差分のみ保存
```typescript
interface Version {
  id: string;
  deckId: string;
  versionNumber: number;
  message: string;             // 修正メッセージ（必須）
  diff: DiffEntry[];           // 差分のみ保存（効率化）
  createdAt: Timestamp;
}
```

#### DiffEntry（差分エントリ）
```typescript
interface DiffEntry {
  cardName: string;
  cardId?: string;
  category: 'pokemon' | 'trainer' | 'energy';
  type: 'added' | 'removed' | 'changed';
  beforeCount?: number;        // type='changed' or 'removed' の場合
  afterCount?: number;         // type='changed' or 'added' の場合
}
```

#### CardMaster（カードマスタ）- 将来拡張
```typescript
interface CardMaster {
  id: string;                  // 公式カードID or 独自ID
  name: string;
  category: 'pokemon' | 'trainer' | 'energy';
  imageUrl: string;            // Cloud Storage URL
  regulation: string[];        // 使用可能レギュレーション
  maxCount: number;            // 最大枚数（通常4、ACE SPEC=1、基本エネ=60）
  // 将来: setCode, rarity, etc.
}
```

---

### 1.4 初期バージョン仕様

| 項目 | 仕様 |
|------|------|
| デッキ作成時 | Version 1 を自動作成 |
| 初期メッセージ | "デッキを作成" (固定文言) |
| diff 内容 | 全カードを `type: 'added'` として記録 |
| versionNumber | 1から開始 |

---

### 1.5 Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // デッキ: 所有者のみアクセス可能
    match /decks/{deckId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;

      // バージョン: 親デッキの所有者のみアクセス可能
      match /versions/{versionId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == get(/databases/$(database)/documents/decks/$(deckId)).data.userId;
      }
    }

    // カードマスタ: 全ユーザー読み取り可能（書き込みは管理者のみ）
    match /cardMaster/{cardId} {
      allow read: if true;
      allow write: if false;  // 管理者のみ（別途設定）
    }
  }
}
```

---

### 1.6 画面構成

| 画面名 | パス | 説明 |
|--------|------|------|
| デッキ一覧 | `/` | 保存済みデッキのリスト表示 |
| デッキ作成 | `/decks/new` | 新規デッキ作成フォーム |
| デッキ詳細 | `/decks/:id` | デッキ内容と履歴サマリ |
| デッキ編集 | `/decks/:id/edit` | カードの追加・削除・枚数変更 |
| コミット | `/decks/:id/commit` | 修正メッセージ入力と差分確認 |
| 履歴一覧 | `/decks/:id/history` | バージョン履歴タイムライン |
| 差分表示 | `/decks/:id/diff/:v1/:v2` | 2バージョン間の差分可視化 |

---

### 1.7 コア機能フロー

```
[デッキ作成]
     │
     ▼
[Version 1 自動作成（message: "デッキを作成"）]
     │
     ▼
[デッキ編集] ←──────────────────┐
     │                          │
     ▼                          │
[変更検出]                      │
     │                          │
     ├─ 変更なし ───→ [編集継続] ─┘
     │
     ├─ 変更あり
     ▼
[コミット画面]
     │
     ▼
[差分プレビュー表示]
     │
     ▼
[メッセージ入力（必須）]
     │
     ▼
[Batched Write: Deck更新 + Version作成]
     │
     ▼
[デッキ詳細へ遷移]
```

---

### 1.8 バリデーションルール（MVP）

| ルール | 内容 | エラーメッセージ |
|--------|------|------------------|
| デッキ枚数 | 合計60枚以下 | "デッキは60枚以下にしてください" |
| 同名制限 | 同名カード4枚以下 | "同名カードは4枚までです" |
| 基本エネルギー | 無制限（60枚制限内） | - |
| メッセージ必須 | 空文字不可 | "変更理由を入力してください" |

**MVP対象外（将来実装）:**
- ACE SPEC 1枚制限
- レギュレーション適合チェック
- 基本ポケモン1枚以上

---

## 2. Coarse Task Breakdown（タスク分解）

### Phase 1: プロジェクト基盤構築

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 1.1 | プロジェクト初期化 | Vite + React + TypeScript | 動作するボイラープレート |
| 1.2 | PWA設定 | manifest.json, Service Worker (Workbox) | オフラインシェル |
| 1.3 | UI基盤構築 | Tailwind CSS, 共通コンポーネント | Button, Card, Input等 |
| 1.4 | Firebase設定 | プロジェクト作成、SDK導入 | firebase.ts 設定ファイル |
| 1.5 | Anonymous Auth実装 | 自動サインイン、UID取得 | AuthService, AuthStore |
| 1.6 | Firestoreセキュリティルール | ルール定義・デプロイ | firestore.rules |
| 1.7 | オフライン永続化設定 | enableIndexedDbPersistence | オフライン動作確認 |
| 1.8 | ルーティング設定 | React Router v6 | 全画面のルート定義 |

### Phase 2: デッキ管理機能

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 2.1 | デッキ一覧画面 | リスト表示、空状態 | DeckListPage |
| 2.2 | デッキ作成機能 | フォーム、Version 1自動作成 | DeckCreatePage |
| 2.3 | デッキ詳細画面 | カード一覧、履歴サマリ | DeckDetailPage |
| 2.4 | デッキ削除機能 | 確認ダイアログ、カスケード削除 | DeleteConfirmDialog |
| 2.5 | DeckService実装 | CRUD操作、Batched Write | DeckService.ts |

### Phase 3: カード編集機能

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 3.1 | カード入力UI | カード名入力、カテゴリ選択 | CardInputForm |
| 3.2 | カード一覧表示 | カテゴリ別グループ化 | CardList |
| 3.3 | 枚数管理 | +/- ボタン、バリデーション | CounterButton |
| 3.4 | カード削除 | スワイプ or ボタン | SwipeToDelete |
| 3.5 | 変更検出ロジック | 編集前後の差分検出 | DiffService.ts |

### Phase 4: バージョン管理機能

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 4.1 | コミット画面 | 差分プレビュー、メッセージ入力 | CommitPage |
| 4.2 | Version保存 | Batched Write (Deck + Version) | VersionService.ts |
| 4.3 | 履歴一覧画面 | タイムライン表示、ページネーション | HistoryPage |
| 4.4 | バージョン詳細 | 特定バージョンの内容表示 | VersionDetailPage |

### Phase 5: 差分表示機能

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 5.1 | 差分計算ロジック | DiffEntry[] 生成 | diffUtils.ts |
| 5.2 | 差分表示UI | 色分け（緑/赤/黄） | DiffView |
| 5.3 | バージョン比較 | 任意2バージョン選択・比較 | CompareSelector |
| 5.4 | 状態復元ロジック | diff から過去状態を計算 | stateReconstructor.ts |

### Phase 6: カードマスタ連携（将来拡張準備）

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 6.1 | CardMasterコレクション設計 | スキーマ定義、初期データ | cardMaster設計書 |
| 6.2 | カード画像表示 | Cloud Storage連携 | CardImage component |
| 6.3 | カード検索・サジェスト | 名前部分一致検索 | CardSearchInput |

### Phase 7: UI/UX改善・最終調整

| ID | タスク | 詳細 | 成果物 |
|----|--------|------|--------|
| 7.1 | モバイル最適化 | タッチ操作、レスポンシブ | モバイル対応完了 |
| 7.2 | iOSライクUI | ナビゲーション、アニメーション | iOS風デザイン |
| 7.3 | エラーハンドリング | Toast通知、リトライ | ErrorBoundary, Toast |
| 7.4 | ローディング状態 | スケルトン、スピナー | LoadingStates |
| 7.5 | 複数タブ検出 | 同時編集警告 | TabConflictWarning |

---

## 3. System Test Checklist（システムテストチェックリスト）

### 3.1 認証テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T0.1 | 初回起動時の自動認証 | Anonymous Auth で自動サインイン |
| T0.2 | 再起動後のセッション維持 | 同じUIDで認証継続 |
| T0.3 | 異なるデバイスでのデータ分離 | 他ユーザーのデッキは見えない |

### 3.2 デッキ管理テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T1.1 | デッキ新規作成 | デッキ作成 + Version 1 が同時に作成される |
| T1.2 | デッキ一覧表示 | 自分のデッキのみ表示される |
| T1.3 | デッキ詳細表示 | カード一覧と最新履歴が表示される |
| T1.4 | デッキ削除 | デッキと全Versionがカスケード削除される |
| T1.5 | 空デッキ作成 | カード0枚でも作成可能、Version 1は空diff |

### 3.3 カード編集テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T2.1 | カード追加 | デッキにカードが追加される |
| T2.2 | カード削除 | デッキからカードが削除される |
| T2.3 | 枚数変更 | カード枚数が正しく更新される |
| T2.4 | 同名4枚制限 | 5枚目追加時にエラー表示 |
| T2.5 | 60枚制限 | 61枚目追加時にエラー表示 |
| T2.6 | 基本エネルギー無制限 | 基本エネルギーは4枚超可能 |

### 3.4 バージョン管理テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T3.1 | 修正メッセージ必須 | メッセージ空欄で保存不可 |
| T3.2 | Version保存 | diff とメッセージが正しく保存される |
| T3.3 | 履歴表示 | 全バージョンが時系列で表示される |
| T3.4 | バージョン詳細 | 特定バージョン時点のデッキが復元表示される |
| T3.5 | 変更なし検出 | 変更がない場合、コミットボタン無効 |
| T3.6 | Batched Write | Deck更新とVersion作成がアトミックに実行 |

### 3.5 差分表示テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T4.1 | 追加カード表示 | 緑色 + "+" マークで表示 |
| T4.2 | 削除カード表示 | 赤色 + "-" マークで表示 |
| T4.3 | 枚数変更表示 | 黄色 + "2→3" 形式で表示 |
| T4.4 | 変更なし | "変更なし" メッセージ表示 |
| T4.5 | 複合変更 | 追加・削除・変更が混在時も正しく表示 |
| T4.6 | 任意バージョン比較 | v2 と v5 の差分が正しく計算される |

### 3.6 UI/UXテスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T5.1 | モバイル表示 | iPhone SE サイズで崩れなく表示 |
| T5.2 | タッチ操作 | タップ・スワイプが正常動作 |
| T5.3 | PWAインストール | ホーム画面追加が可能 |
| T5.4 | ローディング表示 | 通信中にスケルトン/スピナー表示 |
| T5.5 | エラー表示 | エラー時にToast通知 |

### 3.7 データ整合性テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T6.1 | 履歴からの状態復元 | diff を積み上げると currentCards と一致 |
| T6.2 | データ永続化 | アプリ再起動後もデータが保持される |
| T6.3 | オフライン編集 | オフラインで編集、オンライン復帰後に同期 |
| T6.4 | 複数タブ警告 | 同一デッキを複数タブで開くと警告表示 |

### 3.8 障害復旧テスト

| ID | テスト項目 | 期待結果 |
|----|-----------|----------|
| T7.1 | ネットワーク切断中の編集 | ローカルに保存、復帰後に同期 |
| T7.2 | コミット中のアプリ終了 | 次回起動時に未完了操作なし or リトライ |
| T7.3 | 100バージョン超の履歴 | ページネーションで表示、UIフリーズなし |

---

## 4. 優先度と依存関係

```
Phase 1 (基盤) ─────────────────────────────────────┐
     │                                              │
     ├── 1.5 Anonymous Auth ──┐                     │
     │                        │                     │
     └── 1.6 Security Rules ──┴── Phase 2 (デッキ管理)
                                       │
                                       ├── Phase 3 (カード編集)
                                       │          │
                                       │          ▼
                                       └── Phase 4 (バージョン管理)
                                                  │
                                                  ▼
                                           Phase 5 (差分表示)
                                                  │
                              ┌───────────────────┴───────────────────┐
                              ▼                                       ▼
                       Phase 6 (カードマスタ)                  Phase 7 (UI/UX)
                         [将来拡張]
```

---

## 5. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| カード名の表記ゆれ | 中 | MVP: ユーザー責任、将来: サジェスト機能 |
| Firestore無料枠超過 | 高 | 使用量モニタリング、アラート設定 |
| iOS PWA制限 | 中 | 重要データは必ずFirestoreに同期 |
| オフラインコンフリクト | 中 | Last-Write-Wins で許容（MVP） |
| 大量履歴のパフォーマンス | 中 | ページネーション必須実装 |

---

## 6. 決定事項サマリ（Tech Review 回答）

| 項目 | 決定 |
|------|------|
| RC-1: カード識別 | cardName で識別（MVP）、cardId は将来拡張用 |
| RC-2: 認証方式 | Firebase Anonymous Auth |
| RC-3: Version保存 | diff のみ保存 |
| RC-4: オフライン | Firestore 内蔵永続化を使用 |
| RC-5: 初期Version | 作成時に Version 1 自動生成、message="デッキを作成" |
| RC-6: バリデーション | 60枚制限 + 同名4枚制限（基本エネルギー除く） |
| RC-7: エクスポート | MVP対象外、将来検討 |
| RC-8: 削除時 | カスケード削除（確認ダイアログあり） |

---

## 7. 次のステップ

1. Phase 1 の詳細設計・実装着手
2. Firebase プロジェクト作成
3. UI モックアップ作成（Figma）
4. CardMaster のデータ収集方針検討（将来）
