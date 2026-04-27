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

أسهل طريقة لإدارة السياسات التي تحافظ على وكلاء AI موثوقة وتركز على المهام وتعمل بشكل مستقل - لـ **Claude Code** و **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **39 سياسة مدمجة** - اكتشف أنماط الفشل الشائعة للوكيل من الصندوق. احجب الأوامر المدمرة، منع تسرب الأسرار، احتفظ بالوكلاء داخل حدود المشروع، اكتشف الحلقات، والمزيد.
- **سياسات مخصصة** - اكتب قواعد الموثوقية الخاصة بك في JavaScript. استخدم واجهة برمجة التطبيقات `allow`/`deny`/`instruct` لفرض الاتفاقيات والوقاية من الانجراف وتقييد العمليات أو التكامل مع الأنظمة الخارجية.
- **إعدادات سهلة** - اضبط أي سياسة بدون كتابة أكواد. عيّن قوائم بيضاء والفروع المحمية والحدود لكل مشروع أو عالمياً. ثلاث نطاقات إعدادات تدمج تلقائياً.
- **مراقب الوكيل** - شاهد ما فعله وكيلوك أثناء غيابك. استعرض الجلسات وافحص كل استدعاء أداة واستعرض بالضبط أين تم تفعيل السياسات.

كل شيء يعمل محلياً - لا تغادر البيانات جهازك.

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

يكتب مدخلات الخطاف في `~/.claude/settings.json`. سيقوم Claude Code الآن باستدعاء failproofai قبل وبعد كل استدعاء أداة.

### 2. تشغيل لوحة التحكم

```bash
failproofai
```

يفتح `http://localhost:8020` - استعرض الجلسات وافحص السجلات وأدر السياسات.

### 3. تحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسة

### النطاقات

| النطاق | الأمر | المكان المكتوب إليه |
|-------|---------|-----------------|
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

## الإعدادات

تقع إعدادات السياسة في `~/.failproofai/policies-config.json` (عام) أو `.failproofai/policies-config.json` في مشروعك (لكل مشروع).

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

**ثلاث نطاقات إعدادات** تندمج تلقائياً (مشروع → محلي → عام). انظر [docs/configuration.mdx](docs/configuration.mdx) لقواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابل للإعدادات |
|--------|-------------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام ذات الامتيازات | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودي المقصود | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من تمرير البرامج النصية غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | إيقاف رموز JWT من التسرب إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف مفاتيح API من التسرب إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف بيانات اعتماد قاعدة البيانات من التسرب إلى سياق الوكيل | |
| `sanitize-private-key-content` | تحرير كتل مفاتيح PEM الخاصة من الإخراج | |
| `sanitize-bearer-tokens` | تحرير رموز Bearer في المصادقة من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | احتفظ بالوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح الخاصة والشهادات | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | احتفظ بالوكلاء بعيداً عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | تذكير الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | تذكير الوكلاء قبل إسقاط المخزن المؤقت | |
| `warn-all-files-staged` | اكتشف `git add -A` العرضي | |
| `warn-destructive-sql` | اكتشف SQL DROP/DELETE قبل التنفيذ | |
| `warn-schema-alteration` | اكتشف ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | اكتشف عمليات الكتابة الكبيرة بشكل غير متوقع | `thresholdKb` |
| `warn-package-publish` | اكتشف `npm publish` العرضي | |
| `warn-background-process` | اكتشف إطلاق العمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | اكتشف تثبيت الحزم العامة غير المقصودة | |
| …والمزيد | | |

تفاصيل السياسة الكاملة ومرجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة للحفاظ على موثوقية الوكلاء وتركيزهم على المهام:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "حجب الكتابة إلى المسارات التي تحتوي على 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("الكتابة إلى مسارات الإنتاج مرفوعة");
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
| `allow(message)` | السماح وإرسال سياق معلوماتي إلى Claude |
| `deny(message)` | حجب العملية؛ الرسالة تظهر لـ Claude |
| `instruct(message)` | إضافة سياق إلى موجه Claude؛ لا تحجب |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`، `"PostToolUse"`، `"Notification"`، `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"`، `"Write"`، `"Read"`، …) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمولة الحدث الأصلية الكاملة |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرّف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نسخة جلسة الكود |

الخطافات المخصصة تدعم الاستيرادات المحلية العابرة و async/await والوصول إلى `process.env`. الأخطاء تفشل مفتوحة (مسجلة في `~/.failproofai/hook.log`، السياسات المدمجة تستمر). انظر [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للدليل الكامل.

### السياسات المستندة إلى الاتفاقيات

أسقط ملفات `*policies.{js,mjs,ts}` في `.failproofai/policies/` وسيتم تحميلها تلقائياً - لا توجد أعلام أو تغييرات إعدادات مطلوبة. التزم الدليل بـ git وكل عضو في الفريق يحصل على نفس معايير الجودة تلقائياً.

```text
# مستوى المشروع — موزعة مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# المستوى الشخصي — شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

كلا المستويين يحمّل (الاتحاد). الملفات تحمّل أبجدياً داخل كل مجلد. البادئة بـ `01-`, `02-`, إلخ. للتحكم في الترتيب. مع اكتشاف الفريق لأنماط فشل جديدة، أضف سياسة وادفع — الجميع يحصلون على التحديث في السحب التالي. انظر [examples/convention-policies/](examples/convention-policies/) للأمثلة الجاهزة للاستخدام.

---

## قياس الاستخدام

يجمع Failproof AI تلميحات الاستخدام المجهولة عبر PostHog لفهم استخدام الميزات. لا يتم أبداً إرسال محتوى الجلسة أو أسماء الملفات أو إدخالات الأداة أو المعلومات الشخصية.

عطّله:

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
| [Configuration](docs/configuration.mdx) | تنسيق ملف الإعدادات ودمج النطاق |
| [Dashboard](docs/dashboard.mdx) | راقب الجلسات واستعرض نشاط السياسة |
| [Architecture](docs/architecture.mdx) | كيف يعمل نظام الخطاف |
| [Testing](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### تشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify docs على `http://localhost:3000`. حاوية المراقبة للتغييرات إذا كنت تثبّت دليل الوثائق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

يستخدم `.claude/settings.json` في هذا الريبو `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. هذا لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه ينشئ تضارباً ذاتي المرجع.

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

بُني وصُيّن بواسطة **ExosphereHost: مختبر أبحاث الموثوقية لوكلائك**. نساعد المؤسسات والشركات الناشئة على تحسين موثوقية وكلائهم من خلال وكلائنا والبرامج والخبرة. تعرف على المزيد على [exosphere.host](https://exosphere.host).


</div>