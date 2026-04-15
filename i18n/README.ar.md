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

أسهل طريقة لإدارة السياسات التي تُبقي وكلاء الذكاء الاصطناعي موثوقين ومركّزين على المهام وقادرين على العمل باستقلالية - لـ **Claude Code** و**Agents SDK**.

- **30 سياسة مدمجة** - تتصدى لأنماط فشل الوكلاء الشائعة من البداية مباشرةً. تحجب الأوامر المدمرة، وتمنع تسرب الأسرار، وتُبقي الوكلاء ضمن حدود المشروع، وتكشف الحلقات اللانهائية، وأكثر من ذلك.
- **سياسات مخصصة** - اكتب قواعد موثوقيتك الخاصة بـ JavaScript. استخدم واجهة `allow`/`deny`/`instruct` لتطبيق الاتفاقيات، ومنع الانجراف، والتحكم في العمليات، أو التكامل مع أنظمة خارجية.
- **إعداد سهل** - اضبط أي سياسة دون كتابة كود. عيّن قوائم السماح والفروع المحمية والحدود لكل مشروع أو على المستوى العام. تندمج ثلاثة نطاقات للإعداد تلقائياً.
- **مراقب الوكيل** - تابع ما فعله وكلاؤك في غيابك. تصفح الجلسات، وافحص كل استدعاء أداة، وراجع بالضبط أين تم تفعيل السياسات.

كل شيء يعمل محلياً - لا تغادر بياناتك جهازك.

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

يكتب إدخالات الـ hook في `~/.claude/settings.json`. سيستدعي Claude Code الـ failproofai قبل كل استدعاء أداة وبعده.

### 2. تشغيل لوحة التحكم

```bash
failproofai
```

يفتح `http://localhost:8020` - تصفح الجلسات، وافحص السجلات، وأدر السياسات.

### 3. التحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسات

### النطاقات

| النطاق | الأمر | مكان الكتابة |
|--------|--------|--------------|
| عام (افتراضي) | `failproofai policies --install` | `~/.claude/settings.json` |
| مشروع | `failproofai policies --install --scope project` | `.claude/settings.json` |
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

## الإعداد

يقع إعداد السياسات في `~/.failproofai/policies-config.json` (عام) أو `.failproofai/policies-config.json` في مشروعك (لكل مشروع).

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

**ثلاثة نطاقات إعداد** تندمج تلقائياً (مشروع ← محلي ← عام). راجع [docs/configuration.mdx](docs/configuration.mdx) لمعرفة قواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابلة للإعداد |
|---------|--------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام ذات الصلاحيات | `allowPatterns` |
| `block-rm-rf` | منع الحذف العرضي التكراري للملفات | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من توجيه سكريبتات غير موثوقة إلى الـ shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | إيقاف تسرب رموز JWT إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف تسرب مفاتيح API إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف تسرب بيانات اعتماد قاعدة البيانات إلى سياق الوكيل | |
| `sanitize-private-key-content` | حذف كتل المفاتيح الخاصة بصيغة PEM من المخرجات | |
| `sanitize-bearer-tokens` | حذف رموز Authorization Bearer من المخرجات | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | إبقاء الوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح الخاصة والشهادات | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | إبعاد الوكلاء عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | تذكير الوكلاء قبل تعديل الـ commits | |
| `warn-git-stash-drop` | تذكير الوكلاء قبل حذف الـ stashes | |
| `warn-all-files-staged` | اكتشاف `git add -A` العرضي | |
| `warn-destructive-sql` | اكتشاف أوامر DROP/DELETE بـ SQL قبل التنفيذ | |
| `warn-schema-alteration` | اكتشاف ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | اكتشاف عمليات كتابة الملفات الكبيرة بشكل غير متوقع | `thresholdKb` |
| `warn-package-publish` | اكتشاف `npm publish` العرضي | |
| `warn-background-process` | اكتشاف تشغيل العمليات في الخلفية بشكل غير مقصود | |
| `warn-global-package-install` | اكتشاف تثبيت الحزم العامة بشكل غير مقصود | |
| …والمزيد | | |

تفاصيل السياسات الكاملة ومرجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة لإبقاء الوكلاء موثوقين ومركّزين على المهام:

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

ثبّت باستخدام:

```bash
failproofai policies --install --custom ./my-policies.js
```

### مساعدات القرار

| الدالة | التأثير |
|--------|---------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح وإرسال سياق معلوماتي إلى Claude *(تجريبي)* |
| `deny(message)` | حظر العملية؛ تُعرض الرسالة لـ Claude |
| `instruct(message)` | إضافة سياق إلى موجّه Claude؛ لا يحجب العملية |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|-------|--------|
| `eventType` | `string` | `"PreToolUse"` أو `"PostToolUse"` أو `"Notification"` أو `"Stop"` |
| `toolName` | `string` | الأداة المستدعاة (`"Bash"` أو `"Write"` أو `"Read"` أو …) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمولة الحدث الخام الكاملة |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرّف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نص الجلسة |

تدعم الـ hooks المخصصة الاستيرادات المحلية التعدية، وasync/await، والوصول إلى `process.env`. الأخطاء لا تُوقف النظام (تُسجَّل في `~/.failproofai/hook.log`، وتستمر السياسات المدمجة). راجع [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للدليل الكامل.

---

## بيانات الاستخدام

تجمع Failproof AI بيانات استخدام مجهولة الهوية عبر PostHog لفهم استخدام الميزات. لا يُرسل أي محتوى للجلسات أو أسماء الملفات أو مدخلات الأدوات أو معلومات شخصية في أي وقت.

لتعطيلها:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|--------|--------|
| [البدء](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [السياسات المدمجة](docs/built-in-policies.mdx) | جميع السياسات الـ 30 المدمجة مع معاملاتها |
| [السياسات المخصصة](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [الإعداد](docs/configuration.mdx) | تنسيق ملف الإعداد ودمج النطاقات |
| [لوحة التحكم](docs/dashboard.mdx) | مراقبة الجلسات ومراجعة نشاط السياسات |
| [البنية المعمارية](docs/architecture.mdx) | كيف يعمل نظام الـ hook |
| [الاختبار](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### تشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع توثيق Mintlify على `http://localhost:3000`. يراقب الحاوية التغييرات إذا ربطت دليل التوثيق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## المساهمة

راجع [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الرخصة

راجع [LICENSE](LICENSE).


</div>