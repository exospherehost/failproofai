> **⚠️** هذه ترجمة آلية. للاطلاع على أحدث إصدار، راجع [English README](../../README.md).

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | **🇮🇱 עברית**

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

**תרגומים**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

הדרך הקלה ביותר לנהל מדיניות המשמרת על אמינות וביצוע משימות של סוכני AI שלך, ומאפשרת להם לפעול באופן אוטונומי - ל**Claude Code** וה**Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **32 מדיניות מובנות** - תפסו חדשות תקלות נפוצות בסוכנים שלכם. חסמו פקודות הרסניות, מנעו דליפת סודות, שמרו סוכנים בגבולות הפרויקט, גלו לולאות אינסופיות ועוד.
- **מדיניות מותאמת אישית** - כתבו כללי אמינות משלכם ב-JavaScript. השתמשו ב-API `allow`/`deny`/`instruct` כדי לאכוף כינויים, למנוע סטיות, לשער פעולות, או להשתלב עם מערכות חיצוניות.
- **קונפיגורציה קלה** - התאימו כל מדיניות ללא כתיבת קוד. הגדירו רשימות אישור, ענפים מוגנים, סף בעל קצבה לפרויקט או בצורה גלובלית. שלוש-קפדנות תצורה מתמזגות באופן אוטומטי.
- **Agent Monitor** - ראו מה עשו הסוכנים שלכם בזמן שהיתם רחוק. עיינו בסשנים, בדקו כל זימון כלי, ובדקו בדיוק איפה על מדיניות נערכו.

הכל פועל בצורה מקומית - אף נתונים לא עוזבים את המכונה שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה מהמקור)

---

## התקנה

```bash
npm install -g failproofai
# או
bun add -g failproofai
```

---

## תחילת עבודה מהירה

### 1. הפעילו מדיניות בצורה גלובלית

```bash
failproofai policies --install
```

כותב ערכי hook ל`~/.claude/settings.json`. Claude Code יזמן עתה את failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעילו את הדשבורד

```bash
failproofai
```

פותח את `http://localhost:8020` - עיין בסשנים, בחן יומנים, נהל מדיניות.

### 3. בדקו מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### קפדנויות

| Scope | פקודה | איפה זה כותב |
|-------|---------|-----------------|
| גלובלי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקינו מדיניות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסרת מדיניות

```bash
failproofai policies --uninstall
# או ל-scope ספציפי:
failproofai policies --uninstall --scope project
```

---

## קונפיגורציה

תצורת המדיניות חיה ב`~/.failproofai/policies-config.json` (גלובלי) או `.failproofai/policies-config.json` בפרויקט שלך (לפי-פרויקט).

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

**שלוש קפדנויות תצורה** מתמזגות באופן אוטומטי (פרויקט → מקומי → גלובלי). ראו [docs/configuration.mdx](docs/configuration.mdx) לכללי מזיגה מלאים.

---

## מדיניות מובנית

| מדיניות | תיאור | ניתן להתאמה אישית |
|--------|-------------|:---:|
| `block-sudo` | מנעו סוכנים מהפעלת פקודות מערכת מחוזקות | `allowPatterns` |
| `block-rm-rf` | מנעו מחיקת קובץ רקורסיבית אקראית | `allowPaths` |
| `block-curl-pipe-sh` | מנעו סוכנים מהצנרור סקריפטים לא מהימנים לקליפה | |
| `block-failproofai-commands` | מנעו הסרה עצמית | |
| `sanitize-jwt` | עצרו דלף JWT אסימונים לקשר סוכן | |
| `sanitize-api-keys` | עצרו דלף API מפתחות לקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצרו דלף הרשאות מסד נתונים לקשר סוכן | |
| `sanitize-private-key-content` | הסתירו בלוקים של מפתחות פרטיים PEM מפלט | |
| `sanitize-bearer-tokens` | הסתירו Authorization Bearer tokens מפלט | |
| `block-env-files` | מנעו סוכנים מקריאת קובצי .env | |
| `protect-env-vars` | מנעו סוכנים מהדפסת משתני סביבה | |
| `block-read-outside-cwd` | שמרו סוכנים בתוך גבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מנעו כתיבות לקובצי מפתח פרטי וסרטיפיקט | `additionalPatterns` |
| `block-push-master` | מנעו דחיפות אקראיות ל-main/master | `protectedBranches` |
| `block-work-on-main` | שמרו סוכנים מענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנעו `git push --force` | |
| `warn-git-amend` | הזכירו סוכנים לפני שינוי commits | |
| `warn-git-stash-drop` | הזכירו סוכנים לפני ירידת stashes | |
| `warn-all-files-staged` | תפסו `git add -A` אקראי | |
| `warn-destructive-sql` | תפסו DROP/DELETE SQL לפני הרצה | |
| `warn-schema-alteration` | תפסו ALTER TABLE לפני הרצה | |
| `warn-large-file-write` | תפסו כתיבות קובצים גדולות בצורה בלתי צפויה | `thresholdKb` |
| `warn-package-publish` | תפסו `npm publish` אקראי | |
| `warn-background-process` | תפסו הפעלות תהליך רקע לא כוונוניות | |
| `warn-global-package-install` | תפסו התקנות חבילות גלובליות לא כוונוניות | |
| …ועוד | | |

פרטי מדיניות מלאים והפניית פרמטר: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניות מותאמת אישית

כתבו את המדיניות שלכם כדי לשמור על אמינות וביצוע משימות של סוכנים:

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

התקינו עם:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי הגבלה

| פונקציה | השפעה |
|----------|--------|
| `allow()` | אישור הפעולה |
| `allow(message)` | אישור וקבלת קשר מידע ל-Claude |
| `deny(message)` | חסום את הפעולה; הודעה מוצגת ל-Claude |
| `instruct(message)` | הוסיפו הקשר לפרומפט של Claude; לא חוסם |

### אובייקט ההקשר (`ctx`)

| שדה | Type | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי שנקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | גודל אירוע גולמי מלא |
| `session.cwd` | `string` | ספרייה עובדת של סשן Claude Code |
| `session.sessionId` | `string` | מזהה סשן |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול הסשן |

ווי מותאמים אישית תומכים בייבואים מקומיים טרנזיטיביים, async/await, וגישה ל`process.env`. שגיאות כושלות-פתוחות (רשומות ל`~/.failproofai/hook.log`, מדיניות מובנותות ממשיכות). ראו [docs/custom-hooks.mdx](docs/custom-hooks.mdx) לגיד מלא.

### מדיניות המבוססות על כינוי

זרוק `*policies.{js,mjs,ts}` קבצים לתוך `.failproofai/policies/` והם טוענים באופן אוטומטי — ללא דגלים או שינויי תצורה. שימו את הספרייה לgit וכל חבר בצוות מקבל את תקני האיכות של הדבר באופן אוטומטי.

```text
# רמת פרויקט — התחייבו לgit, משתפים עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישי, חל על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי רמות טוענות (union). קבצים טוענים בא"ב בכל ספרייה. תחילית עם `01-`, `02-`, וכו'. כדי לשלוט בסדר. כאשר הצוות שלך מגלה חדשות תקלות, הוספו מדיניות ודחפו — כל אחד מקבל את העדכון בפול הבא שלהם. ראו [examples/convention-policies/](examples/convention-policies/) לדוגמאות מוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. תוכן סשן, שמות קבצים, קלטי כלי, או מידע אישי לעולם אינו נשלח.

בטלו זאת:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 32 מדיניות מובנויות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתוב את המדיניות שלך |
| [Configuration](docs/configuration.mdx) | תצורת קובץ תצורה ומזיגת קפדנות |
| [Dashboard](docs/dashboard.mdx) | מוניטור סשנים וביקורת של פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | כיצד מערכת הווי עובדת |
| [Testing](docs/testing.mdx) | הרצת בדיקות וכתיבת חדשות |

### הרץ תיעוד בצורה מקומית

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר Mintlify docs ב`http://localhost:3000`. המיכל צופה בשינויים אם אתה מרכיב את ספרייית docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

`.claude/settings.json` של ריפו זה משתמש ב`bun ./bin/failproofai.mjs --hook <EventType>` במקום הפקודה הרגילה `npx -y failproofai`. זה כי הפעלת `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצרת סכסוך הפניה עצמית.

לכל המחסנים האחרים, ההתקרבות המומלצת היא `npx -y failproofai`, מותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראו [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראו [LICENSE](LICENSE).

---

בנוי ותחול על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנחנו עוזרים לארגונים וסטארטאפים שלהשפר את אמינות סוכני AI שלהם דרך הסוכנים שלנו, תוכנה, וקבילות. למדו עוד ב[exosphere.host](https://exosphere.host).


</div>