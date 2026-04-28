> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | **🇻🇳 Tiếng Việt** | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Bản dịch**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

Cách dễ nhất để quản lý các chính sách giữ cho các AI agent của bạn đáng tin cậy, tập trung vào mục tiêu và chạy tự động - cho **Claude Code**, **OpenAI Codex** & **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

## CLI agent được hỗ trợ

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
  <strong>+ những tính năng khác sắp ra mắt</strong>
</p>

> Cài đặt hook cho một hoặc cả hai: `failproofai policies --install --cli codex` (hoặc `--cli claude codex`). Bỏ qua `--cli` để tự động phát hiện CLI được cài đặt và nhắc nhở.

- **39 Chính sách có sẵn** - Bắt các chế độ lỗi agent phổ biến ngay từ đầu. Chặn các lệnh phá hủy, ngăn chặn rò rỉ bí mật, giữ agent trong ranh giới dự án, phát hiện vòng lặp và hơn thế nữa.
- **Chính sách tùy chỉnh** - Viết các quy tắc độ tin cậy của riêng bạn bằng JavaScript. Sử dụng API `allow`/`deny`/`instruct` để thực thi quy ước, ngăn chặn xung đột, kiểm soát hoạt động hoặc tích hợp với các hệ thống bên ngoài.
- **Cấu hình dễ dàng** - Tinh chỉnh bất kỳ chính sách nào mà không cần viết mã. Đặt danh sách cho phép, các nhánh được bảo vệ, ngưỡng theo dự án hoặc toàn cầu. Ba cấu hình phạm vi được hợp nhất tự động.
- **Giám sát Agent** - Xem agent của bạn đã làm gì khi bạn vắng mặt. Duyệt các phiên, kiểm tra từng lệnh gọi công cụ và xem lại chính xác nơi các chính sách có hiệu lực.

Mọi thứ chạy cục bộ - không có dữ liệu nào rời khỏi máy của bạn.

---

## Yêu cầu

- Node.js >= 20.9.0
- Bun >= 1.3.0 (tùy chọn - chỉ cần thiết để phát triển / xây dựng từ nguồn)

---

## Cài đặt

```bash
npm install -g failproofai
# hoặc
bun add -g failproofai
```

---

## Bắt đầu nhanh

### 1. Bật chính sách toàn cầu

```bash
failproofai policies --install
```

Ghi các mục hook vào `~/.claude/settings.json`. Claude Code sẽ gọi failproofai trước và sau mỗi lệnh gọi công cụ.

### 2. Khởi chạy bảng điều khiển

```bash
failproofai
```

Mở `http://localhost:8020` - duyệt các phiên, kiểm tra nhật ký, quản lý chính sách.

### 3. Kiểm tra những gì đang hoạt động

```bash
failproofai policies
```

---

## Cài đặt chính sách

### Phạm vi

| Phạm vi | Lệnh | Nơi nó ghi |
|--------|------|-----------|
| Toàn cầu (mặc định) | `failproofai policies --install` | `~/.claude/settings.json` |
| Dự án | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Cục bộ | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Cài đặt chính sách cụ thể

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Xóa chính sách

```bash
failproofai policies --uninstall
# hoặc đối với một phạm vi cụ thể:
failproofai policies --uninstall --scope project
```

---

## Cấu hình

Cấu hình chính sách nằm trong `~/.failproofai/policies-config.json` (toàn cầu) hoặc `.failproofai/policies-config.json` trong dự án của bạn (cho mỗi dự án).

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

**Ba phạm vi cấu hình** được hợp nhất tự động (dự án → cục bộ → toàn cầu). Xem [docs/configuration.mdx](docs/configuration.mdx) để biết các quy tắc hợp nhất đầy đủ.

---

## Chính sách có sẵn

| Chính sách | Mô tả | Có thể cấu hình |
|-----------|-------|:---:|
| `block-sudo` | Ngăn chặn agent chạy các lệnh hệ thống có đặc quyền | `allowPatterns` |
| `block-rm-rf` | Ngăn chặn xóa tệp đệ quy vô tình | `allowPaths` |
| `block-curl-pipe-sh` | Ngăn chặn agent từ việc ống dẫn các tập lệnh không đáng tin cậy đến shell | |
| `block-failproofai-commands` | Ngăn chặn tự gỡ cài đặt | |
| `sanitize-jwt` | Dừng token JWT từ rò rỉ vào ngữ cảnh agent | |
| `sanitize-api-keys` | Dừng khóa API từ rò rỉ vào ngữ cảnh agent | `additionalPatterns` |
| `sanitize-connection-strings` | Dừng thông tin đăng nhập cơ sở dữ liệu từ rò rỉ vào ngữ cảnh agent | |
| `sanitize-private-key-content` | Làm sạch các khối khóa riêng PEM khỏi đầu ra | |
| `sanitize-bearer-tokens` | Làm sạch token Bearer Ủy quyền khỏi đầu ra | |
| `block-env-files` | Giữ agent không đọc tệp .env | |
| `protect-env-vars` | Ngăn chặn agent in các biến môi trường | |
| `block-read-outside-cwd` | Giữ agent bên trong ranh giới dự án | `allowPaths` |
| `block-secrets-write` | Ngăn chặn ghi vào các tệp khóa riêng và chứng chỉ | `additionalPatterns` |
| `block-push-master` | Ngăn chặn đẩy vô tình đến main/master | `protectedBranches` |
| `block-work-on-main` | Giữ agent ra khỏi các nhánh được bảo vệ | `protectedBranches` |
| `block-force-push` | Ngăn chặn `git push --force` | |
| `warn-git-amend` | Nhắc nhở agent trước khi sửa đổi cam kết | |
| `warn-git-stash-drop` | Nhắc nhở agent trước khi loại bỏ stash | |
| `warn-all-files-staged` | Bắt `git add -A` vô tình | |
| `warn-destructive-sql` | Bắt DROP/DELETE SQL trước khi thực thi | |
| `warn-schema-alteration` | Bắt ALTER TABLE trước khi thực thi | |
| `warn-large-file-write` | Bắt ghi tệp lớn bất ngờ | `thresholdKb` |
| `warn-package-publish` | Bắt `npm publish` vô tình | |
| `warn-background-process` | Bắt khởi động quy trình nền không có ý định | |
| `warn-global-package-install` | Bắt cài đặt gói toàn cầu không có ý định | |
| …và nhiều hơn nữa | | |

Chi tiết chính sách đầy đủ và tham chiếu tham số: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Chính sách tùy chỉnh

Viết các chính sách của riêng bạn để giữ cho agent đáng tin cậy và tập trung vào mục tiêu:

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

Cài đặt bằng:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Trợ giúp ra quyết định

| Hàm | Hiệu ứng |
|-----|---------|
| `allow()` | Cho phép hoạt động |
| `allow(message)` | Cho phép và gửi ngữ cảnh thông tin đến Claude |
| `deny(message)` | Chặn hoạt động; tin nhắn được hiển thị cho Claude |
| `instruct(message)` | Thêm ngữ cảnh vào dấu nhắc của Claude; không chặn |

### Đối tượng ngữ cảnh (`ctx`)

| Trường | Loại | Mô tả |
|-------|------|-------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Công cụ được gọi (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Tham số đầu vào của công cụ |
| `payload` | `object` | Payload sự kiện thô đầy đủ |
| `session.cwd` | `string` | Thư mục làm việc của phiên Claude Code |
| `session.sessionId` | `string` | Mã định danh phiên |
| `session.transcriptPath` | `string` | Đường dẫn đến tệp phiên tạm dịch |

Hook tùy chỉnh hỗ trợ nhập cục bộ transitives, async/await và truy cập vào `process.env`. Lỗi được không chặn (được ghi vào `~/.failproofai/hook.log`, các chính sách có sẵn tiếp tục). Xem [docs/custom-hooks.mdx](docs/custom-hooks.mdx) để xem hướng dẫn đầy đủ.

### Chính sách dựa trên quy ước

Thả các tệp `*policies.{js,mjs,ts}` vào `.failproofai/policies/` và chúng sẽ tự động tải - không cần cờ hoặc thay đổi cấu hình. Commit thư mục để git và mọi thành viên trong nhóm đều nhận được các tiêu chuẩn chất lượng tương tự tự động.

```text
# Cấp độ dự án — được commit vào git, được chia sẻ với nhóm
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Cấp độ người dùng — cá nhân, áp dụng cho tất cả dự án
~/.failproofai/policies/my-policies.mjs
```

Cả hai cấp độ đều tải (liên hiệp). Các tệp được tải theo thứ tự bảng chữ cái trong mỗi thư mục. Tiền tố với `01-`, `02-`, v.v. để kiểm soát thứ tự. Khi nhóm của bạn khám phá các chế độ lỗi mới, hãy thêm một chính sách và đẩy — mọi người sẽ nhận được bản cập nhật khi pull tiếp theo. Xem [examples/convention-policies/](examples/convention-policies/) để tìm các ví dụ sẵn sàng sử dụng.

---

## Telemetry

Failproof AI thu thập dữ liệu telemetry sử dụng ẩn danh thông qua PostHog để hiểu cách sử dụng tính năng. Không bao giờ gửi nội dung phiên, tên tệp, đầu vào công cụ hoặc thông tin cá nhân.

Vô hiệu hóa nó:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Tài liệu

| Hướng dẫn | Mô tả |
|---------|-------|
| [Bắt đầu](docs/getting-started.mdx) | Cài đặt và các bước đầu tiên |
| [Chính sách có sẵn](docs/built-in-policies.mdx) | Tất cả 39 chính sách có sẵn với tham số |
| [Chính sách tùy chỉnh](docs/custom-policies.mdx) | Viết các chính sách của riêng bạn |
| [Cấu hình](docs/configuration.mdx) | Định dạng tệp cấu hình và hợp nhất phạm vi |
| [Bảng điều khiển](docs/dashboard.mdx) | Giám sát phiên và xem lại hoạt động chính sách |
| [Kiến trúc](docs/architecture.mdx) | Cách hệ thống hook hoạt động |
| [Thử nghiệm](docs/testing.mdx) | Chạy thử nghiệm và viết những cái mới |

### Chạy tài liệu cục bộ

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mở trang tài liệu Mintlify tại `http://localhost:3000`. Vùng chứa theo dõi các thay đổi nếu bạn gắn thư mục tài liệu:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Lưu ý cho những người đóng góp failproofai

`~/.claude/settings.json` của repo này sử dụng `bun ./bin/failproofai.mjs --hook <EventType>` thay vì lệnh `npx -y failproofai` tiêu chuẩn. Điều này là vì chạy `npx -y failproofai` bên trong chính dự án failproofai tạo ra một xung đột tự tham chiếu.

Đối với tất cả các repo khác, cách tiếp cận được khuyến nghị là `npx -y failproofai`, được cài đặt thông qua:

```bash
failproofai policies --install --scope project
```

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Giấy phép

Xem [LICENSE](LICENSE).

---

Được xây dựng và duy trì bởi **ExosphereHost: Phòng thí nghiệm Nghiên cứu Độ tin cậy cho Agent của bạn**. Chúng tôi giúp các doanh nghiệp và khởi nghiệp cải thiện độ tin cậy của các AI agent của họ thông qua các agent, phần mềm và chuyên môn của chính chúng tôi. Tìm hiểu thêm tại [exosphere.host](https://exosphere.host).
