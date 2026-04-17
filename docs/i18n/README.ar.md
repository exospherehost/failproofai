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

أسهل طريقة لإدارة السياسات التي تحافظ على موثوقية وكلائك الذكية وتبقيها على المسار الصحيح وتعمل بشكل مستقل - لـ **Claude Code** و **Agents SDK**.

- **30 سياسة مدمجة** - اكتشف أنماط فشل الوكيل الشائعة مباشرة. احجب الأوامر المدمرة، ومنع تسرب الأسرار، واحبس الوكلاء داخل حدود المشروع، واكتشف الحلقات، والمزيد.
- **سياسات مخصصة** - اكتب قواعد موثوقيتك الخاصة في JavaScript. استخدم واجهة برمجة التطبيقات `allow`/`deny`/`instruct` لفرض الاتفاقيات، ومنع الانجراف، وحماية العمليات، أو التكامل مع الأنظمة الخارجية.
- **تكوين سهل** - اضبط أي سياسة بدون كتابة أكواد. عيّن قوائم السماح المحمية والفروع المحمية والحدود الفردية لكل مشروع أو عالمياً. يتم دمج ثلاث نطاقات تكوينية تلقائياً.
- **مراقب الوكيل** - شاهد ما فعله وكلاؤك أثناء غيابك. استعرض الجلسات وتفقد كل استدعاء أداة وراجع بالضبط أين تم تطبيق السياسات.

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

### 1. تفعيل السياسات عالمياً

```bash
failproofai policies --install
```

يكتب إدخالات الخطاف في `~/.claude/settings.json`. سيستدعي Claude Code الآن failproofai قبل وبعد كل استدعاء أداة.

### 2. شغّل لوحة التحكم

```bash
failproofai
```

يفتح `http://localhost:8020` - استعرض الجلسات وتفقد السجلات وأدر السياسات.

### 3. تحقق من ما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسات

### النطاقات

| النطاق | الأمر | حيث يكتب |
|--------|--------|-----------------|
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

## التكوين

يوجد تكوين السياسة في `~/.failproofai/policies-config.json` (عام) أو `.failproofai/policies-config.json` في مشروعك (لكل مشروع).

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
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "مفتاح MyCo API" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**يتم دمج ثلاث نطاقات تكوينية** تلقائياً (مشروع → محلي → عام). انظر [docs/configuration.mdx](docs/configuration.mdx) للحصول على قواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابلة للتكوين |
|--------|-------------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام المميزة | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودي غير المقصود | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من توجيه النصوص غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع الإلغاء الذاتي | |
| `sanitize-jwt` | إيقاف تسرب رموز JWT إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف تسرب مفاتيح API إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف تسرب بيانات اعتماد قاعدة البيانات إلى سياق الوكيل | |
| `sanitize-private-key-content` | تحرير كتل المفاتيح الخاصة PEM من الإخراج | |
| `sanitize-bearer-tokens` | تحرير رموز Bearer للمصادقة من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | احبس الوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح الخاصة والشهادات | `additionalPatterns` |
| `block-push-master` | منع الدفع غير المقصود إلى main/master | `protectedBranches` |
| `block-work-on-main` | إبقاء الوكلاء بعيداً عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | تذكير الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | تذكير الوكلاء قبل إسقاط التخزين المؤقت | |
| `warn-all-files-staged` | اكتشف `git add -A` العرضي | |
| `warn-destructive-sql` | اكتشف DROP/DELETE SQL قبل التنفيذ | |
| `warn-schema-alteration` | اكتشف ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | اكتشف عمليات كتابة الملفات الكبيرة غير المتوقعة | `thresholdKb` |
| `warn-package-publish` | اكتشف `npm publish` العرضي | |
| `warn-background-process` | اكتشف عمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | اكتشف عمليات تثبيت الحزم العامة غير المقصودة | |
| …والمزيد | | |

تفاصيل السياسة الكاملة ومرجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة لإبقاء وكلائك موثوقين ومركزين على المهمة:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "احجب الكتابة إلى المسارات التي تحتوي على 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("الكتابة إلى مسارات الإنتاج محظورة");
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
|----------|--------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح بالعملية وإرسال السياق المعلوماتي إلى Claude |
| `deny(message)` | حجب العملية؛ الرسالة معروضة على Claude |
| `instruct(message)` | أضف السياق إلى موجه Claude؛ لا يحجب |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`، `"PostToolUse"`، `"Notification"`، `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"`، `"Write"`، `"Read"`، …) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمولة الحدث الخام الكاملة |
| `session.cwd` | `string` | دليل عمل جلسة Claude Code |
| `session.sessionId` | `string` | معرّف الجلسة |
| `session.transcriptPath` | `string` | مسار ملف نسخ جلسة الجلسة |

تدعم الخطافات المخصصة الواردات المحلية العابرة والانتظار غير المتزامن والوصول إلى `process.env`. الأخطاء آمنة (مسجلة في `~/.failproofai/hook.log`، استمرار السياسات المدمجة). انظر [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للحصول على الدليل الكامل.

### سياسات قائمة على الاتفاقية

انقل ملفات `*policies.{js,mjs,ts}` إلى `.failproofai/policies/` وسيتم تحميلها تلقائياً - لا توجد حاجة لعلم `--custom` أو تغييرات التكوين. يعمل مثل git hooks: انقل ملف، فقط يعمل.

```text
# مستوى المشروع - التزام بـ git، مشاركة مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# المستوى الشخصي - شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

يتم تحميل كلا المستويين (اتحاد). يتم تحميل الملفات أبجدياً داخل كل دليل. بادئة مع `01-`، `02-`، إلخ للتحكم في الترتيب. انظر [examples/convention-policies/](examples/convention-policies/) للحصول على أمثلة جاهزة للاستخدام.

---

## قياس الاستخدام

يجمع Failproof AI قياس استخدام مجهول عبر PostHog لفهم استخدام الميزات. لا يتم إرسال محتوى الجلسة أو أسماء الملفات أو إدخالات الأدوات أو المعلومات الشخصية.

عطّله:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [Built-in Policies](docs/built-in-policies.mdx) | جميع السياسات المدمجة الثلاثين مع المعاملات |
| [Custom Policies](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [Configuration](docs/configuration.mdx) | صيغة ملف التكوين ودمج النطاق |
| [Dashboard](docs/dashboard.mdx) | راقب الجلسات واستعرض نشاط السياسة |
| [Architecture](docs/architecture.mdx) | كيفية عمل نظام الخطاف |
| [Testing](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### شغّل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify في `http://localhost:3000`. ينظر الحاوية للتغييرات إذا قمت بتثبيت دليل التوثيق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

يستخدم `.claude/settings.json` في هذا المستودع `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. وذلك لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه يخلق تضاربًا يشير إلى نفسه.

بالنسبة لجميع المستودعات الأخرى، الطريقة الموصى بها هي `npx -y failproofai`، المثبتة عبر:

```bash
failproofai policies --install --scope project
```

## المساهمة

انظر [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الترخيص

انظر [LICENSE](LICENSE).

---

تم البناء والحفاظ عليه بواسطة **ExosphereHost: Reliability Research Lab for Your Agents**. نساعد المؤسسات والشركات الناشئة على تحسين موثوقية وكلائهم الذكية من خلال وكلائنا وبرامجنا وخبرتنا. تعرّف على المزيد في [exosphere.host](https://exosphere.host).


</div>