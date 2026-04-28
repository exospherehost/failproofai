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

الطريقة الأسهل لإدارة السياسات التي تحافظ على موثوقية وكلائك الذكيين، وتركز على المهمة، وتعمل بشكل مستقل - لـ **Claude Code** و **OpenAI Codex** و **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

## واجهات سطر الأوامر المدعومة

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
  <strong>+ المزيد قريباً</strong>
</p>

> تثبيت الخطاطيف لأحد أو كليهما: `failproofai policies --install --cli codex` (أو `--cli claude codex`). اترك `--cli` للكشف التلقائي عن واجهات سطر الأوامر المثبتة والمطالبة.

- **39 سياسة مدمجة** - اكتشف أوضاع فشل الوكيل الشائعة بسهولة. احجب الأوامر المدمرة، ومنع تسرب الأسرار، وأبقِ الوكلاء داخل حدود المشروع، واكتشف الحلقات، والمزيد.
- **سياسات مخصصة** - اكتب قواعد موثوقيتك الخاصة في JavaScript. استخدم واجهة برمجية `allow`/`deny`/`instruct` لفرض الاتفاقيات ومنع الانجراف وتنظيم العمليات أو التكامل مع الأنظمة الخارجية.
- **تكوين سهل** - اضبط أي سياسة بدون كتابة أكواد. قم بتعيين قوائم السماح والفروع المحمية والحدود الفردية لكل مشروع أو بشكل عام. يتم دمج التكوين بثلاث نطاقات تلقائياً.
- **مراقب الوكيل** - انظر ما فعله وكلاؤك بينما كنت بعيداً. تصفح الجلسات وفتش كل استدعاء أداة واستعرض المكان الذي تم فيه تطبيق السياسات.

كل شيء يعمل محلياً - لا توجد بيانات تغادر جهازك.

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

يكتب إدخالات الخطاطيف إلى `~/.claude/settings.json`. الآن سيستدعي Claude Code failproofai قبل وبعد كل استدعاء أداة.

### 2. تشغيل لوحة المعلومات

```bash
failproofai
```

يفتح `http://localhost:8020` - تصفح الجلسات وفتش السجلات وأدر السياسات.

### 3. تحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسة

### النطاقات

| النطاق | الأمر | المكان المكتوب |
|-------|-------|-----------------|
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

يوجد تكوين السياسة في `~/.failproofai/policies-config.json` (عام) أو `.failproofai/policies-config.json` في مشروعك (حسب المشروع).

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
      "hint": "استخدم apt-get مباشرة بدون sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "حاول إنشاء فرع جديد بدلاً من ذلك."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "مفتاح API من MyCo" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**يتم دمج ثلاثة نطاقات تكوين** تلقائياً (المشروع → محلي → عام). انظر [docs/configuration.mdx](docs/configuration.mdx) للقواعد الكاملة للدمج.

---

## السياسات المدمجة

| السياسة | الوصف | قابلة للتكوين |
|--------|-------------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام المميزة | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودي العرضي | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من توجيه النصوص غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | إيقاف تسرب رموز JWT إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف تسرب مفاتيح API إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف تسرب بيانات اعتماد قاعدة البيانات إلى سياق الوكيل | |
| `sanitize-private-key-content` | تحرير كتل مفاتيح PEM الخاصة من الإخراج | |
| `sanitize-bearer-tokens` | تحرير رموز Authorization Bearer من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | إبقاء الوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح الخاصة والشهادات | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | إبقاء الوكلاء بعيداً عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | تذكير الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | تذكير الوكلاء قبل إسقاط الخزينة | |
| `warn-all-files-staged` | اكتشف `git add -A` العرضي | |
| `warn-destructive-sql` | اكتشف DROP/DELETE SQL قبل التنفيذ | |
| `warn-schema-alteration` | اكتشف ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | اكتشف عمليات كتابة ملفات كبيرة غير متوقعة | `thresholdKb` |
| `warn-package-publish` | اكتشف `npm publish` العرضي | |
| `warn-background-process` | اكتشف عمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | اكتشف تثبيتات الحزم العامة غير المقصودة | |
| …والمزيد | | |

التفاصيل الكاملة للسياسة ورجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة للحفاظ على موثوقية الوكلاء والتركيز على المهمة:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "احجب الكتابة إلى المسارات التي تحتوي على 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("الكتابة إلى مسارات الإنتاج محجوبة");
    return allow();
  },
});
```

التثبيت باستخدام:

```bash
failproofai policies --install --custom ./my-policies.js
```

### مساعدات القرار

| الدالة | التأثير |
|----------|--------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح بالعملية وإرسال سياق معلوماتي إلى Claude |
| `deny(message)` | حجب العملية؛ يتم عرض الرسالة لـ Claude |
| `instruct(message)` | إضافة سياق إلى موجه Claude؛ لا تحجب |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`، `"PostToolUse"`، `"Notification"`، `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"`، `"Write"`، `"Read"`، ...) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمولة الحدث الخام الكاملة |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرّف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نسخة الجلسة |

تدعم الخطاطيف المخصصة الواردات المحلية الانتقالية والانتظار بشكل غير متزامن والوصول إلى `process.env`. الأخطاء آمنة (تسجيل إلى `~/.failproofai/hook.log`، استمرار السياسات المدمجة). انظر [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للدليل الكامل.

### سياسات قائمة على الاتفاقية

اسقط ملفات `*policies.{js,mjs,ts}` في `.failproofai/policies/` وسيتم تحميلها تلقائياً - لا توجد أعلام أو تغييرات تكوين مطلوبة. التزم بالدليل وكل فرد من فريقك يحصل على نفس معايير الجودة تلقائياً.

```text
# مستوى المشروع — ملتزم بـ git، مشترك مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# مستوى المستخدم — شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

يتم تحميل كلا المستويين (اتحاد). يتم تحميل الملفات أبجدياً داخل كل دليل. بادئة مع `01-`، `02-`، إلخ. للتحكم في الترتيب. عندما يكتشف فريقك أوضاع فشل جديدة، أضف سياسة وادفع — يحصل الجميع على التحديث على سحبهم التالي. انظر [examples/convention-policies/](examples/convention-policies/) للحصول على أمثلة جاهزة للاستخدام.

---

## قياس الاستخدام

يجمع Failproof AI بيانات قياس الاستخدام المجهولة عبر PostHog لفهم استخدام الميزات. لا يتم أبداً إرسال محتوى الجلسة أو أسماء الملفات أو مدخلات الأدوات أو المعلومات الشخصية.

تعطيله:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [Built-in Policies](docs/built-in-policies.mdx) | جميع السياسات المدمجة الـ 39 مع المعاملات |
| [Custom Policies](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [Configuration](docs/configuration.mdx) | تنسيق ملف التكوين ودمج النطاق |
| [Dashboard](docs/dashboard.mdx) | راقب الجلسات واستعرض نشاط السياسة |
| [Architecture](docs/architecture.mdx) | كيف يعمل نظام الخطاطيف |
| [Testing](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### تشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify docs على `http://localhost:3000`. الحاوية تراقب التغييرات إذا قمت بتركيب دليل التوثيق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

ملف `.claude/settings.json` في هذا المستودع يستخدم `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. هذا لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه ينشئ تضاربات مرجعية ذاتية.

لجميع المستودعات الأخرى، الطريقة الموصى بها هي `npx -y failproofai`، مثبتة عبر:

```bash
failproofai policies --install --scope project
```

## المساهمة

انظر [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الترخيص

انظر [LICENSE](LICENSE).

---

تم البناء والصيانة بواسطة **ExosphereHost: Reliability Research Lab لوكلائك**. نساعد المؤسسات والشركات الناشئة على تحسين موثوقية وكلائهم الذكيين من خلال وكلائنا والبرامج والخبرة. تعرّف على المزيد على [exosphere.host](https://exosphere.host).


</div>