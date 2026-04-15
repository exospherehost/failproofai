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

Cách đơn giản nhất để quản lý các chính sách giúp AI agent của bạn hoạt động ổn định, đúng nhiệm vụ và chạy tự động - dành cho **Claude Code** & **Agents SDK**.

- **30 Chính sách tích hợp sẵn** - Phát hiện các lỗi phổ biến của agent ngay từ đầu. Chặn các lệnh nguy hiểm, ngăn rò rỉ thông tin bí mật, giữ agent trong phạm vi dự án, phát hiện vòng lặp vô hạn và nhiều hơn nữa.
- **Chính sách tùy chỉnh** - Tự viết các quy tắc đảm bảo độ tin cậy bằng JavaScript. Sử dụng API `allow`/`deny`/`instruct` để áp dụng quy ước, ngăn sai lệch, kiểm soát thao tác, hoặc tích hợp với hệ thống bên ngoài.
- **Cấu hình dễ dàng** - Tinh chỉnh bất kỳ chính sách nào mà không cần viết code. Đặt danh sách cho phép, nhánh được bảo vệ, ngưỡng giới hạn theo từng dự án hoặc toàn cục. Ba phạm vi cấu hình được hợp nhất tự động.
- **Agent Monitor** - Xem lại những gì agent đã làm khi bạn vắng mặt. Duyệt qua các phiên làm việc, kiểm tra từng lần gọi công cụ, và xem chính xác nơi các chính sách được kích hoạt.

Mọi thứ đều chạy cục bộ - không có dữ liệu nào rời khỏi máy của bạn.

---

## Yêu cầu

- Node.js >= 20.9.0
- Bun >= 1.3.0 (tùy chọn - chỉ cần thiết cho việc phát triển / build từ mã nguồn)

---

## Cài đặt

```bash
npm install -g failproofai
# hoặc
bun add -g failproofai
```

---

## Bắt đầu nhanh

### 1. Kích hoạt chính sách toàn cục

```bash
failproofai policies --install
```

Ghi các mục hook vào `~/.claude/settings.json`. Claude Code sẽ gọi failproofai trước và sau mỗi lần gọi công cụ.

### 2. Khởi chạy bảng điều khiển

```bash
failproofai
```

Mở `http://localhost:8020` - duyệt phiên làm việc, kiểm tra log, quản lý chính sách.

### 3. Kiểm tra những gì đang hoạt động

```bash
failproofai policies
```

---

## Cài đặt chính sách

### Phạm vi

| Phạm vi | Lệnh | Vị trí ghi |
|---------|------|------------|
| Toàn cục (mặc định) | `failproofai policies --install` | `~/.claude/settings.json` |
| Dự án | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Cục bộ | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Cài đặt các chính sách cụ thể

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Gỡ bỏ chính sách

```bash
failproofai policies --uninstall
# hoặc cho một phạm vi cụ thể:
failproofai policies --uninstall --scope project
```

---

## Cấu hình

Cấu hình chính sách nằm trong `~/.failproofai/policies-config.json` (toàn cục) hoặc `.failproofai/policies-config.json` trong dự án của bạn (theo từng dự án).

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

**Ba phạm vi cấu hình** được hợp nhất tự động (project → local → global). Xem [docs/configuration.mdx](docs/configuration.mdx) để biết đầy đủ quy tắc hợp nhất.

---

## Chính sách tích hợp sẵn

| Chính sách | Mô tả | Có thể cấu hình |
|-----------|-------|:---:|
| `block-sudo` | Ngăn agent chạy các lệnh hệ thống đặc quyền | `allowPatterns` |
| `block-rm-rf` | Ngăn xóa file đệ quy không cố ý | `allowPaths` |
| `block-curl-pipe-sh` | Ngăn agent chuyển các script không tin cậy vào shell | |
| `block-failproofai-commands` | Ngăn tự gỡ cài đặt | |
| `sanitize-jwt` | Ngăn token JWT rò rỉ vào ngữ cảnh của agent | |
| `sanitize-api-keys` | Ngăn API key rò rỉ vào ngữ cảnh của agent | `additionalPatterns` |
| `sanitize-connection-strings` | Ngăn thông tin xác thực cơ sở dữ liệu rò rỉ vào ngữ cảnh của agent | |
| `sanitize-private-key-content` | Che đi các khối private key PEM khỏi đầu ra | |
| `sanitize-bearer-tokens` | Che đi các token Authorization Bearer khỏi đầu ra | |
| `block-env-files` | Ngăn agent đọc các file .env | |
| `protect-env-vars` | Ngăn agent in ra các biến môi trường | |
| `block-read-outside-cwd` | Giữ agent trong phạm vi dự án | `allowPaths` |
| `block-secrets-write` | Ngăn ghi vào các file private key và certificate | `additionalPatterns` |
| `block-push-master` | Ngăn push không cố ý lên main/master | `protectedBranches` |
| `block-work-on-main` | Giữ agent không làm việc trên các nhánh được bảo vệ | `protectedBranches` |
| `block-force-push` | Ngăn `git push --force` | |
| `warn-git-amend` | Nhắc nhở agent trước khi sửa đổi commit | |
| `warn-git-stash-drop` | Nhắc nhở agent trước khi xóa stash | |
| `warn-all-files-staged` | Phát hiện `git add -A` không cố ý | |
| `warn-destructive-sql` | Phát hiện DROP/DELETE SQL trước khi thực thi | |
| `warn-schema-alteration` | Phát hiện ALTER TABLE trước khi thực thi | |
| `warn-large-file-write` | Phát hiện các lần ghi file có kích thước bất thường lớn | `thresholdKb` |
| `warn-package-publish` | Phát hiện `npm publish` không cố ý | |
| `warn-background-process` | Phát hiện việc khởi chạy tiến trình nền không cố ý | |
| `warn-global-package-install` | Phát hiện cài đặt gói toàn cục không cố ý | |
| …và nhiều hơn nữa | | |

Chi tiết đầy đủ về chính sách và tham khảo tham số: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Chính sách tùy chỉnh

Tự viết chính sách của riêng bạn để giữ agent hoạt động đáng tin cậy và đúng nhiệm vụ:

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

Cài đặt bằng lệnh:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Các hàm hỗ trợ quyết định

| Hàm | Hiệu ứng |
|-----|---------|
| `allow()` | Cho phép thao tác |
| `allow(message)` | Cho phép và gửi thông tin bổ sung đến Claude *(beta)* |
| `deny(message)` | Chặn thao tác; thông báo được hiển thị cho Claude |
| `instruct(message)` | Thêm ngữ cảnh vào prompt của Claude; không chặn |

### Đối tượng ngữ cảnh (`ctx`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Công cụ đang được gọi (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Các tham số đầu vào của công cụ |
| `payload` | `object` | Toàn bộ payload sự kiện thô |
| `session.cwd` | `string` | Thư mục làm việc của phiên Claude Code |
| `session.sessionId` | `string` | Định danh phiên làm việc |
| `session.transcriptPath` | `string` | Đường dẫn đến file transcript của phiên |

Hook tùy chỉnh hỗ trợ import cục bộ bắc cầu, async/await, và truy cập `process.env`. Các lỗi sẽ fail-open (được ghi vào `~/.failproofai/hook.log`, các chính sách tích hợp vẫn tiếp tục hoạt động). Xem [docs/custom-hooks.mdx](docs/custom-hooks.mdx) để biết hướng dẫn đầy đủ.

---

## Telemetry

Failproof AI thu thập dữ liệu sử dụng ẩn danh qua PostHog để hiểu cách các tính năng được sử dụng. Không có nội dung phiên, tên file, đầu vào công cụ hay thông tin cá nhân nào được gửi đi.

Tắt tính năng này:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Tài liệu

| Hướng dẫn | Mô tả |
|-----------|-------|
| [Bắt đầu](docs/getting-started.mdx) | Cài đặt và các bước đầu tiên |
| [Chính sách tích hợp sẵn](docs/built-in-policies.mdx) | Tất cả 30 chính sách tích hợp cùng các tham số |
| [Chính sách tùy chỉnh](docs/custom-policies.mdx) | Tự viết chính sách của riêng bạn |
| [Cấu hình](docs/configuration.mdx) | Định dạng file cấu hình và hợp nhất phạm vi |
| [Bảng điều khiển](docs/dashboard.mdx) | Theo dõi phiên làm việc và xem lại hoạt động chính sách |
| [Kiến trúc](docs/architecture.mdx) | Cách hệ thống hook hoạt động |
| [Kiểm thử](docs/testing.mdx) | Chạy kiểm thử và viết kiểm thử mới |

### Chạy tài liệu cục bộ

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mở trang tài liệu Mintlify tại `http://localhost:3000`. Container theo dõi các thay đổi nếu bạn mount thư mục docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Giấy phép

Xem [LICENSE](LICENSE).
