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

AIエージェントの信頼性を保ち、タスクに集中させ、自律的に動作させるためのポリシー管理ツール — **Claude Code** と **Agents SDK** に対応。

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **30種類のビルトインポリシー** - よくあるエージェントの障害パターンをすぐに検知。破壊的なコマンドのブロック、シークレットの漏洩防止、エージェントをプロジェクト境界内に維持、ループ検知など。
- **カスタムポリシー** - JavaScriptで独自の信頼性ルールを記述。`allow`/`deny`/`instruct` APIを使って、規約の強制、ドリフトの防止、オペレーションのゲート処理、外部システムとの連携が可能。
- **簡単な設定** - コードを書かずにポリシーを調整。許可リスト、保護ブランチ、しきい値をプロジェクトごとまたはグローバルに設定。3段階のスコープ設定が自動でマージされる。
- **エージェントモニター** - 不在中にエージェントが何をしたか確認。セッションを閲覧し、すべてのツール呼び出しを検査し、ポリシーが発動した場所を正確に確認。

すべてローカルで動作 — データがマシンの外に出ることはありません。

---

## 動作要件

- Node.js >= 20.9.0
- Bun >= 1.3.0（オプション — 開発時またはソースからのビルド時のみ必要）

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

`~/.claude/settings.json` にフックエントリを書き込みます。これにより、Claude Code が各ツール呼び出しの前後に failproofai を起動するようになります。

### 2. ダッシュボードを起動

```bash
failproofai
```

`http://localhost:8020` を開きます — セッションの閲覧、ログの確認、ポリシーの管理が可能です。

### 3. アクティブなポリシーを確認

```bash
failproofai policies
```

---

## ポリシーのインストール

### スコープ

| スコープ | コマンド | 書き込み先 |
|----------|---------|-----------|
| グローバル（デフォルト） | `failproofai policies --install` | `~/.claude/settings.json` |
| プロジェクト | `failproofai policies --install --scope project` | `.claude/settings.json` |
| ローカル | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### 特定のポリシーをインストール

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### ポリシーの削除

```bash
failproofai policies --uninstall
# または特定のスコープを指定:
failproofai policies --uninstall --scope project
```

---

## 設定

ポリシーの設定は `~/.failproofai/policies-config.json`（グローバル）またはプロジェクト内の `.failproofai/policies-config.json`（プロジェクトごと）に保存されます。

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

**3段階の設定スコープ**は自動的にマージされます（プロジェクト → ローカル → グローバル）。完全なマージルールについては [docs/configuration.mdx](docs/configuration.mdx) を参照してください。

---

## ビルトインポリシー

| ポリシー | 説明 | 設定可能なパラメータ |
|----------|------|:---:|
| `block-sudo` | エージェントによる特権システムコマンドの実行を防止 | `allowPatterns` |
| `block-rm-rf` | 誤った再帰的ファイル削除を防止 | `allowPaths` |
| `block-curl-pipe-sh` | 信頼できないスクリプトをシェルにパイプすることを防止 | |
| `block-failproofai-commands` | 自己アンインストールを防止 | |
| `sanitize-jwt` | JWTトークンがエージェントコンテキストに漏洩するのを防止 | |
| `sanitize-api-keys` | APIキーがエージェントコンテキストに漏洩するのを防止 | `additionalPatterns` |
| `sanitize-connection-strings` | データベース認証情報がエージェントコンテキストに漏洩するのを防止 | |
| `sanitize-private-key-content` | 出力からPEM秘密鍵ブロックを削除 | |
| `sanitize-bearer-tokens` | 出力からAuthorization Bearerトークンを削除 | |
| `block-env-files` | エージェントによる.envファイルの読み取りを防止 | |
| `protect-env-vars` | エージェントによる環境変数の出力を防止 | |
| `block-read-outside-cwd` | エージェントをプロジェクト境界内に維持 | `allowPaths` |
| `block-secrets-write` | 秘密鍵・証明書ファイルへの書き込みを防止 | `additionalPatterns` |
| `block-push-master` | main/masterへの誤ったプッシュを防止 | `protectedBranches` |
| `block-work-on-main` | エージェントを保護ブランチから遠ざける | `protectedBranches` |
| `block-force-push` | `git push --force` を防止 | |
| `warn-git-amend` | コミット修正前にエージェントに通知 | |
| `warn-git-stash-drop` | スタッシュ削除前にエージェントに通知 | |
| `warn-all-files-staged` | 誤った `git add -A` を検知 | |
| `warn-destructive-sql` | 実行前にDROP/DELETE SQLを検知 | |
| `warn-schema-alteration` | 実行前にALTER TABLEを検知 | |
| `warn-large-file-write` | 予期せず大きなファイル書き込みを検知 | `thresholdKb` |
| `warn-package-publish` | 誤った `npm publish` を検知 | |
| `warn-background-process` | 意図しないバックグラウンドプロセスの起動を検知 | |
| `warn-global-package-install` | 意図しないグローバルパッケージのインストールを検知 | |
| …その他 | | |

ポリシーの詳細とパラメータリファレンス: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## カスタムポリシー

エージェントの信頼性を維持し、タスクに集中させるための独自ポリシーを作成できます:

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

| 関数 | 効果 |
|------|------|
| `allow()` | 操作を許可 |
| `allow(message)` | 操作を許可し、情報的なコンテキストを Claude に送信 |
| `deny(message)` | 操作をブロック。メッセージが Claude に表示される |
| `instruct(message)` | Claudeのプロンプトにコンテキストを追加。ブロックはしない |

### コンテキストオブジェクト（`ctx`）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 呼び出されるツール（`"Bash"`、`"Write"`、`"Read"`、…） |
| `toolInput` | `object` | ツールの入力パラメータ |
| `payload` | `object` | 完全な生のイベントペイロード |
| `session.cwd` | `string` | Claude Code セッションの作業ディレクトリ |
| `session.sessionId` | `string` | セッション識別子 |
| `session.transcriptPath` | `string` | セッションのトランスクリプトファイルへのパス |

カスタムフックは、推移的なローカルインポート、async/await、`process.env` へのアクセスをサポートしています。エラーはフェイルオープンで処理されます（`~/.failproofai/hook.log` に記録され、ビルトインポリシーは継続して動作します）。詳細なガイドは [docs/custom-hooks.mdx](docs/custom-hooks.mdx) を参照してください。

### 規約ベースのポリシー

`.failproofai/policies/` ディレクトリに `*policies.{js,mjs,ts}` ファイルを置くだけで自動的に読み込まれます — フラグや設定変更は不要です。このディレクトリをgitにコミットすれば、チームメンバー全員が同じ品質基準を自動的に共有できます。

```text
# プロジェクトレベル — gitにコミットしてチームで共有
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# ユーザーレベル — 個人用。すべてのプロジェクトに適用
~/.failproofai/policies/my-policies.mjs
```

両方のレベルが読み込まれます（ユニオン）。ファイルは各ディレクトリ内でアルファベット順に読み込まれます。順序を制御するには `01-`、`02-` などのプレフィックスを付けてください。チームが新しい障害パターンを発見したら、ポリシーを追加してプッシュするだけ — 次のプル時に全員が更新を受け取ります。すぐに使えるサンプルは [examples/convention-policies/](examples/convention-policies/) を参照してください。

---

## テレメトリー

Failproof AI は機能の利用状況を把握するために、PostHog を通じて匿名の使用状況テレメトリーを収集しています。セッションの内容、ファイル名、ツールの入力、個人情報は一切送信されません。

無効にする方法:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## ドキュメント

| ガイド | 説明 |
|--------|------|
| [Getting Started](docs/getting-started.mdx) | インストールと最初のステップ |
| [Built-in Policies](docs/built-in-policies.mdx) | パラメータ付き30種類のビルトインポリシー |
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

`http://localhost:3000` でMintlifyドキュメントサイトが開きます。docsディレクトリをマウントすると、変更を監視します:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai コントリビューターへの注意事項

このリポジトリの `.claude/settings.json` では、標準的な `npx -y failproofai` コマンドの代わりに `bun ./bin/failproofai.mjs --hook <EventType>` を使用しています。これは、failproofai プロジェクト内で `npx -y failproofai` を実行すると自己参照の競合が発生するためです。

その他のすべてのリポジトリでは、推奨されるアプローチは `npx -y failproofai` を使用することで、以下のコマンドでインストールできます:

```bash
failproofai policies --install --scope project
```

## コントリビュート

[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## ライセンス

[LICENSE](LICENSE) を参照してください。

---

**ExosphereHost: Reliability Research Lab for Your Agents** によって構築・メンテナンスされています。私たちは独自のエージェント、ソフトウェア、専門知識を通じて、企業やスタートアップがAIエージェントの信頼性を向上させるお手伝いをしています。詳細は [exosphere.host](https://exosphere.host) をご覧ください。
