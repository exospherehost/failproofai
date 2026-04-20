> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | **🇯🇵 日本語** | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

---

```
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ `/ / / __ \/ ___/ __ \/ __ \/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \__,_/_/_/ .___/_/   \____/\____/_/    /_/  |_/___/
               /_/
```

# Failproof AI

[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://befailproof.ai)
[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)
[![Slack](https://img.shields.io/badge/Slack-join%20us-4A154B?style=flat-square&logo=slack)](https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ)

**翻訳**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

AIエージェントを安定稼働させ、タスクに集中させ、自律的に動作させ続けるためのポリシー管理ツール — **Claude Code** および **Agents SDK** 対応。

- **30種類の組み込みポリシー** - よくあるエージェントの障害パターンをすぐに検出。破壊的なコマンドのブロック、シークレット漏洩の防止、エージェントをプロジェクト境界内に制限、ループの検出など。
- **カスタムポリシー** - JavaScriptで独自の信頼性ルールを記述。`allow`/`deny`/`instruct` APIを使用して、規約の強制、ドリフトの防止、操作のゲート、外部システムとの連携が可能。
- **簡単な設定** - コードを書かずにポリシーを調整。許可リスト、保護ブランチ、しきい値をプロジェクトごとまたはグローバルに設定可能。3段階のスコープ設定が自動的にマージ。
- **エージェントモニター** - 不在時にエージェントが行ったことを確認。セッションの閲覧、すべてのツール呼び出しの検査、ポリシーが発動した箇所の詳細レビュー。

すべてローカルで動作 — データが外部に送信されることはありません。

---

## 動作要件

- Node.js >= 20.9.0
- Bun >= 1.3.0（任意 — 開発時またはソースからビルドする場合のみ必要）

---

## インストール

```bash
npm install -g failproofai
# または
bun add -g failproofai
```

---

## クイックスタート

### 1. ポリシーをグローバルに有効化

```bash
failproofai policies --install
```

`~/.claude/settings.json` にフックエントリを書き込みます。これ以降、Claude Code は各ツール呼び出しの前後に failproofai を起動します。

### 2. ダッシュボードを起動

```bash
failproofai
```

`http://localhost:8020` が開きます — セッションの閲覧、ログの確認、ポリシーの管理が行えます。

### 3. 有効なポリシーを確認

```bash
failproofai policies
```

---

## ポリシーのインストール

### スコープ

| スコープ | コマンド | 書き込み先 |
|-------|---------|-----------------|
| グローバル（デフォルト） | `failproofai policies --install` | `~/.claude/settings.json` |
| プロジェクト | `failproofai policies --install --scope project` | `.claude/settings.json` |
| ローカル | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### 特定のポリシーをインストール

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### ポリシーを削除

```bash
failproofai policies --uninstall
# または特定のスコープを指定する場合:
failproofai policies --uninstall --scope project
```

---

## 設定

ポリシー設定は `~/.failproofai/policies-config.json`（グローバル）またはプロジェクト内の `.failproofai/policies-config.json`（プロジェクト単位）に保存されます。

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-rm-rf",
    "sanitize-api-keys",
    "block-push-master",
    "block-env-files",
    "block-read-outside-cwd"
  ],
  "policyParams": {
    "block-sudo": {
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"],
      "hint": "Use apt-get directly without sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Try creating a fresh branch instead."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API key" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**3つの設定スコープ**は自動的にマージされます（プロジェクト → ローカル → グローバル）。マージルールの詳細は [docs/configuration.mdx](docs/configuration.mdx) を参照してください。

---

## 組み込みポリシー

| ポリシー | 説明 | 設定可能パラメータ |
|--------|-------------|:---:|
| `block-sudo` | エージェントによる特権システムコマンドの実行を防止 | `allowPatterns` |
| `block-rm-rf` | 誤ったファイルの再帰的削除を防止 | `allowPaths` |
| `block-curl-pipe-sh` | 信頼できないスクリプトをシェルにパイプすることを防止 | |
| `block-failproofai-commands` | 自己アンインストールを防止 | |
| `sanitize-jwt` | JWTトークンがエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-api-keys` | APIキーがエージェントのコンテキストに漏洩するのを防止 | `additionalPatterns` |
| `sanitize-connection-strings` | データベース認証情報がエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-private-key-content` | 出力からPEM秘密鍵ブロックを削除 | |
| `sanitize-bearer-tokens` | 出力からAuthorization Bearerトークンを削除 | |
| `block-env-files` | エージェントが.envファイルを読み取ることを防止 | |
| `protect-env-vars` | エージェントが環境変数を出力することを防止 | |
| `block-read-outside-cwd` | エージェントをプロジェクト境界内に制限 | `allowPaths` |
| `block-secrets-write` | 秘密鍵・証明書ファイルへの書き込みを防止 | `additionalPatterns` |
| `block-push-master` | main/masterへの誤ったプッシュを防止 | `protectedBranches` |
| `block-work-on-main` | エージェントが保護ブランチで作業することを防止 | `protectedBranches` |
| `block-force-push` | `git push --force` を防止 | |
| `warn-git-amend` | コミット修正前にエージェントに通知 | |
| `warn-git-stash-drop` | スタッシュの破棄前にエージェントに通知 | |
| `warn-all-files-staged` | 誤った `git add -A` を検出 | |
| `warn-destructive-sql` | 実行前にDROP/DELETE SQLを検出 | |
| `warn-schema-alteration` | 実行前にALTER TABLEを検出 | |
| `warn-large-file-write` | 予期せず大きなファイル書き込みを検出 | `thresholdKb` |
| `warn-package-publish` | 誤った `npm publish` を検出 | |
| `warn-background-process` | 意図しないバックグラウンドプロセスの起動を検出 | |
| `warn-global-package-install` | 意図しないグローバルパッケージインストールを検出 | |
| …その他 | | |

ポリシーの詳細とパラメータのリファレンス: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## カスタムポリシー

エージェントの安定性とタスク集中を維持するための独自ポリシーを作成できます:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Block writes to paths containing 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Writes to production paths are blocked");
    return allow();
  },
});
```

以下のコマンドでインストール:

```bash
failproofai policies --install --custom ./my-policies.js
```

### 判定ヘルパー

| 関数 | 動作 |
|----------|--------|
| `allow()` | 操作を許可 |
| `allow(message)` | 操作を許可し、Claude に情報コンテキストを送信 |
| `deny(message)` | 操作をブロック；メッセージが Claude に表示される |
| `instruct(message)` | Claude のプロンプトにコンテキストを追加；ブロックしない |

### コンテキストオブジェクト (`ctx`)

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 呼び出されるツール（`"Bash"`、`"Write"`、`"Read"` など） |
| `toolInput` | `object` | ツールの入力パラメータ |
| `payload` | `object` | 生のイベントペイロード全体 |
| `session.cwd` | `string` | Claude Code セッションの作業ディレクトリ |
| `session.sessionId` | `string` | セッション識別子 |
| `session.transcriptPath` | `string` | セッションのトランスクリプトファイルへのパス |

カスタムフックは、推移的なローカルインポート、async/await、`process.env` へのアクセスをサポートします。エラーはフェイルオープン（`~/.failproofai/hook.log` に記録され、組み込みポリシーは継続して動作）です。詳細なガイドは [docs/custom-hooks.mdx](docs/custom-hooks.mdx) を参照してください。

### 規約ベースのポリシー

`*policies.{js,mjs,ts}` ファイルを `.failproofai/policies/` に配置するだけで自動的に読み込まれます — `--custom` フラグや設定変更は不要です。gitフックと同じ仕組み：ファイルを置くだけで動作します。

```text
# プロジェクトレベル — gitにコミットし、チームで共有
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# ユーザーレベル — 個人用、全プロジェクトに適用
~/.failproofai/policies/my-policies.mjs
```

両方のレベルが読み込まれます（ユニオン）。各ディレクトリ内ではファイルがアルファベット順に読み込まれます。順序を制御するには `01-`、`02-` などのプレフィックスを使用してください。すぐに使えるサンプルは [examples/convention-policies/](examples/convention-policies/) を参照してください。

---

## テレメトリ

Failproof AI は PostHog を通じて匿名の使用状況テレメトリを収集し、機能の利用状況を把握します。セッションの内容、ファイル名、ツールの入力、個人情報は一切送信されません。

無効化する方法:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## ドキュメント

| ガイド | 説明 |
|-------|-------------|
| [はじめに](docs/getting-started.mdx) | インストールと最初のステップ |
| [組み込みポリシー](docs/built-in-policies.mdx) | パラメータ付き30種類の組み込みポリシー一覧 |
| [カスタムポリシー](docs/custom-policies.mdx) | 独自ポリシーの作成方法 |
| [設定](docs/configuration.mdx) | 設定ファイルの形式とスコープのマージ |
| [ダッシュボード](docs/dashboard.mdx) | セッションの監視とポリシーアクティビティのレビュー |
| [アーキテクチャ](docs/architecture.mdx) | フックシステムの仕組み |
| [テスト](docs/testing.mdx) | テストの実行と新しいテストの作成 |

### ドキュメントをローカルで実行

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` にMintlifyのドキュメントサイトが開きます。docsディレクトリをマウントすると、コンテナが変更を監視します:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai コントリビューター向けの注意事項

このリポジトリの `.claude/settings.json` は、標準の `npx -y failproofai` コマンドの代わりに `bun ./bin/failproofai.mjs --hook <EventType>` を使用しています。これは、failproofai プロジェクト自体で `npx -y failproofai` を実行すると自己参照の競合が発生するためです。

その他すべてのリポジトリでは、推奨される方法は `npx -y failproofai` であり、以下のコマンドでインストールします:

```bash
failproofai policies --install --scope project
```

## コントリビューション

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## ライセンス

[LICENSE](LICENSE) を参照してください。

---

**ExosphereHost: Reliability Research Lab for Your Agents** によって構築・維持されています。エージェント、ソフトウェア、専門知識を通じて、企業やスタートアップのAIエージェントの信頼性向上を支援しています。詳細は [exosphere.host](https://exosphere.host) をご覧ください。
