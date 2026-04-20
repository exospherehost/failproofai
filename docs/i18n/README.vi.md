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

Cách dễ nhất để quản lý các chính sách giúp AI agents của bạn hoạt động đáng tin cậy, tập trung vào nhiệm vụ và chạy tự động - cho **Claude Code** & **Agents SDK**.

- **30 Chính sách tích hợp sẵn** - Bắt các chế độ lỗi phổ biến của agent ngay lập tức. Chặn các lệnh nguy hiểm, ngăn chặn rò rỉ bí mật, giữ agents trong ranh giới dự án, phát hiện vòng lặp, và nhiều hơn nữa.
- **Chính sách tùy chỉnh** - Viết các quy tắc độ tin cậy của riêng bạn bằng JavaScript. Sử dụng API `allow`/`deny`/`instruct` để thực thi các quy ước, ngăn chặn sự lệch lạc, kiểm soát các hoạt động, hoặc tích hợp với các hệ thống bên ngoài.
- **Cấu hình dễ dàng** - Tinh chỉnh bất kỳ chính sách nào mà không cần viết code. Đặt danh sách cho phép, nhánh được bảo vệ, ngưỡng cho mỗi dự án hoặc toàn cục. Ba phạm vi cấu hình tự động hợp nhất.
- **Agent Monitor** - Xem những gì agents của bạn đã làm khi bạn vắng mặt. Duyệt các phiên làm việc, kiểm tra từng lệnh gọi công cụ, và xem xét chính xác nơi các chính sách được áp dụng.

Mọi thứ chạy cục bộ - không có dữ liệu nào rời khỏi máy của bạn.

---

## Yêu cầu

- Node.js >= 20.9.0
- Bun >= 1.3.0 (tùy chọn - chỉ cần thiết cho phát triển / xây dựng từ nguồn)

---

## Cài đặt

```bash
npm install -g failproofai
# hoặc
bun add -g failproofai
```

---

## Bắt đầu nhanh

### 1. Bật chính sách toàn cục

```bash
failproofai policies --install
```

Ghi các mục hook vào `~/.claude/settings.json`. Claude Code sẽ gọi failproofai trước và sau mỗi lệnh gọi công cụ.

### 2. Khởi động bảng điều khiển

```bash
failproofai
```

Mở `http://localhost:8020` - duyệt các phiên làm việc, kiểm tra nhật ký, quản lý chính sách.

### 3. Kiểm tra những gì đang hoạt động

```bash
failproofai policies
```

---

## Cài đặt chính sách

### Phạm vi

| Phạm vi | Lệnh | Nơi ghi |
|--------|------|---------|
| Toàn cục (mặc định) | `failproofai policies --install` | `~/.claude/settings.json` |
| Dự án | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Cục bộ | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Cài đặt chính sách cụ thể

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

Cấu hình chính sách nằm trong `~/.failproofai/policies-config.json` (toàn cục) hoặc `.failproofai/policies-config.json` trong dự án của bạn (theo dự án).

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

**Ba phạm vi cấu hình** được hợp nhất tự động (dự án → cục bộ → toàn cục). Xem [docs/configuration.mdx](docs/configuration.mdx) để biết các quy tắc hợp nhất đầy đủ.

---

## Chính sách tích hợp sẵn

| Chính sách | Mô tả | Có thể cấu hình |
|-----------|-------|:---:|
| `block-sudo` | Ngăn agents chạy các lệnh hệ thống có đặc quyền | `allowPatterns` |
| `block-rm-rf` | Ngăn xóa tệp đệ quy vô tình | `allowPaths` |
| `block-curl-pipe-sh` | Ngăn agents đưa các tập lệnh không đáng tin cậy vào shell | |
| `block-failproofai-commands` | Ngăn tự gỡ cài đặt | |
| `sanitize-jwt` | Dừng các mã JWT rò rỉ vào ngữ cảnh agent | |
| `sanitize-api-keys` | Dừng các khóa API rò rỉ vào ngữ cảnh agent | `additionalPatterns` |
| `sanitize-connection-strings` | Dừng thông tin xác thực cơ sở dữ liệu rò rỉ vào ngữ cảnh agent | |
| `sanitize-private-key-content` | Che mờ các khối khóa riêng PEM khỏi đầu ra | |
| `sanitize-bearer-tokens` | Che mờ các mã Authorization Bearer từ đầu ra | |
| `block-env-files` | Giữ agents không đọc các tệp .env | |
| `protect-env-vars` | Ngăn agents in các biến môi trường | |
| `block-read-outside-cwd` | Giữ agents trong ranh giới dự án | `allowPaths` |
| `block-secrets-write` | Ngăn ghi vào các tệp khóa riêng và chứng chỉ | `additionalPatterns` |
| `block-push-master` | Ngăn đẩy vô tình tới main/master | `protectedBranches` |
| `block-work-on-main` | Giữ agents không hoạt động trên các nhánh được bảo vệ | `protectedBranches` |
| `block-force-push` | Ngăn `git push --force` | |
| `warn-git-amend` | Nhắc nhở agents trước khi sửa đổi commit | |
| `warn-git-stash-drop` | Nhắc nhở agents trước khi xóa stash | |
| `warn-all-files-staged` | Bắt `git add -A` vô tình | |
| `warn-destructive-sql` | Bắt SQL DROP/DELETE trước khi thực hiện | |
| `warn-schema-alteration` | Bắt ALTER TABLE trước khi thực hiện | |
| `warn-large-file-write` | Bắt các lần ghi tệp lớn bất ngờ | `thresholdKb` |
| `warn-package-publish` | Bắt `npm publish` vô tình | |
| `warn-background-process` | Bắt khởi chạy quy trình nền không dự định | |
| `warn-global-package-install` | Bắt cài đặt gói toàn cục không dự định | |
| …và nhiều hơn nữa | | |

Chi tiết chính sách đầy đủ và tham chiếu tham số: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Chính sách tùy chỉnh

Viết các chính sách của riêng bạn để giữ agents đáng tin cậy và tập trung vào nhiệm vụ:

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

Cài đặt với:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Trợ giúp quyết định

| Hàm | Hiệu quả |
|-----|---------|
| `allow()` | Cho phép thao tác |
| `allow(message)` | Cho phép và gửi bối cảnh thông tin đến Claude |
| `deny(message)` | Chặn thao tác; tin nhắn được hiển thị cho Claude |
| `instruct(message)` | Thêm bối cảnh vào lời nhắc của Claude; không chặn |

### Đối tượng ngữ cảnh (`ctx`)

| Trường | Loại | Mô tả |
|-------|------|-------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Công cụ được gọi (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Các tham số đầu vào của công cụ |
| `payload` | `object` | Toàn bộ trọng tải sự kiện thô |
| `session.cwd` | `string` | Thư mục làm việc của phiên Claude Code |
| `session.sessionId` | `string` | Định danh phiên |
| `session.transcriptPath` | `string` | Đường dẫn đến tệp phiên ghi âm |

Hook tùy chỉnh hỗ trợ nhập cục bộ chuyển tiếp, async/await, và truy cập vào `process.env`. Các lỗi mở không kiểm soát được (ghi vào `~/.failproofai/hook.log`, các chính sách tích hợp sẵn tiếp tục). Xem [docs/custom-hooks.mdx](docs/custom-hooks.mdx) để biết hướng dẫn đầy đủ.

### Chính sách dựa trên quy ước

Bỏ các tệp `*policies.{js,mjs,ts}` vào `.failproofai/policies/` và chúng sẽ tự động được tải — không cần cờ `--custom` hoặc thay đổi cấu hình. Hoạt động giống như git hooks: bỏ một tệp, nó chỉ hoạt động.

```text
# Cấp dự án — được commit vào git, chia sẻ với đội
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Cấp người dùng — cá nhân, áp dụng cho tất cả các dự án
~/.failproofai/policies/my-policies.mjs
```

Cả hai cấp tải (hợp nhất). Các tệp được tải theo thứ tự bảng chữ cái trong mỗi thư mục. Tiền tố bằng `01-`, `02-`, v.v. để kiểm soát thứ tự. Xem [examples/convention-policies/](examples/convention-policies/) để biết các ví dụ sẵn sàng sử dụng.

---

## Telemetry

Failproof AI thu thập telemetry sử dụng ẩn danh thông qua PostHog để hiểu mức độ sử dụng tính năng. Nội dung phiên, tên tệp, đầu vào công cụ hoặc thông tin cá nhân không bao giờ được gửi.

Vô hiệu hóa nó:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Tài liệu

| Hướng dẫn | Mô tả |
|---------|-------|
| [Getting Started](docs/getting-started.mdx) | Cài đặt và các bước đầu tiên |
| [Built-in Policies](docs/built-in-policies.mdx) | Tất cả 30 chính sách tích hợp sẵn với các tham số |
| [Custom Policies](docs/custom-policies.mdx) | Viết các chính sách của riêng bạn |
| [Configuration](docs/configuration.mdx) | Định dạng tệp cấu hình và hợp nhất phạm vi |
| [Dashboard](docs/dashboard.mdx) | Giám sát các phiên và xem xét hoạt động chính sách |
| [Architecture](docs/architecture.mdx) | Cách hệ thống hook hoạt động |
| [Testing](docs/testing.mdx) | Chạy bài kiểm tra và viết các bài mới |

### Chạy tài liệu cục bộ

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mở trang web tài liệu Mintlify tại `http://localhost:3000`. Container theo dõi các thay đổi nếu bạn gắn thư mục tài liệu:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Lưu ý cho những người đóng góp failproofai

`.claude/settings.json` của repo này sử dụng `bun ./bin/failproofai.mjs --hook <EventType>` thay vì lệnh `npx -y failproofai` tiêu chuẩn. Điều này là vì chạy `npx -y failproofai` bên trong chính dự án failproofai tạo ra một xung đột tự tham chiếu.

Đối với tất cả các repo khác, phương pháp được khuyến nghị là `npx -y failproofai`, được cài đặt thông qua:

```bash
failproofai policies --install --scope project
```

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Giấy phép

Xem [LICENSE](LICENSE).

---

Được xây dựng và duy trì bởi **ExosphereHost: Phòng thí nghiệm nghiên cứu độ tin cậy cho Agents của bạn**. Chúng tôi giúp các doanh nghiệp và startup cải thiện độ tin cậy của các AI agents của họ thông qua các agents, phần mềm và chuyên môn của chính chúng tôi. Tìm hiểu thêm tại [exosphere.host](https://exosphere.host).
```
