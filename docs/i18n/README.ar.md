> **⚠️** هذه ترجمة آلية. للاطلاع على أحدث إصدار، راجع [English README](../../README.md).

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | **🇸🇦 العربية** | [🇮🇱 עברית](README.he.md)

---
<div dir="rtl">


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

**الترجمات**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

الطريقة الأسهل لإدارة السياسات التي تحافظ على موثوقية وكلاءك بالذكاء الاصطناعي وتركيزهم على المهام وتشغيلهم بشكل مستقل - لـ **Claude Code**، **OpenAI Codex**، **GitHub Copilot CLI** _(beta)_ و **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

## واجهات سطر الأوامر للوكلاء المدعومة

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
  <a href="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks" title="GitHub Copilot CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/copilot-dark.svg" />
      <img src="assets/logos/copilot-light.svg" alt="GitHub Copilot" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>+ المزيد قريباً</strong>
</p>

> قم بتثبيت الـ hooks لأحد أو اثنين أو جميعهم: `failproofai policies --install --cli copilot` (أو `--cli claude codex copilot`). تجاهل `--cli` للكشف التلقائي عن واجهات سطر الأوامر المثبتة والفحص. **دعم GitHub Copilot CLI قيد الإصدار التجريبي.**

- **39 سياسة مدمجة** - تجنب حالات الفشل الشائعة للوكلاء خارج الصندوق. احجب الأوامر المدمرة، منع تسريب الأسرار، احتفظ بالوكلاء داخل حدود المشروع، اكتشف الحلقات، والمزيد.
- **سياسات مخصصة** - اكتب قواعد موثوقيتك الخاصة في JavaScript. استخدم `allow`/`deny`/`instruct` API لفرض المعايير، منع الانجراف، تقييد العمليات، أو الدمج مع الأنظمة الخارجية.
- **تكوين سهل** - اضبط أي سياسة بدون كتابة الأكواد. قم بتعيين قوائم السماح والفروع المحمية والحدود لكل مشروع أو عام. يتم دمج تكوين ثلاث نطاقات تلقائياً.
- **شاشة عرض الوكيل** - اطلع على ما فعله وكلاؤك أثناء غيابك. استعرض الجلسات، افحص كل استدعاء أداة، واستعرض بالضبط المكان الذي تم فيه تفعيل السياسات.

كل شيء يعمل محلياً - لا تترك البيانات جهازك.

---

## المتطلبات

- Node.js >= 20.9.0
- Bun >= 1.3.0 (اختياري - مطلوب فقط للتطوير / البناء من المصدر)

---

## التثبيت

```bash
npm install -g failproofai
# أو
bun add -g failproofai
```

---

## البدء السريع

### 1. تفعيل السياسات عالمياً

```bash
failproofai policies --install
```

يكتب إدخالات hook في `~/.claude/settings.json`. سيستدعي Claude Code الآن failproofai قبل وبعد كل استدعاء أداة.

### 2. قم بتشغيل لوحة التحكم

```bash
failproofai
```

يفتح `http://localhost:8020` - استعرض الجلسات، افحص السجلات، أدر السياسات.

### 3. تحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسة

### النطاقات

| النطاق | الأمر | حيث يكتب |
|-------|-------|---------|
| عام (افتراضي) | `failproofai policies --install` | `~/.claude/settings.json` |
| المشروع | `failproofai policies --install --scope project` | `.claude/settings.json` |
| محلي | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### تثبيت سياسات محددة

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### إزالة السياسات

```bash
failproofai policies --uninstall
# أو لنطاق محدد:
failproofai policies --uninstall --scope project
```

---

## التكوين

يتم حفظ تكوين السياسة في `~/.failproofai/policies-config.json` (عام) أو `.failproofai/policies-config.json` في مشروعك (لكل مشروع).

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

**يتم دمج نطاقات التكوين الثلاثة** تلقائياً (المشروع → المحلي → العام). انظر [docs/configuration.mdx](docs/configuration.mdx) للحصول على قواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابل للتخصيص |
|--------|--------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل الأوامر النظامية الممتازة | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودية العرضية | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من أنابيب البرامج النصية غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | إيقاف تسريب رموز JWT إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف تسريب مفاتيح API إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف تسريب بيانات اعتماد قاعدة البيانات إلى سياق الوكيل | |
| `sanitize-private-key-content` | تحرير كتل مفاتيح PEM الخاصة من الإخراج | |
| `sanitize-bearer-tokens` | تحرير رموز Bearer للترخيص من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | احتفظ بالوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح والشهادات الخاصة | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | احتفظ بالوكلاء بعيداً عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | ذكّر الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | ذكّر الوكلاء قبل إسقاط المخزن المؤقت | |
| `warn-all-files-staged` | احصر `git add -A` العرضية | |
| `warn-destructive-sql` | احصر DROP/DELETE SQL قبل التنفيذ | |
| `warn-schema-alteration` | احصر ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | احصر كتابات الملفات الكبيرة غير المتوقعة | `thresholdKb` |
| `warn-package-publish` | احصر `npm publish` العرضية | |
| `warn-background-process` | احصر عمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | احصر تثبيتات الحزم العام غير المقصودة | |
| …والمزيد | | |

تفاصيل السياسة الكاملة ومرجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة للحفاظ على موثوقية الوكلاء وتركيزهم على المهام:

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

تثبيت مع:

```bash
failproofai policies --install --custom ./my-policies.js
```

### مساعدات القرار

| الدالة | التأثير |
|--------|--------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح وإرسال سياق معلوماتي إلى Claude |
| `deny(message)` | حجب العملية؛ يتم عرض الرسالة لـ Claude |
| `instruct(message)` | إضافة سياق إلى سلب Claude؛ لا تحجب |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|-------|--------|
| `eventType` | `string` | `"PreToolUse"`، `"PostToolUse"`، `"Notification"`، `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"`، `"Write"`، `"Read"`، …) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمل الحدث الخام الكامل |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نسخة الجلسة |

تدعم الـ hooks المخصصة الاستيراد المحلي الانتقالي والـ async/await والوصول إلى `process.env`. الأخطاء قابلة للفتح (مسجلة في `~/.failproofai/hook.log`، السياسات المدمجة تستمر). انظر [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للحصول على الدليل الكامل.

### السياسات المستندة إلى الاتفاقية

أسقط ملفات `*policies.{js,mjs,ts}` في `.failproofai/policies/` وتحمل تلقائياً - لا توجد أعلام أو تغييرات تكوين مطلوبة. احفظ الدليل في git وكل عضو فريق يحصل على نفس معايير الجودة تلقائياً.

```text
# مستوى المشروع — ملتزم بـ git، مشترك مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# مستوى المستخدم — شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

كلا المستويين محملان (اتحاد). يتم تحميل الملفات أبجدياً داخل كل دليل. البادئة مع `01-`، `02-`، إلخ للتحكم في الترتيب. مع اكتشاف فريقك لحالات فشل جديدة، أضف سياسة ودفع — يحصل الجميع على التحديث في السحب التالي. انظر [examples/convention-policies/](examples/convention-policies/) للأمثلة الجاهزة للاستخدام.

---

## القياس عن بعد

يجمع Failproof AI قياس الاستخدام المجهول عبر PostHog لفهم استخدام الميزات. لم يتم أبداً إرسال محتوى الجلسة أو أسماء الملفات أو إدخالات الأدوات أو المعلومات الشخصية.

تعطيله:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|--------|--------|
| [البدء](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [السياسات المدمجة](docs/built-in-policies.mdx) | جميع 39 سياسة مدمجة مع المعاملات |
| [السياسات المخصصة](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [التكوين](docs/configuration.mdx) | تنسيق ملف التكوين ودمج النطاق |
| [لوحة التحكم](docs/dashboard.mdx) | راقب الجلسات واستعرض نشاط السياسة |
| [العمارة](docs/architecture.mdx) | كيف يعمل نظام hook |
| [الاختبار](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### تشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify documentation على `http://localhost:3000`. الحاوية تراقب التغييرات إذا قمت بتحميل دليل التوثيق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

يستخدم ملف `.claude/settings.json` الخاص بهذا المستودع `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. هذا لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه يخلق تضاربة يشير إلى نفسه.

بالنسبة لجميع المستودعات الأخرى، النهج الموصى به هو `npx -y failproofai`، المثبت عبر:

```bash
failproofai policies --install --scope project
```

## المساهمة

انظر [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الترخيص

انظر [LICENSE](LICENSE).

---

تم الإنشاء والصيانة بواسطة **ExosphereHost: مختبر أبحاث الموثوقية لوكلاءك**. نساعد المؤسسات والشركات الناشئة على تحسين موثوقية وكلاءهم بالذكاء الاصطناعي من خلال وكلائنا الخاصين والبرامج والخبرة. تعرف على المزيد على [exosphere.host](https://exosphere.host).


</div>