> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | **🇰🇷 한국어** | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**번역**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

AI 에이전트를 안정적으로 유지하고, 목표에 집중하며, 자율적으로 실행되도록 정책을 관리하는 가장 쉬운 방법 - **Claude Code** 및 **Agents SDK** 지원.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **30가지 내장 정책** - 일반적인 에이전트 장애 유형을 즉시 감지합니다. 파괴적인 명령 차단, 시크릿 유출 방지, 에이전트를 프로젝트 경계 내로 제한, 루프 감지 등을 제공합니다.
- **커스텀 정책** - JavaScript로 직접 신뢰성 규칙을 작성하세요. `allow`/`deny`/`instruct` API를 사용해 규약 적용, 드리프트 방지, 작업 게이팅, 외부 시스템 연동이 가능합니다.
- **간편한 구성** - 코드 작성 없이 모든 정책을 조정할 수 있습니다. 프로젝트별 또는 전역으로 허용 목록, 보호 브랜치, 임계값을 설정하세요. 세 가지 범위의 설정이 자동으로 병합됩니다.
- **에이전트 모니터** - 자리를 비운 동안 에이전트가 무엇을 했는지 확인하세요. 세션을 탐색하고, 모든 툴 호출을 검사하며, 정책이 실행된 위치를 정확히 검토할 수 있습니다.

모든 작업은 로컬에서 실행됩니다 - 데이터가 머신 밖으로 나가지 않습니다.

---

## 요구 사항

- Node.js >= 20.9.0
- Bun >= 1.3.0 (선택 사항 - 개발 또는 소스에서 빌드할 때만 필요)

---

## 설치

```bash
npm install -g failproofai
# 또는
bun add -g failproofai
```

---

## 빠른 시작

### 1. 전역으로 정책 활성화

```bash
failproofai policies --install
```

`~/.claude/settings.json`에 훅 항목을 작성합니다. 이제 Claude Code가 각 툴 호출 전후에 failproofai를 실행합니다.

### 2. 대시보드 실행

```bash
failproofai
```

`http://localhost:8020`을 열어 세션 탐색, 로그 검사, 정책 관리를 할 수 있습니다.

### 3. 활성 정책 확인

```bash
failproofai policies
```

---

## 정책 설치

### 범위

| 범위 | 명령어 | 저장 위치 |
|-------|---------|-----------------|
| 전역 (기본값) | `failproofai policies --install` | `~/.claude/settings.json` |
| 프로젝트 | `failproofai policies --install --scope project` | `.claude/settings.json` |
| 로컬 | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### 특정 정책 설치

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### 정책 제거

```bash
failproofai policies --uninstall
# 또는 특정 범위의 경우:
failproofai policies --uninstall --scope project
```

---

## 구성

정책 구성은 `~/.failproofai/policies-config.json` (전역) 또는 프로젝트의 `.failproofai/policies-config.json` (프로젝트별)에 저장됩니다.

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

**세 가지 구성 범위**는 자동으로 병합됩니다 (프로젝트 → 로컬 → 전역). 전체 병합 규칙은 [docs/configuration.mdx](docs/configuration.mdx)를 참조하세요.

---

## 내장 정책

| 정책 | 설명 | 구성 가능 |
|--------|-------------|:---:|
| `block-sudo` | 에이전트가 권한 있는 시스템 명령을 실행하지 못하도록 차단 | `allowPatterns` |
| `block-rm-rf` | 실수로 인한 재귀 파일 삭제 방지 | `allowPaths` |
| `block-curl-pipe-sh` | 에이전트가 신뢰할 수 없는 스크립트를 셸로 파이프하지 못하도록 차단 | |
| `block-failproofai-commands` | 자기 자신 제거 방지 | |
| `sanitize-jwt` | JWT 토큰이 에이전트 컨텍스트로 유출되는 것을 방지 | |
| `sanitize-api-keys` | API 키가 에이전트 컨텍스트로 유출되는 것을 방지 | `additionalPatterns` |
| `sanitize-connection-strings` | 데이터베이스 자격 증명이 에이전트 컨텍스트로 유출되는 것을 방지 | |
| `sanitize-private-key-content` | 출력에서 PEM 개인 키 블록 삭제 | |
| `sanitize-bearer-tokens` | 출력에서 Authorization Bearer 토큰 삭제 | |
| `block-env-files` | 에이전트가 .env 파일을 읽지 못하도록 차단 | |
| `protect-env-vars` | 에이전트가 환경 변수를 출력하지 못하도록 방지 | |
| `block-read-outside-cwd` | 에이전트를 프로젝트 경계 내로 제한 | `allowPaths` |
| `block-secrets-write` | 개인 키 및 인증서 파일에 대한 쓰기 방지 | `additionalPatterns` |
| `block-push-master` | main/master에 실수로 push하는 것을 방지 | `protectedBranches` |
| `block-work-on-main` | 에이전트가 보호 브랜치에서 작업하지 못하도록 차단 | `protectedBranches` |
| `block-force-push` | `git push --force` 방지 | |
| `warn-git-amend` | 커밋 수정 전 에이전트에게 알림 | |
| `warn-git-stash-drop` | 스태시 삭제 전 에이전트에게 알림 | |
| `warn-all-files-staged` | 실수로 인한 `git add -A` 감지 | |
| `warn-destructive-sql` | 실행 전 DROP/DELETE SQL 감지 | |
| `warn-schema-alteration` | 실행 전 ALTER TABLE 감지 | |
| `warn-large-file-write` | 예상치 못하게 큰 파일 쓰기 감지 | `thresholdKb` |
| `warn-package-publish` | 실수로 인한 `npm publish` 감지 | |
| `warn-background-process` | 의도하지 않은 백그라운드 프로세스 실행 감지 | |
| `warn-global-package-install` | 의도하지 않은 전역 패키지 설치 감지 | |
| …그 외 다수 | | |

전체 정책 상세 및 파라미터 참조: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## 커스텀 정책

에이전트를 안정적으로 유지하고 목표에 집중시키기 위한 나만의 정책을 작성하세요:

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

다음 명령으로 설치하세요:

```bash
failproofai policies --install --custom ./my-policies.js
```

### 결정 헬퍼 함수

| 함수 | 효과 |
|----------|--------|
| `allow()` | 작업 허용 |
| `allow(message)` | 허용하고 Claude에 정보성 컨텍스트 전달 |
| `deny(message)` | 작업 차단; 메시지가 Claude에 표시됨 |
| `instruct(message)` | Claude 프롬프트에 컨텍스트 추가; 차단하지 않음 |

### 컨텍스트 객체 (`ctx`)

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | 호출되는 툴 (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | 툴의 입력 파라미터 |
| `payload` | `object` | 전체 원시 이벤트 페이로드 |
| `session.cwd` | `string` | Claude Code 세션의 작업 디렉토리 |
| `session.sessionId` | `string` | 세션 식별자 |
| `session.transcriptPath` | `string` | 세션 트랜스크립트 파일 경로 |

커스텀 훅은 상대 로컬 임포트, async/await, `process.env` 접근을 지원합니다. 오류는 fail-open 방식으로 처리됩니다(`~/.failproofai/hook.log`에 기록되며 내장 정책은 계속 실행됨). 전체 가이드는 [docs/custom-hooks.mdx](docs/custom-hooks.mdx)를 참조하세요.

### 규약 기반 정책

`.failproofai/policies/` 디렉토리에 `*policies.{js,mjs,ts}` 파일을 넣으면 자동으로 로드됩니다 - 별도의 플래그나 설정 변경이 필요 없습니다. 해당 디렉토리를 git에 커밋하면 팀 전원이 동일한 품질 기준을 자동으로 적용받습니다.

```text
# 프로젝트 수준 — git에 커밋되어 팀과 공유됨
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# 사용자 수준 — 개인 설정, 모든 프로젝트에 적용됨
~/.failproofai/policies/my-policies.mjs
```

두 수준 모두 로드됩니다(합집합). 파일은 각 디렉토리 내에서 알파벳 순서로 로드됩니다. `01-`, `02-` 등의 접두사를 사용하여 순서를 제어하세요. 팀에서 새로운 장애 유형을 발견하면 정책을 추가하고 push하세요 - 모든 팀원이 다음 pull 시 업데이트를 받게 됩니다. 바로 사용할 수 있는 예제는 [examples/convention-policies/](examples/convention-policies/)를 참조하세요.

---

## 텔레메트리

Failproof AI는 기능 사용 현황을 파악하기 위해 PostHog를 통해 익명 사용 텔레메트리를 수집합니다. 세션 내용, 파일 이름, 툴 입력, 개인 정보는 전혀 전송되지 않습니다.

비활성화 방법:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## 문서

| 가이드 | 설명 |
|-------|-------------|
| [시작하기](docs/getting-started.mdx) | 설치 및 첫 번째 단계 |
| [내장 정책](docs/built-in-policies.mdx) | 파라미터가 포함된 30가지 내장 정책 전체 목록 |
| [커스텀 정책](docs/custom-policies.mdx) | 나만의 정책 작성 |
| [구성](docs/configuration.mdx) | 설정 파일 형식 및 범위 병합 |
| [대시보드](docs/dashboard.mdx) | 세션 모니터링 및 정책 활동 검토 |
| [아키텍처](docs/architecture.mdx) | 훅 시스템 작동 방식 |
| [테스팅](docs/testing.mdx) | 테스트 실행 및 새 테스트 작성 |

### 로컬에서 문서 실행

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000`에서 Mintlify 문서 사이트를 엽니다. docs 디렉토리를 마운트하면 컨테이너가 변경 사항을 감시합니다:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai 기여자를 위한 참고 사항

이 저장소의 `.claude/settings.json`은 표준 `npx -y failproofai` 명령 대신 `bun ./bin/failproofai.mjs --hook <EventType>`을 사용합니다. failproofai 프로젝트 내부에서 `npx -y failproofai`를 실행하면 자기 참조 충돌이 발생하기 때문입니다.

다른 모든 저장소에서는 `npx -y failproofai` 방식을 권장하며, 다음 명령으로 설치할 수 있습니다:

```bash
failproofai policies --install --scope project
```

## 기여하기

[CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

---

## 라이선스

[LICENSE](LICENSE)를 참조하세요.

---

**ExosphereHost: 에이전트를 위한 신뢰성 연구소**가 구축하고 유지 관리합니다. 저희는 자체 에이전트, 소프트웨어, 전문 지식을 통해 기업과 스타트업의 AI 에이전트 신뢰성 향상을 지원합니다. 자세한 내용은 [exosphere.host](https://exosphere.host)를 방문하세요.
