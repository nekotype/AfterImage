# AfterImage

AfterImage は、表示された数字・文字・絵を短時間で記憶して4択で答えるメモリゲームです。

## 1. 必要なもの

- Git
- Node.js 18 以上
- npm（Node.js に同梱）

バージョン確認:

```bash
git --version
node -v
npm -v
```

## 2. プロジェクトを取得する

```bash
git clone <このリポジトリのURL>
cd AfterImage
```

## 3. 初回セットアップ

```bash
npm install
```

このプロジェクトは依存が少ないですが、最初に実行しておくと安全です。

## 4. ローカルで動かす（確認用）

`src/` をそのままブラウザで確認できます。

### 方法A: VS Code の Live Server を使う

1. `src/index.html` を開く
2. `Open with Live Server` を実行する

### 方法B: Python の簡易サーバーを使う

```bash
cd src
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開いてください。

## 5. 変更する場所

- 開発用ファイル: `src/`
- 主に触るファイル:
  - `src/index.html`
  - `src/style.css`
  - `src/script.js`

## 6. 公開用ファイルを作る

```bash
npm run build
```

このコマンドは `src/` の内容を `docs/` にコピーします。
`docs/` は GitHub Pages などで公開用ディレクトリとして使えます。

## 7. 変更を保存する（Git）

```bash
git add .
git commit -m "Update game"
```

必要に応じて push:

```bash
git push origin main
```

## ディレクトリ構成

- `src/`: 開発用ソース
- `docs/`: 公開用成果物
- `scripts/build-docs.js`: `src/` から `docs/` へコピーするスクリプト
