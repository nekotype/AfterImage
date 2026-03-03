# AfterImage

AfterImage は、短時間表示された数字・文字・絵を記憶して4択で答えるメモリゲームです。

## 概要

- 出題タイプ（絵+ / 絵 / 文字 / 字）を切り替えてプレイできます。
- 表示時間を変えて難易度調整できます。
- スコアは Supabase に保存され、ランキング表示に利用されます。

## 主な機能

- 4択の記憶テストゲーム
- 出題タイプ切り替え
- 表示時間切り替え
- ワールドハイスコア / 個人スコア / 総プレイ回数の表示

## 技術スタック

- HTML
- CSS
- JavaScript
- Node.js（ビルドスクリプト実行用）
- Supabase（スコア保存）

## フォルダ構成

- `src/`: 開発用ソース
  - `index.html`
  - `style.css`
  - `script.js`
  - `favicon.svg`
- `docs/`: 公開用ファイル（GitHub Pages 配信用）
- `scripts/build-docs.js`: `src/` を `docs/` へコピーするビルドスクリプト

## セットアップ

```bash
npm install
```

## ビルド方法

```bash
npm run build
```

`npm run build` を実行すると、`src/` の内容が `docs/` に反映されます。

## 開発フロー（最小）

1. `src/` 配下を編集
2. `npm run build` を実行
3. `docs/` の差分をコミット

## GitHub Pages 設定

1. GitHub リポジトリの `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を `Deploy from a branch` に設定
4. `Branch` を `main`、フォルダを `/docs` に設定
5. `Save` を押す

公開URLは Pages 画面に表示されます。

## ライセンス

MIT License. 詳細は `LICENSE` を参照してください。
