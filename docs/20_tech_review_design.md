# pokecavers 設計レビュー（Tech Lead Review）

**レビュー対象:** docs/10_pm_design.md
**レビュー観点:** 技術的実現可能性、障害シナリオ、設計の曖昧性

---

## 1. Critical Issues（重大な問題）

### 1.1 カード識別子の未定義 [CRITICAL]

**問題:**
```typescript
interface CardEntry {
  cardId: string;  // ← どこから来る？定義なし
  cardName: string;
}
```

- カードマスタデータが存在しない
- `cardId` の採番ルールが未定義
- 同名カード（再録・別イラスト）の区別方法が不明
- ユーザーが手入力する場合、`cardId` はどう生成するのか？

**影響:** 差分計算が破綻する。同じカードが別カードとして認識される可能性。

---

### 1.2 認証戦略の欠如 [CRITICAL]

**問題:**
- Auth は "Future" とされているが、Firestore は認証なしでは：
  - 全データが公開される、または
  - セキュリティルールで全拒否になる
- `Deck` に `userId` フィールドがない
- デバイス紛失時のデータ復旧手段がない

**影響:** MVP でも最低限の認証（Anonymous Auth）が必要。設計に含まれていない。

---

### 1.3 Version ストレージの非効率性 [HIGH]

**問題:**
```typescript
interface Version {
  beforeCards: CardEntry[];  // 60枚分のデータ
  afterCards: CardEntry[];   // 60枚分のデータ
}
```

- 1バージョンあたり最大120エントリを保存
- 100バージョンで12,000エントリ
- Firestore の読み取りコスト・ストレージコストが爆発

**代替案:** 差分（DiffEntry[]）のみを保存し、状態は計算で復元すべき。

---

### 1.4 オフライン同期戦略の未設計 [HIGH]

**問題:**
- 「IndexedDB でローカルキャッシュ」と記載があるが：
  - Firestore 内蔵のオフライン永続化との関係は？
  - コンフリクト解決ポリシーは？
  - オフライン中の Version 採番はどうする？

**影響:** オフライン編集 → オンライン復帰時にデータ消失・重複の可能性。

---

### 1.5 Firestore セキュリティルール未定義 [HIGH]

**問題:**
- セキュリティルールの設計がない
- 認証なしの場合、どのルールを適用するか不明

**必要な定義:**
```javascript
// 誰が読み書きできるか？
match /decks/{deckId} { ??? }
match /decks/{deckId}/versions/{versionId} { ??? }
```

---

### 1.6 カード枚数制限の不正確さ [MEDIUM]

**問題:**
- 「同名カード4枚制限」は不正確：
  - ACE SPEC カードは1枚制限
  - 基本エネルギーは無制限
  - 一部カードは特殊ルールあり
- レギュレーションごとに使用可能カードが異なる

**影響:** バリデーションロジックが複雑化。MVP でどこまで対応するか未定義。

---

### 1.7 初期バージョンの定義不足 [MEDIUM]

**問題:**
- デッキ新規作成時、Version はどうなる？
  - Version 0 は存在する？
  - Version 1 の `beforeCards` は空配列？
- 「修正メッセージ必須」だが、初回作成時のメッセージは？

**影響:** 実装時に判断が分かれ、バグの温床になる。

---

### 1.8 State Management の曖昧さ [MEDIUM]

**問題:**
- 「React Context / Zustand」と併記されているが、どちらを使うか未決定
- ローカル状態と Firestore の同期タイミングが未定義
- 楽観的更新（Optimistic Update）の採用有無が不明

---

## 2. Failure Scenarios（障害シナリオ）

### FS-1: オフライン編集コンフリクト

```
1. ユーザーがデッキを開く（Version 5）
2. オフラインになる
3. カードを編集して保存（ローカル Version 6）
4. 別デバイスで同じデッキを編集・保存（サーバー Version 6）
5. オンライン復帰
→ どちらの Version 6 が正？データ消失の可能性
```

### FS-2: コミット中断によるデータ不整合

```
1. ユーザーがコミットボタンを押す
2. Deck.currentCards の更新が完了
3. Version ドキュメントの書き込み前にアプリがクラッシュ
→ Deck と Version の整合性が崩れる
```

**対策必要:** Firestore Transaction または Batched Write の使用。

### FS-3: 複数タブでの同時編集

```
1. タブAでデッキを開く
2. タブBで同じデッキを開く
3. タブAで編集・保存
4. タブBで編集・保存（タブAの変更を上書き）
→ タブAの変更が消失
```

### FS-4: 大量履歴によるパフォーマンス劣化

```
1. ユーザーが1デッキに200回の編集を行う
2. 履歴一覧画面を開く
→ 200件のVersionをフェッチ、UIがフリーズ
```

**対策必要:** ページネーション、仮想スクロール。

### FS-5: カード名タイポの連鎖

```
1. ユーザーが「ピカチュウex」を「ピカチュウEX」と誤入力
2. 10バージョンにわたって使用
3. 後から気づいて修正したい
→ 過去バージョンの修正手段がない、差分表示が破綻
```

### FS-6: Firestore 無料枠超過

```
1. アプリが人気になる
2. 無料枠（50K reads/day）を超過
3. 突然アプリが動作しなくなる
→ ユーザーに事前警告なし
```

### FS-7: PWA iOS 制限による機能不全

```
1. iOS Safari で PWA をホーム画面に追加
2. 7日間アプリを開かない
3. iOS が Service Worker を削除
→ オフラインデータが消失
```

---

## 3. Required Clarifications（要確認事項）

### RC-1: カード識別方式

| 質問 | 選択肢 |
|------|--------|
| カードはどう識別するか？ | A) 手入力の名前のみ（cardId廃止）<br>B) 公式カードDBのAPI連携<br>C) ローカルマスタデータ埋め込み |

**推奨:** MVP では A（名前のみ）を採用し、cardId は将来拡張用に予約。

---

### RC-2: 認証方式

| 質問 | 選択肢 |
|------|--------|
| MVP の認証方式は？ | A) Firebase Anonymous Auth<br>B) デバイスID（localStorage）<br>C) 認証なし（ローカルのみ） |

**推奨:** A（Anonymous Auth）。デバイス間同期の基盤になる。

---

### RC-3: Version ストレージ方式

| 質問 | 選択肢 |
|------|--------|
| Version に何を保存するか？ | A) beforeCards + afterCards（現設計）<br>B) diff のみ（追加・削除・変更）<br>C) afterCards のみ |

**推奨:** B（diff のみ）。ストレージ効率が大幅に向上。

---

### RC-4: オフライン戦略

| 質問 | 選択肢 |
|------|--------|
| オフライン対応方針は？ | A) Firestore 内蔵のオフライン永続化のみ<br>B) カスタム IndexedDB + 同期ロジック<br>C) MVP ではオフライン非対応 |

**推奨:** A。カスタム実装は複雑すぎる。

---

### RC-5: 初期バージョン仕様

| 質問 | 回答が必要 |
|------|-----------|
| デッキ作成時に Version を作成するか？ | Yes / No |
| 作成時の message は何とするか？ | 固定文言 / ユーザー入力 |
| beforeCards は空配列でよいか？ | Yes / No |

---

### RC-6: バリデーション範囲

| 質問 | 選択肢 |
|------|--------|
| MVP でのバリデーション範囲は？ | A) 60枚制限のみ<br>B) 60枚 + 同名4枚制限<br>C) フルルール（ACE SPEC等含む） |

**推奨:** B。ACE SPEC 等は将来対応。

---

### RC-7: データ移行・エクスポート

| 質問 | 回答が必要 |
|------|-----------|
| MVP でエクスポート機能は必要か？ | 要検討 |
| 将来の認証導入時、Anonymous データの移行方法は？ | 要設計 |

---

### RC-8: 削除時の履歴扱い

| 質問 | 選択肢 |
|------|--------|
| デッキ削除時、Version はどうする？ | A) カスケード削除<br>B) 論理削除（復元可能）<br>C) Version は残す |

**推奨:** A。ただし確認ダイアログで明示。

---

## 4. 設計修正の提案

### 4.1 データモデル修正案

```typescript
// CardEntry: cardId を optional に
interface CardEntry {
  cardId?: string;          // 将来の拡張用（MVP では未使用）
  cardName: string;         // プライマリキー代わり
  category: 'pokemon' | 'trainer' | 'energy';
  count: number;
}

// Version: diff のみを保存
interface Version {
  id: string;
  deckId: string;
  versionNumber: number;
  message: string;
  diff: DiffEntry[];        // beforeCards/afterCards の代わり
  createdAt: Timestamp;
}

// Deck: userId を追加
interface Deck {
  id: string;
  userId: string;           // Anonymous Auth の UID
  name: string;
  regulation: string;
  memo?: string;
  currentCards: CardEntry[];
  versionCount: number;     // 採番用カウンター
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.2 Phase 1 に追加すべきタスク

| ID | タスク | 理由 |
|----|--------|------|
| 1.6 | Firebase Anonymous Auth 設定 | セキュリティルールの前提 |
| 1.7 | Firestore セキュリティルール定義 | 必須 |
| 1.8 | オフライン永続化設定 | Firestore 設定で有効化 |

### 4.3 テスト追加案

| ID | テスト項目 |
|----|-----------|
| T7.1 | ネットワーク切断中の編集・復帰 |
| T7.2 | コミット中のアプリ強制終了 |
| T7.3 | 100バージョン超の履歴表示性能 |
| T7.4 | 複数タブでの同時編集検出 |

---

## 5. 結論

**設計は MVP として概ね妥当だが、以下の修正が必須:**

1. **認証:** Anonymous Auth を MVP に含める
2. **カード識別:** cardId を廃止し、cardName で識別（MVP）
3. **Version 保存:** diff のみに変更（ストレージ効率）
4. **セキュリティルール:** 設計書に追加
5. **初期バージョン:** 仕様を明確化

**RC-1 〜 RC-8 の回答を得てから詳細設計に進むこと。**
