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

أسهل طريقة لإدارة السياسات التي تجعل وكلاءك الذكيين موثوقين وملتزمين بالمهام ويعملون بشكل مستقل - لـ **Claude Code** و **Agents SDK**.

- **30 سياسة مدمجة** - اكتشف أنماط فشل الوكيل الشائعة مباشرة من الصندوق. احجب الأوامر المدمرة، ومنع تسرب الأسرار، واحتفظ بالوكلاء داخل حدود المشروع، واكتشف الحلقات، والمزيد.
- **سياسات مخصصة** - اكتب قواعد الموثوقية الخاصة بك في JavaScript. استخدم واجهات برمجية `allow`/`deny`/`instruct` لفرض الاتفاقيات، ومنع الانجراف، وتقييد العمليات، أو الدمج مع الأنظمة الخارجية.
- **تكوين سهل** - اضبط أي سياسة بدون كتابة أكواد. حدد قوائم السماح والفروع المحمية والحدود الدنيا لكل مشروع أو عام. يتم دمج ثلاث نطاقات للتكوين تلقائياً.
- **مراقب الوكيل** - اطلع على ما فعله وكلاؤك أثناء غيابك. تصفح الجلسات، وافحص كل استدعاء أداة، وراجع بالضبط حيث تم تفعيل السياسات.

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

يكتب إدخالات الخطاف في `~/.claude/settings.json`. سيقوم Claude Code الآن باستدعاء failproofai قبل وبعد كل استدعاء أداة.

### 2. تشغيل لوحة التحكم

```bash
failproofai
```

يفتح `http://localhost:8020` - تصفح الجلسات، وافحص السجلات، وأدر السياسات.

### 3. تحقق مما هو نشط

```bash
failproofai policies
```

---

## تثبيت السياسة

### النطاقات

| النطاق | الأمر | المكان الذي تكتب فيه |
|-------|---------|-----------------|
| عام (افتراضي) | `failproofai policies --install` | `~/.claude/settings.json` |
| المشروع | `failproofai policies --install --scope project` | `.claude/settings.json` |
| محلي | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### تثبيت سياسات معينة

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### إزالة السياسات

```bash
failproofai policies --uninstall
# أو لنطاق معين:
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

**يتم دمج ثلاث نطاقات للتكوين** تلقائياً (المشروع → المحلي → العام). انظر [docs/configuration.mdx](docs/configuration.mdx) للحصول على قواعد الدمج الكاملة.

---

## السياسات المدمجة

| السياسة | الوصف | قابل للتخصيص |
|--------|-------------|:---:|
| `block-sudo` | منع الوكلاء من تشغيل أوامر النظام المميزة | `allowPatterns` |
| `block-rm-rf` | منع حذف الملفات العودي العرضي | `allowPaths` |
| `block-curl-pipe-sh` | منع الوكلاء من نقل البرامج النصية غير الموثوقة إلى shell | |
| `block-failproofai-commands` | منع إلغاء التثبيت الذاتي | |
| `sanitize-jwt` | إيقاف تسرب رموز JWT إلى سياق الوكيل | |
| `sanitize-api-keys` | إيقاف تسرب مفاتيح API إلى سياق الوكيل | `additionalPatterns` |
| `sanitize-connection-strings` | إيقاف تسرب بيانات اعتماد قاعدة البيانات إلى سياق الوكيل | |
| `sanitize-private-key-content` | إعادة تحرير كتل مفاتيح PEM الخاصة من الإخراج | |
| `sanitize-bearer-tokens` | إعادة تحرير رموز Authorization Bearer من الإخراج | |
| `block-env-files` | منع الوكلاء من قراءة ملفات .env | |
| `protect-env-vars` | منع الوكلاء من طباعة متغيرات البيئة | |
| `block-read-outside-cwd` | احتفظ بالوكلاء داخل حدود المشروع | `allowPaths` |
| `block-secrets-write` | منع الكتابة إلى ملفات المفاتيح الخاصة والشهادات | `additionalPatterns` |
| `block-push-master` | منع الدفع العرضي إلى main/master | `protectedBranches` |
| `block-work-on-main` | ابعد الوكلاء عن الفروع المحمية | `protectedBranches` |
| `block-force-push` | منع `git push --force` | |
| `warn-git-amend` | ذكر الوكلاء قبل تعديل الالتزامات | |
| `warn-git-stash-drop` | ذكر الوكلاء قبل إسقاط المخزن المؤقت | |
| `warn-all-files-staged` | اكتشف `git add -A` العرضي | |
| `warn-destructive-sql` | اكتشف SQL DROP/DELETE قبل التنفيذ | |
| `warn-schema-alteration` | اكتشف ALTER TABLE قبل التنفيذ | |
| `warn-large-file-write` | اكتشف كتابات الملفات الكبيرة غير المتوقعة | `thresholdKb` |
| `warn-package-publish` | اكتشف `npm publish` العرضي | |
| `warn-background-process` | اكتشف عمليات الخلفية غير المقصودة | |
| `warn-global-package-install` | اكتشف عمليات التثبيت العام غير المقصودة | |
| …والمزيد | | |

تفاصيل السياسة الكاملة ومرجع المعاملات: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## السياسات المخصصة

اكتب سياساتك الخاصة لجعل وكلاءك موثوقين وملتزمين بالمهام:

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

ثبتها باستخدام:

```bash
failproofai policies --install --custom ./my-policies.js
```

### مساعدات القرار

| الدالة | التأثير |
|----------|--------|
| `allow()` | السماح بالعملية |
| `allow(message)` | السماح وإرسال السياق المعلوماتي إلى Claude |
| `deny(message)` | حظر العملية؛ الرسالة معروضة ل Claude |
| `instruct(message)` | إضافة سياق إلى موجه Claude؛ لا تحظر |

### كائن السياق (`ctx`)

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"` أو `"PostToolUse"` أو `"Notification"` أو `"Stop"` |
| `toolName` | `string` | الأداة التي يتم استدعاؤها (`"Bash"` أو `"Write"` أو `"Read"` وغيرها) |
| `toolInput` | `object` | معاملات إدخال الأداة |
| `payload` | `object` | حمولة الحدث الخام الكاملة |
| `session.cwd` | `string` | دليل العمل لجلسة Claude Code |
| `session.sessionId` | `string` | معرف الجلسة |
| `session.transcriptPath` | `string` | المسار إلى ملف نص جلسة العمل |

تدعم الخطافات المخصصة الاستيراد المحلي العابر، والانتظار غير المتزامن، والوصول إلى `process.env`. الأخطاء مفتوحة للفشل (تسجيل في `~/.failproofai/hook.log`، استمرار السياسات المدمجة). انظر [docs/custom-hooks.mdx](docs/custom-hooks.mdx) للحصول على الدليل الكامل.

### السياسات المستندة إلى الاتفاقية

ضع ملفات `*policies.{js,mjs,ts}` في `.failproofai/policies/` وسيتم تحميلها تلقائياً - لا حاجة لعلم `--custom` أو تغييرات التكوين. يعمل مثل git hooks: ضع الملف، وسيعمل.

```text
# مستوى المشروع — يتم الالتزام به في git، مشاركة مع الفريق
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# مستوى المستخدم — شخصي، ينطبق على جميع المشاريع
~/.failproofai/policies/my-policies.mjs
```

يتم تحميل كلا المستويين (الاتحاد). يتم تحميل الملفات بترتيب أبجدي ضمن كل دليل. أضف بادئة `01-` أو `02-` وما إلى ذلك للتحكم في الترتيب. انظر [examples/convention-policies/](examples/convention-policies/) للحصول على أمثلة جاهزة للاستخدام.

---

## قياس الاستخدام

يجمع Failproof AI بيانات قياس الاستخدام المجهول عبر PostHog لفهم استخدام الميزات. لا يتم أبداً إرسال محتوى الجلسة أو أسماء الملفات أو مدخلات الأدوات أو المعلومات الشخصية.

عطله:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## التوثيق

| الدليل | الوصف |
|-------|-------------|
| [البدء](docs/getting-started.mdx) | التثبيت والخطوات الأولى |
| [السياسات المدمجة](docs/built-in-policies.mdx) | جميع السياسات المدمجة الـ 30 مع المعاملات |
| [السياسات المخصصة](docs/custom-policies.mdx) | اكتب سياساتك الخاصة |
| [التكوين](docs/configuration.mdx) | تنسيق ملف التكوين ودمج النطاق |
| [لوحة التحكم](docs/dashboard.mdx) | مراقبة الجلسات ومراجعة نشاط السياسة |
| [الهندسة المعمارية](docs/architecture.mdx) | كيفية عمل نظام الخطاف |
| [الاختبار](docs/testing.mdx) | تشغيل الاختبارات وكتابة اختبارات جديدة |

### تشغيل التوثيق محلياً

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

يفتح موقع Mintlify docs في `http://localhost:3000`. الحاوية تراقب التغييرات إذا قمت بتركيب دليل التوثيق:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## ملاحظة لمساهمي failproofai

يستخدم `.claude/settings.json` الخاص بهذا المستودع `bun ./bin/failproofai.mjs --hook <EventType>` بدلاً من أمر `npx -y failproofai` القياسي. وذلك لأن تشغيل `npx -y failproofai` داخل مشروع failproofai نفسه يخلق تضاربة التعريف الذاتي.

بالنسبة لجميع المستودعات الأخرى، يُنصح باستخدام `npx -y failproofai`، والذي تم تثبيته عبر:

```bash
failproofai policies --install --scope project
```

## المساهمة

انظر [CONTRIBUTING.md](CONTRIBUTING.md).

---

## الترخيص

انظر [LICENSE](LICENSE).

---

تم البناء والصيانة من قبل **ExosphereHost: مختبر البحث عن الموثوقية لوكلائك**. نساعد المؤسسات والشركات الناشئة على تحسين موثوقية وكلائهم الذكيين من خلال وكلائنا وبرامجنا وخبرتنا. تعرف على المزيد في [exosphere.host](https://exosphere.host).


</div>