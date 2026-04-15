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

**Claude Code** と **Agents SDK** 向けに、AIエージェントを安定して動作させ、タスクに集中させ、自律的に実行し続けるためのポリシー管理ツール。

- **30種類の組み込みポリシー** - エージェントによくある障害パターンをすぐに検出。破壊的なコマンドのブロック、シークレットの漏洩防止、エージェントをプロジェクトの範囲内に制限、ループ検出など。
- **カスタムポリシー** - JavaScriptで独自の信頼性ルールを記述。`allow`/`deny`/`instruct` APIを使ってコーディング規約の強制、ドリフト防止、操作のゲート制御、外部システムとの連携が可能。
- **シンプルな設定** - コードを書かずにポリシーを調整。許可リスト、保護ブランチ、閾値をプロジェクト単位またはグローバルに設定可能。3段階のスコープ設定は自動でマージされる。
- **エージェントモニター** - 不在中にエージェントが何をしたか確認。セッションを閲覧し、すべてのツール呼び出しを検査し、ポリシーが発動した箇所を正確に確認できる。

すべてローカルで動作 - データが外部に送信されることはありません。

---

## 動作要件

- Node.js >= 20.9.0
- Bun >= 1.3.0（任意 - 開発時またはソースからビルドする場合のみ必要）

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

`~/.claude/settings.json` にフックエントリを書き込みます。以降、Claude Code は各ツール呼び出しの前後に failproofai を実行します。

### 2. ダッシュボードを起動

```bash
failproofai
```

`http://localhost:8020` が開きます - セッションの閲覧、ログの検査、ポリシーの管理ができます。

### 3. 有効なポリシーを確認

```bash
failproofai policies
```

---

## ポリシーのインストール

### スコープ

| スコープ | コマンド | 書き込み先 |
|---------|---------|-----------|
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
# または特定のスコープを指定:
failproofai policies --uninstall --scope project
```

---

## 設定

ポリシーの設定ファイルは、グローバルの場合は `~/.failproofai/policies-config.json`、プロジェクト単位の場合はプロジェクト内の `.failproofai/policies-config.json` に配置します。

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
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"]
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"]
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

**3段階の設定スコープ**は自動でマージされます（プロジェクト → ローカル → グローバル）。マージルールの詳細は [docs/configuration.mdx](docs/configuration.mdx) を参照してください。

---

## 組み込みポリシー

| ポリシー | 説明 | 設定項目 |
|---------|------|:-------:|
| `block-sudo` | 特権システムコマンドの実行を防止 | `allowPatterns` |
| `block-rm-rf` | 誤った再帰的ファイル削除を防止 | `allowPaths` |
| `block-curl-pipe-sh` | 信頼できないスクリプトのシェルへのパイプ実行を防止 | |
| `block-failproofai-commands` | 自己アンインストールを防止 | |
| `sanitize-jwt` | JWTトークンがエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-api-keys` | APIキーがエージェントのコンテキストに漏洩するのを防止 | `additionalPatterns` |
| `sanitize-connection-strings` | データベース認証情報がエージェントのコンテキストに漏洩するのを防止 | |
| `sanitize-private-key-content` | 出力からPEM秘密鍵ブロックを削除 | |
| `sanitize-bearer-tokens` | 出力からAuthorization Bearerトークンを削除 | |
| `block-env-files` | エージェントによる .env ファイルの読み取りを防止 | |
| `protect-env-vars` | エージェントによる環境変数の出力を防止 | |
| `block-read-outside-cwd` | エージェントをプロジェクトの境界内に制限 | `allowPaths` |
| `block-secrets-write` | 秘密鍵や証明書ファイルへの書き込みを防止 | `additionalPatterns` |
| `block-push-master` | main/master への誤ったプッシュを防止 | `protectedBranches` |
| `block-work-on-main` | エージェントが保護ブランチで作業するのを防止 | `protectedBranches` |
| `block-force-push` | `git push --force` を防止 | |
| `warn-git-amend` | コミット修正前にエージェントに通知 | |
| `warn-git-stash-drop` | スタッシュ削除前にエージェントに通知 | |
| `warn-all-files-staged` | 誤った `git add -A` を検出 | |
| `warn-destructive-sql` | 実行前に DROP/DELETE SQL を検出 | |
| `warn-schema-alteration` | 実行前に ALTER TABLE を検出 | |
| `warn-large-file-write` | 予期せず大きなファイル書き込みを検出 | `thresholdKb` |
| `warn-package-publish` | 誤った `npm publish` を検出 | |
| `warn-background-process` | 意図しないバックグラウンドプロセスの起動を検出 | |
| `warn-global-package-install` | 意図しないグローバルパッケージのインストールを検出 | |
| …その他多数 | | |

ポリシーの詳細とパラメーターリファレンス: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## カスタムポリシー

エージェントを安定させ、タスクに集中させるための独自ポリシーを作成できます：

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

以下のコマンドでインストール：

```bash
failproofai policies --install --custom ./my-policies.js
```

### 判定ヘルパー

| 関数 | 効果 |
|------|------|
| `allow()` | 操作を許可 |
| `allow(message)` | 許可し、Claude に情報コンテキストを送信 *（ベータ）* |
| `deny(message)` | 操作をブロック。メッセージが Claude に表示される |
| `instruct(message)` | Claude のプロンプトにコンテキストを追加。ブロックはしない |

### コンテキストオブジェクト（`ctx`）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 呼び出されるツール（`"Bash"`、`"Write"`、`"Read"`、…） |
| `toolInput` | `object` | ツールの入力パラメーター |
| `payload` | `object` | 完全な生イベントペイロード |
| `session.cwd` | `string` | Claude Code セッションの作業ディレクトリ |
| `session.sessionId` | `string` | セッション識別子 |
| `session.transcriptPath` | `string` | セッションのトランスクリプトファイルへのパス |

カスタムフックは、推移的なローカルインポート、async/await、`process.env` へのアクセスをサポートしています。エラーはフェイルオープン方式で処理されます（`~/.failproofai/hook.log` にログが記録され、組み込みポリシーは継続して動作します）。詳細は [docs/custom-hooks.mdx](docs/custom-hooks.mdx) を参照してください。

---

## テレメトリ

Failproof AI は、機能の利用状況を把握するために PostHog を通じて匿名の使用状況テレメトリを収集します。セッションの内容、ファイル名、ツールの入力、個人情報は一切送信されません。

無効化するには：

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## ドキュメント

| ガイド | 説明 |
|--------|------|
| [Getting Started](docs/getting-started.mdx) | インストールと最初のステップ |
| [Built-in Policies](docs/built-in-policies.mdx) | 全30種類の組み込みポリシーとパラメーター |
| [Custom Policies](docs/custom-policies.mdx) | 独自ポリシーの作成方法 |
| [Configuration](docs/configuration.mdx) | 設定ファイルの形式とスコープのマージ |
| [Dashboard](docs/dashboard.mdx) | セッションの監視とポリシーアクティビティの確認 |
| [Architecture](docs/architecture.mdx) | フックシステムの仕組み |
| [Testing](docs/testing.mdx) | テストの実行と新規テストの作成 |

### ドキュメントをローカルで実行

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` で Mintlify ドキュメントサイトが開きます。docs ディレクトリをマウントすると、変更をウォッチします：

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## コントリビューション

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## ライセンス

[LICENSE](LICENSE) を参照してください。
