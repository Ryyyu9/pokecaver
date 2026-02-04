# iOS アプリ化の検討

**作成日:** 2026-02-04
**ステータス:** 検討中

---

## 概要

現在の React + TypeScript (Vite) で構築された Web アプリを iOS アプリとして Apple App Store に展開する方法を検討する。

---

## 選択肢

### 1. Capacitor（推奨）

現在のコードをそのままラップして iOS アプリ化する方法。

```bash
# Capacitor を追加
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init pokecavers com.example.pokecavers
npx cap add ios

# ビルドして iOS プロジェクト生成
npm run build
npx cap sync
npx cap open ios  # Xcode が開く
```

| 項目 | 内容 |
|------|------|
| 工数 | 約1週間 |
| コード変更 | ほぼなし |
| App Store | 申請可能 |

**メリット:**
- 今のコードがそのまま使える
- ネイティブ機能（カメラ、プッシュ通知、生体認証など）も追加可能
- Ionic チームがメンテナンス、安定している

**デメリット:**
- 完全ネイティブより若干パフォーマンスが劣る
- 複雑なアニメーションは苦手

---

### 2. PWA (Progressive Web App)

ホーム画面に追加するだけでアプリのように動作させる方法。

| 項目 | 内容 |
|------|------|
| 工数 | 数日（PWA設定のみ） |
| コード変更 | manifest.json, Service Worker 追加 |
| App Store | 申請不可 |

**メリット:**
- 追加開発がほぼ不要
- URL で共有可能

**デメリット:**
- App Store に出せない
- iOS の制限が多い
  - プッシュ通知なし
  - 7日間未使用でデータ消失リスク
  - バックグラウンド処理制限

---

### 3. React Native で書き直し

UI を React Native 用に書き直す方法。

```
再利用可能なコード:
├── src/types/        ← そのまま使える
├── src/utils/        ← そのまま使える
├── src/services/     ← そのまま使える

書き直しが必要:
├── src/App.tsx       ← React Native 用に書き直し
├── src/components/   ← 全コンポーネント書き直し
└── src/pages/        ← 全ページ書き直し
```

| 項目 | 内容 |
|------|------|
| 工数 | 2-3週間 |
| コード変更 | UI層を全書き直し、ロジック層は再利用 |
| App Store | 申請可能 |

**メリット:**
- ネイティブに近い操作感
- Android も同時に対応可能
- React の知識が活かせる

**デメリット:**
- UI コンポーネントを全部書き直し
- ライブラリの互換性問題が発生しやすい

---

### 4. SwiftUI でフル書き直し

完全にネイティブで作り直す方法。

| 項目 | 内容 |
|------|------|
| 工数 | 1-2ヶ月 |
| コード変更 | 全書き直し |
| App Store | 申請可能 |

**メリット:**
- 最高の操作感・パフォーマンス
- Apple の最新機能をすぐに使える
- 審査に通りやすい

**デメリット:**
- Swift/SwiftUI の学習コスト
- 全コードを書き直し
- iOS のみ（Android 非対応）

---

## 比較表

| 方式 | 工数 | コード再利用 | パフォーマンス | App Store |
|------|------|--------------|----------------|-----------|
| Capacitor | 1週間 | ◎ 100% | ○ 良好 | ○ 可能 |
| PWA | 数日 | ◎ 100% | ○ 良好 | × 不可 |
| React Native | 2-3週間 | △ ロジックのみ | ◎ 優秀 | ○ 可能 |
| SwiftUI | 1-2ヶ月 | × なし | ◎ 最高 | ○ 可能 |

---

## 推奨

**現段階では Capacitor を推奨する。**

### 理由

1. **即座に動く** - 今の React コードがそのまま使える
2. **リスクが低い** - ダメなら後から React Native / SwiftUI に移行可能
3. **十分な品質** - App Store 審査も問題なく通る
4. **拡張性** - 後からネイティブ機能（カメラ、通知等）も追加可能

### 将来の移行パス

```
現在 (React + Vite)
    │
    ▼
Phase 1: Capacitor で iOS 化
    │
    ├── ユーザー増加・要件複雑化
    ▼
Phase 2: React Native に移行（必要なら）
    │
    ├── 更なる最適化が必要
    ▼
Phase 3: SwiftUI に移行（必要なら）
```

---

## 次のアクション

1. [ ] Capacitor のセットアップ
2. [ ] iOS シミュレータでの動作確認
3. [ ] Apple Developer Program への登録（年間 $99）
4. [ ] TestFlight でベータテスト
5. [ ] App Store 申請

---

## 参考リンク

- [Capacitor 公式ドキュメント](https://capacitorjs.com/docs)
- [Capacitor iOS ガイド](https://capacitorjs.com/docs/ios)
- [App Store 審査ガイドライン](https://developer.apple.com/app-store/review/guidelines/)
