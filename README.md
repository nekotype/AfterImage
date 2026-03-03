# AfterImage

AfterImage は、短時間表示された数字・文字・絵を記憶して4択で答えるメモリゲームです。

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

## ビルド方法

```bash
npm install
npm run build
```

`npm run build` を実行すると、`src/` の内容が `docs/` に反映されます。

## GitHub Pages 設定

1. GitHub リポジトリの `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を `Deploy from a branch` に設定
4. `Branch` を `main`、フォルダを `/docs` に設定
5. `Save` を押す

公開URLは Pages 画面に表示されます。
