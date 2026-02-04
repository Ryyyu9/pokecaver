# pokecavers

ポケモンカードゲームのデッキ構築をバージョン管理できるアプリ。

デッキの修正履歴・修正意図・差分を保存・可視化し、プレイヤーの思考プロセスを記録・振り返ることを目的とする。

---

## セットアップ

```bash
# 依存パッケージをインストール
npm install
```

---

## 開発サーバー起動

```bash
npm run dev
```

起動後、ブラウザで以下にアクセス:

```
http://localhost:5173/
```

停止は `Ctrl + C`

---

## テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート付き
npm run test:coverage
```

カバレッジレポートは `coverage/index.html` をブラウザで開いて確認。

---

## ビルド

```bash
npm run build
```

出力先: `dist/`

---

## プロジェクト構成

```
pokecavers/
├── src/
│   ├── types/           # 型定義
│   ├── utils/           # ユーティリティ関数
│   ├── services/        # サービス層
│   ├── App.tsx          # メインアプリ
│   ├── main.tsx         # エントリーポイント
│   └── index.css        # スタイル
├── tests/               # テストファイル
├── docs/                # ドキュメント
│   ├── 00_requirements.md
│   ├── 10_pm_design.md
│   ├── 20_tech_review_design.md
│   ├── 30_tl_tasks.md
│   ├── 40_unit_test_specs.md
│   ├── daily/           # 日報
│   └── issue/           # 課題・検討事項
└── package.json
```

---

## 主な機能

- カード追加・削除・枚数変更
- 60枚制限 / 同名4枚制限のバリデーション
- 基本エネルギーは無制限
- 変更のコミット（理由必須）
- バージョン履歴の表示
- 差分の色分け表示（追加=緑、削除=赤、変更=黄）
- 任意バージョンの状態復元

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| React 18 | UI |
| TypeScript | 型安全性 |
| Vite | ビルド・開発サーバー |
| Vitest | テスト |
| Zustand | 状態管理（予定） |
| Firebase | バックエンド（予定） |

---

## ドキュメント

| ファイル | 内容 |
|----------|------|
| `docs/00_requirements.md` | 要件定義 |
| `docs/10_pm_design.md` | 設計書 |
| `docs/30_tl_tasks.md` | タスク一覧 |
| `docs/40_unit_test_specs.md` | テスト仕様 |
| `docs/daily/` | 日報 |
| `docs/issue/` | 課題・検討事項 |
