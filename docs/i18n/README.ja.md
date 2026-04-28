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

**Claude Code**、**OpenAI Codex**、**Agents SDK** に対応した、AIエージェントの信頼性維持・タスク遂行・自律稼働を実現するポリシー管理の最も簡単な方法です。

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

## 対応エージェントCLI

<p align="center">
  <a href="https://claude.com/claude-code" title="Claude Code">
    <img src="assets/logos/claude.svg" alt="Claude Code" width="64" height="64" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://developers.openai.com/codex" title="OpenAI Codex">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/openai-dark.svg" />
      <img src="assets/logos/openai-light.svg" alt="OpenAI Codex" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>+ 続々対応予定</strong>
</p>

> 一方または両方にフックをインストールする場合: `failproofai policies --install --cli codex`（または `--cli claude codex`）。`--cli` を省略すると、インストール済みのCLIを自動検出してプロンプトを表示します。

- **39種類の組み込みポリシー** - エージェントによくある障害パターンをすぐに検出。破壊的コマンドのブロック、シークレット漏洩の防止、エージェントをプロジェクト境界内に制限、ループの検出など、多数の機能を即座に利用できます。
- **カスタムポリシー** - JavaScriptで独自の信頼性ルールを記述可能。`allow`/`deny`/`instruct` APIを使って、規約の強制、ドリフトの防止、操作のゲート処理、外部システムとの連携などを実現できます。
- **シンプルな設定** - コードを書かずにポリシーを調整可能。許可リスト、保護ブランチ、しきい値をプロジェクトごとまたはグローバルに設定できます。3つのスコープの設定は自動的にマージされます。
- **エージェントモニター** - 席を離れている間にエージェントが何をしていたかを確認できます。セッションを閲覧し、すべてのツール呼び出しを検査し、ポリシーが発動した箇所を正確に確認できます。

すべてローカルで動作するため、データが外部に送信されることはありません。

---

## 動作要件

- Node.js >= 20.9.0
- Bun >= 1.3.0（オプション - 開発時またはソースからビルドする場合のみ必要）

---

## インストール

```bash
npm install -g failproofai
# または
bun add -g failproofai
```

---

## クイックスタート

### 1. ポリシーをグローバルに有効化する

```bash
failproofai policies --install
```

`~/.claude/settings.json` にフックエントリを書き込みます。これにより、Claude Code は各ツール呼び出しの前後に failproofai を起動するようになります。

### 2. ダッシュボードを起動する

```bash
failproofai
```

`http://localhost:8020` が開きます。セッションの閲覧、ログの確認、ポリシーの管理が行えます。

### 3. 有効なポリシーを確認する

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

### 特定のポリシーをインストールする

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### ポリシーを削除する

```bash
failproofai policies --uninstall
# または特定のスコープを指定する場合:
failproofai policies --uninstall --scope project
```

---

## 設定

ポリシーの設定は、`~/.failproofai/policies-config.json`（グローバル）またはプロジェクト内の `.failproofai/policies-config.json`（プロジェクト単位）に保存されます。

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

**3つの設定スコープ**は自動的にマージされます（プロジェクト → ローカル → グローバルの順）。マージルールの詳細は [docs/configuration.mdx](docs/configuration.mdx) を参照してください。

---

## 組み込みポリシー

| ポリシー | 説明 | 設定可能なパラメータ |
|--------|-------------|:---:|
| `block-sudo` | エージェントが特権システムコマンドを実行するのを防止 | `allowPatterns` |
| `block-rm-rf` | 誤ったファイルの再帰的削除を防止 | `allowPaths` |
| `block-curl-pipe-sh` | 信頼されていないスクリプトをシェルにパイプするのを防止 | |
| `block-failproofai-commands` | 自己アンインストールを防止 | |
| `sanitize-jwt` | JWTトークンがエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-api-keys` | APIキーがエージェントのコンテキストに漏洩するのを防止 | `additionalPatterns` |
| `sanitize-connection-strings` | データベース認証情報がエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-private-key-content` | 出力からPEM秘密鍵ブロックを削除 | |
| `sanitize-bearer-tokens` | 出力からAuthorization Bearerトークンを削除 | |
| `block-env-files` | エージェントが .env ファイルを読み取らないようにする | |
| `protect-env-vars` | エージェントが環境変数を出力するのを防止 | |
| `block-read-outside-cwd` | エージェントをプロジェクト境界内に制限 | `allowPaths` |
| `block-secrets-write` | 秘密鍵ファイルや証明書ファイルへの書き込みを防止 | `additionalPatterns` |
| `block-push-master` | main/masterへの誤ったプッシュを防止 | `protectedBranches` |
| `block-work-on-main` | 保護ブランチでのエージェントの作業を禁止 | `protectedBranches` |
| `block-force-push` | `git push --force` を防止 | |
| `warn-git-amend` | コミットの修正前にエージェントに警告 | |
| `warn-git-stash-drop` | スタッシュの削除前にエージェントに警告 | |
| `warn-all-files-staged` | 誤った `git add -A` を検出 | |
| `warn-destructive-sql` | 実行前にDROP/DELETE SQLを検出 | |
| `warn-schema-alteration` | 実行前にALTER TABLEを検出 | |
| `warn-large-file-write` | 予期しない大きなファイル書き込みを検出 | `thresholdKb` |
| `warn-package-publish` | 誤った `npm publish` を検出 | |
| `warn-background-process` | 意図しないバックグラウンドプロセスの起動を検出 | |
| `warn-global-package-install` | 意図しないグローバルパッケージのインストールを検出 | |
| …その他多数 | | |

ポリシーの詳細とパラメータリファレンス: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## カスタムポリシー

エージェントの信頼性とタスク遂行を維持するための独自ポリシーを記述できます:

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

以下のコマンドでインストールします:

```bash
failproofai policies --install --custom ./my-policies.js
```

### 判定ヘルパー

| 関数 | 効果 |
|----------|--------|
| `allow()` | 操作を許可する |
| `allow(message)` | 許可し、情報コンテキストを Claude に送信する |
| `deny(message)` | 操作をブロックする。メッセージは Claude に表示される |
| `instruct(message)` | Claude のプロンプトにコンテキストを追加する（ブロックしない） |

### コンテキストオブジェクト（`ctx`）

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 呼び出されるツール（`"Bash"`、`"Write"`、`"Read"` など） |
| `toolInput` | `object` | ツールの入力パラメータ |
| `payload` | `object` | 生のイベントペイロード全体 |
| `session.cwd` | `string` | Claude Code セッションの作業ディレクトリ |
| `session.sessionId` | `string` | セッション識別子 |
| `session.transcriptPath` | `string` | セッションのトランスクリプトファイルへのパス |

カスタムフックはトランジティブなローカルインポート、async/await、`process.env` へのアクセスをサポートしています。エラーはフェイルオープン（`~/.failproofai/hook.log` に記録され、組み込みポリシーは継続して実行されます）。詳細なガイドは [docs/custom-hooks.mdx](docs/custom-hooks.mdx) を参照してください。

### 規約ベースのポリシー

`.failproofai/policies/` に `*policies.{js,mjs,ts}` ファイルを配置するだけで自動的に読み込まれます。フラグや設定の変更は不要です。ディレクトリを git にコミットすれば、チームメンバー全員が同じ品質基準を自動的に適用できます。

```text
# プロジェクトレベル — git にコミット済み、チームで共有
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# ユーザーレベル — 個人用、すべてのプロジェクトに適用
~/.failproofai/policies/my-policies.mjs
```

両方のレベルが読み込まれます（和集合）。ファイルは各ディレクトリ内でアルファベット順に読み込まれます。順序を制御するには `01-`、`02-` などのプレフィックスを使用してください。チームが新たな障害パターンを発見したら、ポリシーを追加してプッシュするだけで、全員が次回のプルで更新を取得できます。すぐに使えるサンプルは [examples/convention-policies/](examples/convention-policies/) を参照してください。

---

## テレメトリ

Failproof AI は機能の利用状況を把握するため、PostHog を通じて匿名の使用状況テレメトリを収集します。セッションの内容、ファイル名、ツールの入力、個人情報は一切送信されません。

無効にする場合:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## ドキュメント

| ガイド | 説明 |
|-------|-------------|
| [はじめに](docs/getting-started.mdx) | インストールと最初のステップ |
| [組み込みポリシー](docs/built-in-policies.mdx) | パラメータ付きの39種類の組み込みポリシー一覧 |
| [カスタムポリシー](docs/custom-policies.mdx) | 独自ポリシーの作成方法 |
| [設定](docs/configuration.mdx) | 設定ファイルの形式とスコープのマージ |
| [ダッシュボード](docs/dashboard.mdx) | セッションの監視とポリシーアクティビティの確認 |
| [アーキテクチャ](docs/architecture.mdx) | フックシステムの仕組み |
| [テスト](docs/testing.mdx) | テストの実行と新規テストの作成 |

### ドキュメントをローカルで実行する

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` で Mintlify ドキュメントサイトが開きます。docs ディレクトリをマウントすると、変更を監視します:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai コントリビューターへの注意

このリポジトリの `.claude/settings.json` は、標準の `npx -y failproofai` コマンドの代わりに `bun ./bin/failproofai.mjs --hook <EventType>` を使用しています。これは、failproofai プロジェクト内で `npx -y failproofai` を実行すると自己参照の競合が発生するためです。

その他すべてのリポジトリでは、`npx -y failproofai` の使用が推奨されており、以下のコマンドでインストールできます:

```bash
failproofai policies --install --scope project
```

## コントリビューション

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## ライセンス

[LICENSE](LICENSE) を参照してください。

---

**ExosphereHost: Reliability Research Lab for Your Agents** が開発・保守しています。私たちは独自のエージェント、ソフトウェア、および専門知識を通じて、企業やスタートアップのAIエージェントの信頼性向上を支援しています。詳細は [exosphere.host](https://exosphere.host) をご覧ください。
