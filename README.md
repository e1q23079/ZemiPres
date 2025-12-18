# ZemiPres

## 概要

ZemiPresは、ゼミ発表の進行管理を自動化するWebアプリケーションです。

### 主な機能

- **発表順の自動生成**: 毎週のゼミ発表順を自動で決定
- **メール通知**: 発表順が決まったら自動でメール送信
- **Webアプリでの確認**: ブラウザから現在の発表順を確認可能
- **欠席報告機能**: メンバーが欠席を事前に報告
<!-- - **発表状況の把握**: 誰が発表中か、誰が発表済みかを一目で確認 -->

## 環境構築

### 1. 依存パッケージのインストール

まず、必要なNode.jsパッケージをインストールします。

```bash
npm install
```

### 2. Google Apps Script CLIへのログイン

Claspコマンドを使用するために、Googleアカウントでログインします。

```bash
npx clasp login
```

ブラウザが開き、「このアクセス権を付与することで、clasp – The Apps Script CLI は以下のことができるようになります。」というメッセージが表示されます。内容を確認して「続行」をクリックしてください。

### 3. Google Apps Script APIの有効化

Google Apps Script APIを有効にする必要があります。

1. <https://script.google.com/home/usersettings> にアクセス
2. 「Google Apps Script API」をオンに設定

### 4. 環境設定ファイルの準備

デプロイに必要な設定ファイルを用意します。

#### 環境変数ファイル (`.env`)

`.sample.env`を参考に、`.env`ファイルを作成し、各環境のデプロイメントIDを設定してください。

```bash
PRODUCTION_DEPLOYMENT_ID=your_production_id
DEVELOPMENT01_DEPLOYMENT_ID=your_dev01_id
DEVELOPMENT02_DEPLOYMENT_ID=your_dev02_id
```

#### Clasp設定ファイル (`.clasp.json`)

`.sample.clasp.json`を参考に、`.clasp.json`ファイルを作成し、Google Apps ScriptのスクリプトIDを設定してください。

## デプロイ

### 開発環境へのデプロイ

開発環境は2つ用意されています。用途に応じて使い分けてください。

```bash
# 開発環境01にデプロイ
npm run deploy-dev01

# 開発環境02にデプロイ
npm run deploy-dev02
```

### 本番環境へのデプロイ

本番環境にデプロイする際は、以下のコマンドを実行します。

```bash
npm run deploy-product
```

### スクリプトプロパティの設定

このプロジェクトでは、Google Apps Script の **スクリプトプロパティ** を使用して、外部サービスの認証情報や設定値を管理しています。  
設定するプロパティは以下の通りです。

| プロパティ名 | 説明 |
|--------------|------|
| `NOTION_TOKEN` | Notion API にアクセスするための統合（Integration）トークン。Notion のデータベース操作に必要です。 |
| `NOTION_DATABASE_ID_TEST` | テスト用 Notion データベースの ID。開発環境でデータ取得・更新に使用します。 |
| `NOTION_DATABASE_ID_PRODUCT` | 本番用 Notion データベースの ID。本番環境でのデータ取得・更新に使用します。 |
| `NOTION_LAST_UPDATED_DATABASE_ID` | 最終更新時刻を記録する Notion データベースの ID。更新履歴管理に使用します。 |
| `PASSCODE` | Web アプリなどで利用する簡易認証パスコード。ユーザー操作を制限したい場合に使用します。 |
| `TRIGGER_STATUS` | 定期実行（トリガー）の ON/OFF 状態を管理するフラグ。自動実行処理の制御に使用します。 |
| `AD` | 広告データのJSONを保持します。 |

#### 広告データ（JSON）

```json
[
 {
  "imgSrc": "GoogleドライブのファイルID",
  "url": "/",
  "description": "サンプル広告"
 }
]
```

※`id`はGoogleドライブで画像を新しいタブで開いたときにURLに含まれるファイルIDです

#### 設定方法

1. Google Apps Script エディタで `プロジェクトの設定` → `スクリプトのプロパティ` を開く
2. 上記のプロパティ名と値を追加する

## GitHub Actionsでの自動デプロイ

GitHub Actionsを使用して自動デプロイを設定する場合、以下の手順でシークレットを登録してください。

1. GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** に移動
2. **Repository secrets** に以下のシークレットを追加:
   - `PRODUCTION_DEPLOYMENT_ID`: 本番環境のデプロイメントID
   - `CLASPRC_JSON` : `~/.clasprc.json`の認証情報
   - `CLASP_JSON` : `.clasp.json`のスクリプト情報
