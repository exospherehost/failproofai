> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | **🇨🇳 简体中文** | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**语言版本**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

管理策略的最简方式，让你的 AI 智能体保持可靠、专注任务、自主运行 —— 适用于 **Claude Code** 和 **Agents SDK**。

- **30 条内置策略** - 开箱即用，捕捉常见的智能体故障模式。阻止破坏性命令、防止密钥泄露、将智能体限制在项目边界内、检测死循环等。
- **自定义策略** - 用 JavaScript 编写你自己的可靠性规则。使用 `allow`/`deny`/`instruct` API 来执行规范、防止偏差、管控操作，或与外部系统集成。
- **简便配置** - 无需编写代码即可调整任意策略。可按项目或全局设置白名单、受保护分支、阈值。三级配置作用域自动合并。
- **智能体监控** - 查看智能体在你离开时的所有操作。浏览会话记录、检查每次工具调用，精确回溯策略触发位置。

所有内容均在本地运行 —— 数据不会离开你的机器。

---

## 环境要求

- Node.js >= 20.9.0
- Bun >= 1.3.0（可选 —— 仅在开发或从源码构建时需要）

---

## 安装

```bash
npm install -g failproofai
# 或
bun add -g failproofai
```

---

## 快速开始

### 1. 全局启用策略

```bash
failproofai policies --install
```

将 hook 条目写入 `~/.claude/settings.json`。此后 Claude Code 将在每次工具调用前后自动调用 failproofai。

### 2. 启动控制台

```bash
failproofai
```

打开 `http://localhost:8020` —— 浏览会话记录、查看日志、管理策略。

### 3. 查看当前启用的策略

```bash
failproofai policies
```

---

## 策略安装

### 作用域

| 作用域 | 命令 | 写入位置 |
|--------|------|----------|
| 全局（默认） | `failproofai policies --install` | `~/.claude/settings.json` |
| 项目级 | `failproofai policies --install --scope project` | `.claude/settings.json` |
| 本地级 | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### 安装特定策略

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### 移除策略

```bash
failproofai policies --uninstall
# 或针对特定作用域：
failproofai policies --uninstall --scope project
```

---

## 配置

策略配置文件位于全局的 `~/.failproofai/policies-config.json`，或项目级的 `.failproofai/policies-config.json`。

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

**三级配置作用域**自动合并（项目级 → 本地级 → 全局）。完整合并规则请参阅 [docs/configuration.mdx](docs/configuration.mdx)。

---

## 内置策略

| 策略 | 说明 | 可配置项 |
|------|------|:--------:|
| `block-sudo` | 阻止智能体运行特权系统命令 | `allowPatterns` |
| `block-rm-rf` | 防止意外递归删除文件 | `allowPaths` |
| `block-curl-pipe-sh` | 阻止智能体将不可信脚本通过管道传入 shell | |
| `block-failproofai-commands` | 防止自卸载 | |
| `sanitize-jwt` | 阻止 JWT 令牌泄露到智能体上下文中 | |
| `sanitize-api-keys` | 阻止 API 密钥泄露到智能体上下文中 | `additionalPatterns` |
| `sanitize-connection-strings` | 阻止数据库凭据泄露到智能体上下文中 | |
| `sanitize-private-key-content` | 从输出中脱敏 PEM 私钥块 | |
| `sanitize-bearer-tokens` | 从输出中脱敏 Authorization Bearer 令牌 | |
| `block-env-files` | 阻止智能体读取 .env 文件 | |
| `protect-env-vars` | 防止智能体打印环境变量 | |
| `block-read-outside-cwd` | 将智能体限制在项目边界内 | `allowPaths` |
| `block-secrets-write` | 防止向私钥和证书文件写入内容 | `additionalPatterns` |
| `block-push-master` | 防止意外推送到 main/master 分支 | `protectedBranches` |
| `block-work-on-main` | 阻止智能体在受保护分支上操作 | `protectedBranches` |
| `block-force-push` | 阻止 `git push --force` | |
| `warn-git-amend` | 在修改提交前提醒智能体 | |
| `warn-git-stash-drop` | 在丢弃 stash 前提醒智能体 | |
| `warn-all-files-staged` | 捕获意外的 `git add -A` | |
| `warn-destructive-sql` | 在执行前捕获 DROP/DELETE SQL | |
| `warn-schema-alteration` | 在执行前捕获 ALTER TABLE | |
| `warn-large-file-write` | 捕获意外的大文件写入 | `thresholdKb` |
| `warn-package-publish` | 捕获意外的 `npm publish` | |
| `warn-background-process` | 捕获意外启动的后台进程 | |
| `warn-global-package-install` | 捕获意外的全局包安装 | |
| ……以及更多 | | |

完整策略详情和参数参考：[docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## 自定义策略

编写你自己的策略，让智能体保持可靠和专注：

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

安装方式：

```bash
failproofai policies --install --custom ./my-policies.js
```

### 决策辅助函数

| 函数 | 效果 |
|------|------|
| `allow()` | 允许该操作 |
| `allow(message)` | 允许操作，并向 Claude 发送信息性上下文 |
| `deny(message)` | 阻止操作；消息将显示给 Claude |
| `instruct(message)` | 向 Claude 的提示词中添加上下文；不阻止操作 |

### 上下文对象（`ctx`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 被调用的工具（`"Bash"`、`"Write"`、`"Read"`……） |
| `toolInput` | `object` | 工具的输入参数 |
| `payload` | `object` | 完整的原始事件负载 |
| `session.cwd` | `string` | Claude Code 会话的工作目录 |
| `session.sessionId` | `string` | 会话标识符 |
| `session.transcriptPath` | `string` | 会话记录文件路径 |

自定义 hook 支持传递式本地导入、async/await，以及访问 `process.env`。错误采用开放失败策略（记录到 `~/.failproofai/hook.log`，内置策略继续执行）。完整指南请参阅 [docs/custom-hooks.mdx](docs/custom-hooks.mdx)。

### 基于约定的策略

将 `*policies.{js,mjs,ts}` 文件放入 `.failproofai/policies/` 目录，它们会被自动加载 —— 无需 `--custom` 标志或任何配置变更。就像 git hooks 一样：放入文件即可生效。

```text
# 项目级 —— 提交到 git，与团队共享
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# 用户级 —— 个人专属，适用于所有项目
~/.failproofai/policies/my-policies.mjs
```

两个级别均会加载（取并集）。同一目录内的文件按字母顺序加载。可使用 `01-`、`02-` 等前缀控制加载顺序。开箱即用的示例请参阅 [examples/convention-policies/](examples/convention-policies/)。

---

## 遥测

Failproof AI 通过 PostHog 收集匿名使用遥测数据，以了解功能使用情况。我们从不发送任何会话内容、文件名、工具输入或个人信息。

禁用遥测：

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## 文档

| 指南 | 说明 |
|------|------|
| [入门指南](docs/getting-started.mdx) | 安装与初步使用 |
| [内置策略](docs/built-in-policies.mdx) | 全部 30 条内置策略及参数说明 |
| [自定义策略](docs/custom-policies.mdx) | 编写你自己的策略 |
| [配置](docs/configuration.mdx) | 配置文件格式与作用域合并规则 |
| [控制台](docs/dashboard.mdx) | 监控会话并查看策略活动 |
| [架构](docs/architecture.mdx) | hook 系统的工作原理 |
| [测试](docs/testing.mdx) | 运行测试与编写新测试 |

### 本地运行文档

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

在 `http://localhost:3000` 打开 Mintlify 文档站点。如果挂载 docs 目录，容器将监听文件变更：

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai 贡献者须知

本仓库的 `.claude/settings.json` 使用 `bun ./bin/failproofai.mjs --hook <EventType>` 而非标准的 `npx -y failproofai` 命令。这是因为在 failproofai 项目内部运行 `npx -y failproofai` 会产生自引用冲突。

对于所有其他仓库，推荐使用 `npx -y failproofai`，通过以下命令安装：

```bash
failproofai policies --install --scope project
```

## 参与贡献

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

请参阅 [LICENSE](LICENSE)。

---

由 **ExosphereHost: 智能体可靠性研究实验室** 构建与维护。我们通过自研智能体、软件和专业知识，帮助企业和初创公司提升 AI 智能体的可靠性。了解更多请访问 [exosphere.host](https://exosphere.host)。
