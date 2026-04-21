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

الطريقة الأسهل لإدارة السياسات التي تحافظ على موثوقية عملاء الذكاء الاصطناعي الخاصة بك وتركيز مهامهم وتشغيلهم بشكل مستقل - لـ **Claude Code** و **Agents SDK**.

- **30 سياسة مدمجة** - التقط أنماط فشل الوكيل الشائعة فوراً. حجب الأوامر المدمرة، ومنع تسرب الأسرار، والحفاظ على الوكلاء داخل حدود المشروع، والكشف عن الحلقات، والمزيد.
- **السياسات المخصصة** - اكتب قواعد موثوقية خاصة بك في JavaScript. استخدم واجهة برمجية التطبيقات `allow`/`deny`/`instruct` لفرض الاتفاقيات ومنع الانجراف وقفل العمليات أو التكامل مع الأنظمة الخارجية.
- **إعدادات سهلة** - اضبط أي سياسة بدون كتابة أكواد. قم بتعيين قوائم السماح والفروع المحمية والحدود لكل مشروع أو عمومياً. يتم دمج تكوين ثلاثة نطاقات تلقائياً.
- **مراقب الوكيل** - شاهد ما فعله وكلاؤك أثناء غيابك. تصفح الجلسات وافحص كل استدعاء أداة وراجع بالضبط مكان تفعيل السياسات.

كل شيء يعمل محلياً - لا تترك أي بيانات جهازك.

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

### 1. تفعيل السياسات عمومياً

```bash
failproofai policies --install
```

يكتب إدخالات hook في `~/.claude/settings.json`. الآن سيستدعي Claude Code failproofai قبل وبعد كل استدعاء أداة.

### 2. تشغيل لوحة المعلومات

```bash
failproofai
```

يفتح `http://localhost:8020` - تصفح الجلسات وافحص السجلات وأدر السياسات.

### 3. تحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسة

### النطاقات

| النطاق | الأمر | حيث يكتب |
|-------|---------|-----------------|
| عمومي (الافتراضي) | `failproofai policies --install` | `~/.claude/settings.json` |
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

يوجد تكوين السياسة في `~/.failproofai/policies-config.json` (عمومي) أو `.failproofai/policies-config.json` في مشروعك (حسب المشروع).

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

**يتم دمج ثلاثة نطاقات تكوين** تلقائياً (المشروع → المحلي → العمومي). راجع [docs/configuration.mdx](docs/configuration.mdx) للحصول على قواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابلة للتكوين |
|--------|-------------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام الممتازة | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودية العرضية | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من إرسال البرامج غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | منع رموز JWT من التسرب إلى سياق الوكيل | |
| `sanitize-api-keys` | منع مفاتيح API من التسرب إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | منع بيانات اعتماد قاعدة البيانات من التسرب إلى سياق الوكيل | |
| `sanitize-private-key-content` | تحرير كتل مفاتيح PEM الخاصة من الإخراج | |
| `sanitize-bearer-tokens` | تحرير رموز Authorization Bearer من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | الحفاظ على الوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح والشهادات الخاصة | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | إبقاء الوكلاء بعيداً عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | تذكير الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | تذكير الوكلاء قبل حذف النسخ الاحتياطية | |
| `warn-all-files-staged` | التقط `git add -A` العرضية | |
| `warn-destructive-sql` | التقط DROP/DELETE SQL قبل التنفيذ | |
| `warn-schema-alteration` | التقط ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | التقط عمليات الكتابة إلى ملفات كبيرة بشكل غير متوقع | `thresholdKb` |
| `warn-package-publish` | التقط `npm publish` العرضية | |
| `warn-background-process` | التقط إطلاقات العمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | التقط التثبيتات العامة للحزم غير المقصودة | |
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

ثبّت مع:

```bash
failproofai policies --install --custom ./my-policies.js
```

### مساعدات القرار

| الدالة | التأثير |
|----------|--------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح وإرسال السياق المعلوماتي إلى Claude |
| `deny(message)` | حجب العملية؛ الرسالة مُعروضة على Claude |
| `instruct(message)` | إضافة السياق إلى موجه Claude؛ لا تحجب |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمل الحدث الخام الكامل |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرّف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نسخة الجلسة |

تدعم الخطافات المخصصة الاستيراد المحلي العابر والانتظار غير المتزامن والوصول إلى `process.env`. الأخطاء فشل مفتوح (تسجل في `~/.failproofai/hook.log`، السياسات المدمجة تستمر). راجع [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للحصول على الدليل الكامل.

### السياسات المستندة إلى الاتفاقية

أسقط ملفات `*policies.{js,mjs,ts}` في `.failproofai/policies/` وسيتم تحميلها تلقائياً - لا توجد أعلام أو تغييرات تكوين مطلوبة. التزم بالدليل إلى git وكل عضو في الفريق يحصل على نفس معايير الجودة تلقائياً.

```text
# مستوى المشروع — ملتزم بـ git، مشاركة مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# مستوى المستخدم — شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

يتم تحميل كلا المستويين (اتحاد). يتم تحميل الملفات أبجدياً داخل كل دليل. بادئة مع `01-`, `02-`, إلخ. للتحكم في الترتيب. عندما يكتشف فريقك أنماط فشل جديدة، أضف سياسة واضغط - يحصل الجميع على التحديث عند الاستخراج التالي. راجع [examples/convention-policies/](examples/convention-policies/) للحصول على أمثلة جاهزة للاستخدام.

---

## القياس

يجمع Failproof AI بيانات القياس المجهولة عبر PostHog لفهم استخدام الميزات. لا يتم أبداً إرسال محتوى الجلسة أو أسماء الملفات أو مدخلات الأدوات أو المعلومات الشخصية.

عطّلها:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [Built-in Policies](docs/built-in-policies.mdx) | جميع 30 سياسة مدمجة مع معاملات |
| [Custom Policies](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [Configuration](docs/configuration.mdx) | تنسيق ملف التكوين ودمج النطاق |
| [Dashboard](docs/dashboard.mdx) | راقب الجلسات وراجع نشاط السياسة |
| [Architecture](docs/architecture.mdx) | كيفية عمل نظام الخطاف |
| [Testing](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### قم بتشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify docs في `http://localhost:3000`. يراقب الحاوية التغييرات إذا قمت بتحميل دليل docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

يستخدم `.claude/settings.json` في هذا المستودع `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. هذا لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه ينشئ تضارباً مرجعياً ذاتياً.

بالنسبة لجميع المستودعات الأخرى، الطريقة الموصى بها هي `npx -y failproofai`، المثبتة عبر:

```bash
failproofai policies --install --scope project
```

## المساهمة

راجع [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الترخيص

راجع [LICENSE](LICENSE).

---

تم البناء والصيانة بواسطة **ExosphereHost: مختبر أبحاث الموثوقية لوكلائك**. نساعد الشركات والشركات الناشئة على تحسين موثوقية عملائهم من الذكاء الاصطناعي من خلال وكلائنا وبرامجنا وخبرتنا. تعرف على المزيد في [exosphere.host](https://exosphere.host).


</div>