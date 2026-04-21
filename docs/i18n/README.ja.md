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

AIエージェントを安定稼働させ、タスクに集中させ、自律的に動かし続けるためのポリシー管理ツール — **Claude Code** と **Agents SDK** に対応。

- **30種類の組み込みポリシー** - よくあるエージェントの障害パターンをすぐに検出。破壊的なコマンドのブロック、シークレット漏洩の防止、プロジェクト境界内への制限、ループ検出など。
- **カスタムポリシー** - JavaScriptで独自の信頼性ルールを記述。`allow`/`deny`/`instruct` APIを使って規約の強制、ドリフトの防止、操作のゲート制御、外部システムとの連携が可能。
- **シンプルな設定** - コードを書かずにどのポリシーも調整できます。許可リスト、保護ブランチ、しきい値をプロジェクト単位またはグローバルに設定。3スコープの設定が自動マージされます。
- **エージェントモニター** - 離席中にエージェントが何をしたか把握できます。セッションの閲覧、ツール呼び出しの詳細確認、ポリシーが発火した箇所のレビューが可能。

すべてローカルで動作 — データは外部に送信されません。

---

## 動作要件

- Node.js >= 20.9.0
- Bun >= 1.3.0 （任意 — 開発時またはソースからビルドする場合のみ必要）

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

`~/.claude/settings.json` にフックエントリを書き込みます。これにより Claude Code は各ツール呼び出しの前後に failproofai を呼び出すようになります。

### 2. ダッシュボードを起動する

```bash
failproofai
```

`http://localhost:8020` が開きます — セッションの閲覧、ログの確認、ポリシーの管理ができます。

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

**3つの設定スコープ**は自動的にマージされます（プロジェクト → ローカル → グローバル）。完全なマージルールは [docs/configuration.mdx](docs/configuration.mdx) を参照してください。

---

## 組み込みポリシー

| ポリシー | 説明 | 設定可能なパラメータ |
|--------|-------------|:---:|
| `block-sudo` | エージェントが特権システムコマンドを実行するのを防ぐ | `allowPatterns` |
| `block-rm-rf` | 誤った再帰的ファイル削除を防ぐ | `allowPaths` |
| `block-curl-pipe-sh` | 信頼できないスクリプトをシェルにパイプするのを防ぐ | |
| `block-failproofai-commands` | 自己アンインストールを防ぐ | |
| `sanitize-jwt` | JWTトークンがエージェントコンテキストに漏洩するのを止める | |
| `sanitize-api-keys` | APIキーがエージェントコンテキストに漏洩するのを止める | `additionalPatterns` |
| `sanitize-connection-strings` | データベース認証情報がエージェントコンテキストに漏洩するのを止める | |
| `sanitize-private-key-content` | 出力からPEM秘密鍵ブロックを削除する | |
| `sanitize-bearer-tokens` | 出力からAuthorization Bearerトークンを削除する | |
| `block-env-files` | エージェントが.envファイルを読み取るのを防ぐ | |
| `protect-env-vars` | エージェントが環境変数を出力するのを防ぐ | |
| `block-read-outside-cwd` | エージェントをプロジェクト境界内に留める | `allowPaths` |
| `block-secrets-write` | 秘密鍵・証明書ファイルへの書き込みを防ぐ | `additionalPatterns` |
| `block-push-master` | main/masterへの誤ったプッシュを防ぐ | `protectedBranches` |
| `block-work-on-main` | エージェントを保護ブランチから遠ざける | `protectedBranches` |
| `block-force-push` | `git push --force` を防ぐ | |
| `warn-git-amend` | コミットをamendする前にエージェントに通知する | |
| `warn-git-stash-drop` | stashをdropする前にエージェントに通知する | |
| `warn-all-files-staged` | 誤った `git add -A` を検出する | |
| `warn-destructive-sql` | 実行前にDROP/DELETE SQLを検出する | |
| `warn-schema-alteration` | 実行前にALTER TABLEを検出する | |
| `warn-large-file-write` | 予期しない大きなファイル書き込みを検出する | `thresholdKb` |
| `warn-package-publish` | 誤った `npm publish` を検出する | |
| `warn-background-process` | 意図しないバックグラウンドプロセスの起動を検出する | |
| `warn-global-package-install` | 意図しないグローバルパッケージのインストールを検出する | |
| …その他 | | |

ポリシーの詳細とパラメータリファレンス: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## カスタムポリシー

エージェントを安定稼働させ、タスクに集中させるための独自ポリシーを作成できます:

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
| `allow(message)` | 操作を許可し、情報コンテキストを Claude に送信する |
| `deny(message)` | 操作をブロックする。メッセージが Claude に表示される |
| `instruct(message)` | Claude のプロンプトにコンテキストを追加する。ブロックはしない |

### コンテキストオブジェクト（`ctx`）

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 呼び出されるツール（`"Bash"`、`"Write"`、`"Read"` など） |
| `toolInput` | `object` | ツールの入力パラメータ |
| `payload` | `object` | 生のイベントペイロード全体 |
| `session.cwd` | `string` | Claude Code セッションのワーキングディレクトリ |
| `session.sessionId` | `string` | セッション識別子 |
| `session.transcriptPath` | `string` | セッションのトランスクリプトファイルへのパス |

カスタムフックは推移的なローカルインポート、async/await、`process.env` へのアクセスをサポートしています。エラーはフェイルオープン（`~/.failproofai/hook.log` に記録され、組み込みポリシーは継続）。詳細なガイドは [docs/custom-hooks.mdx](docs/custom-hooks.mdx) を参照してください。

### 規約ベースのポリシー

`*policies.{js,mjs,ts}` ファイルを `.failproofai/policies/` に置くだけで自動的に読み込まれます — フラグや設定変更は不要です。ディレクトリをgitにコミットすれば、チーム全員が同じ品質基準を自動的に適用できます。

```text
# プロジェクトレベル — gitにコミットし、チームで共有
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# ユーザーレベル — 個人用、すべてのプロジェクトに適用
~/.failproofai/policies/my-policies.mjs
```

両方のレベルが読み込まれます（ユニオン）。ファイルは各ディレクトリ内でアルファベット順に読み込まれます。読み込み順を制御するには `01-`、`02-` などのプレフィックスを付けてください。チームが新たな障害パターンを発見したら、ポリシーを追加してプッシュするだけ — 次のプル時に全員が更新を受け取ります。すぐに使えるサンプルは [examples/convention-policies/](examples/convention-policies/) を参照してください。

---

## テレメトリー

Failproof AI は機能の利用状況を把握するために、PostHog を通じて匿名の使用状況テレメトリーを収集しています。セッションの内容、ファイル名、ツールの入力、個人情報は一切送信されません。

無効にするには:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## ドキュメント

| ガイド | 説明 |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | インストールと最初のステップ |
| [Built-in Policies](docs/built-in-policies.mdx) | パラメータ付き30種類の組み込みポリシー |
| [Custom Policies](docs/custom-policies.mdx) | 独自ポリシーの作成 |
| [Configuration](docs/configuration.mdx) | 設定ファイルの形式とスコープのマージ |
| [Dashboard](docs/dashboard.mdx) | セッションの監視とポリシーアクティビティのレビュー |
| [Architecture](docs/architecture.mdx) | フックシステムの仕組み |
| [Testing](docs/testing.mdx) | テストの実行と新しいテストの作成 |

### ドキュメントをローカルで実行する

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` でMintlifyドキュメントサイトが開きます。docsディレクトリをマウントすると、コンテナは変更を監視します:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofaiコントリビューターへのご注意

このリポジトリの `.claude/settings.json` は、標準の `npx -y failproofai` コマンドの代わりに `bun ./bin/failproofai.mjs --hook <EventType>` を使用しています。これは failproofai プロジェクト内で `npx -y failproofai` を実行すると自己参照の競合が発生するためです。

その他のリポジトリでは、推奨される方法は `npx -y failproofai` で、以下のコマンドでインストールします:

```bash
failproofai policies --install --scope project
```

## コントリビューション

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## ライセンス

[LICENSE](LICENSE) を参照してください。

---

**ExosphereHost: Reliability Research Lab for Your Agents** が開発・メンテナンスしています。私たちは独自のエージェント、ソフトウェア、専門知識を通じて、企業やスタートアップのAIエージェントの信頼性向上を支援しています。詳細は [exosphere.host](https://exosphere.host) をご覧ください。
