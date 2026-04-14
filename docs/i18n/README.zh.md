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

**其他语言版本**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

管理策略的最简单方式，让你的 AI 智能体保持可靠、专注任务、自主运行——适用于 **Claude Code** 和 **Agents SDK**。

- **30 条内置策略** - 开箱即用，覆盖常见智能体故障模式。拦截破坏性命令、防止密钥泄露、将智能体限制在项目目录内、检测循环等。
- **自定义策略** - 用 JavaScript 编写你自己的可靠性规则。使用 `allow`/`deny`/`instruct` API 来强制规范、防止偏离、控制操作，或与外部系统集成。
- **便捷配置** - 无需编写代码即可调整任何策略。按项目或全局设置白名单、受保护分支、阈值。三级配置作用域自动合并。
- **智能体监控** - 查看智能体在你离开期间做了什么。浏览会话、检查每次工具调用，以及精确回溯策略触发位置。

所有操作均在本地运行——数据不会离开你的机器。

---

## 环境要求

- Node.js >= 20.9.0
- Bun >= 1.3.0（可选——仅在开发/从源码构建时需要）

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

### 2. 启动仪表盘

```bash
failproofai
```

打开 `http://localhost:8020`——浏览会话、检查日志、管理策略。

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
| 项目 | `failproofai policies --install --scope project` | `.claude/settings.json` |
| 本地 | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### 安装指定策略

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

策略配置存放于 `~/.failproofai/policies-config.json`（全局），或项目目录下的 `.failproofai/policies-config.json`（按项目）。

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

**三级配置作用域**自动合并（项目 → 本地 → 全局）。完整合并规则请参阅 [docs/configuration.mdx](docs/configuration.mdx)。

---

## 内置策略

| 策略 | 描述 | 可配置项 |
|------|------|:--------:|
| `block-sudo` | 防止智能体执行特权系统命令 | `allowPatterns` |
| `block-rm-rf` | 防止意外递归删除文件 | `allowPaths` |
| `block-curl-pipe-sh` | 防止智能体将不可信脚本通过管道传入 shell | |
| `block-failproofai-commands` | 防止自我卸载 | |
| `sanitize-jwt` | 防止 JWT 令牌泄露到智能体上下文 | |
| `sanitize-api-keys` | 防止 API 密钥泄露到智能体上下文 | `additionalPatterns` |
| `sanitize-connection-strings` | 防止数据库凭证泄露到智能体上下文 | |
| `sanitize-private-key-content` | 从输出中脱敏 PEM 私钥块 | |
| `sanitize-bearer-tokens` | 从输出中脱敏 Authorization Bearer 令牌 | |
| `block-env-files` | 防止智能体读取 .env 文件 | |
| `protect-env-vars` | 防止智能体打印环境变量 | |
| `block-read-outside-cwd` | 将智能体限制在项目目录范围内 | `allowPaths` |
| `block-secrets-write` | 防止向私钥和证书文件写入内容 | `additionalPatterns` |
| `block-push-master` | 防止意外推送到 main/master 分支 | `protectedBranches` |
| `block-work-on-main` | 禁止智能体在受保护分支上操作 | `protectedBranches` |
| `block-force-push` | 防止执行 `git push --force` | |
| `warn-git-amend` | 在修改提交前提醒智能体 | |
| `warn-git-stash-drop` | 在删除 stash 前提醒智能体 | |
| `warn-all-files-staged` | 捕获意外的 `git add -A` 操作 | |
| `warn-destructive-sql` | 在执行前捕获 DROP/DELETE SQL | |
| `warn-schema-alteration` | 在执行前捕获 ALTER TABLE 语句 | |
| `warn-large-file-write` | 捕获意外的大文件写入操作 | `thresholdKb` |
| `warn-package-publish` | 捕获意外的 `npm publish` 操作 | |
| `warn-background-process` | 捕获意外的后台进程启动 | |
| `warn-global-package-install` | 捕获意外的全局包安装 | |
| ……以及更多 | | |

完整策略详情及参数参考：[docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## 自定义策略

编写你自己的策略，确保智能体可靠且专注任务：

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

使用以下命令安装：

```bash
failproofai policies --install --custom ./my-policies.js
```

### 决策辅助函数

| 函数 | 效果 |
|------|------|
| `allow()` | 允许该操作 |
| `allow(message)` | 允许并向 Claude 发送信息上下文 *（测试版）* |
| `deny(message)` | 阻止该操作；消息将显示给 Claude |
| `instruct(message)` | 向 Claude 的提示词添加上下文；不阻止操作 |

### 上下文对象（`ctx`）

| 字段 | 类型 | 描述 |
|------|------|------|
| `eventType` | `string` | `"PreToolUse"`、`"PostToolUse"`、`"Notification"`、`"Stop"` |
| `toolName` | `string` | 被调用的工具（`"Bash"`、`"Write"`、`"Read"`……） |
| `toolInput` | `object` | 工具的输入参数 |
| `payload` | `object` | 完整的原始事件载荷 |
| `session.cwd` | `string` | Claude Code 会话的工作目录 |
| `session.sessionId` | `string` | 会话标识符 |
| `session.transcriptPath` | `string` | 会话记录文件路径 |

自定义 hook 支持传递式本地导入、async/await 以及访问 `process.env`。错误采用失败开放策略（记录到 `~/.failproofai/hook.log`，内置策略继续运行）。完整指南请参阅 [docs/custom-hooks.mdx](docs/custom-hooks.mdx)。

---

## 遥测

Failproof AI 通过 PostHog 收集匿名使用遥测数据，以便了解功能使用情况。不会发送任何会话内容、文件名、工具输入或个人信息。

禁用方式：

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## 文档

| 指南 | 描述 |
|------|------|
| [快速入门](docs/getting-started.mdx) | 安装与初始步骤 |
| [内置策略](docs/built-in-policies.mdx) | 全部 30 条内置策略及参数说明 |
| [自定义策略](docs/custom-policies.mdx) | 编写你自己的策略 |
| [配置](docs/configuration.mdx) | 配置文件格式与作用域合并 |
| [仪表盘](docs/dashboard.mdx) | 监控会话并查看策略活动 |
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

## 贡献

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

请参阅 [LICENSE](LICENSE)。
