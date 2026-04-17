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

הדרך הקלה ביותר לנהל מדיניויות שמשמרות את סוכני ה-AI שלך כשיש לך ביטחון נפש, ממוקדים במטרה, וופועלים באופן עצמאי - עבור **Claude Code** וה-**Agents SDK**.

- **30 מדיניויות מובנות** - תופס מצבי כשל נפוצים של סוכנים מתוך הקופסה. חסום פקודות הרסניות, מנע דליפת סודות, שמור סוכנים בתוך גבולות הפרויקט, גלה לולאות, ועוד.
- **מדיניויות מותאמות אישית** - כתוב את כללי האמינות שלך ב-JavaScript. השתמש ב-API של `allow`/`deny`/`instruct` כדי לאכוף קונוונציות, למנוע סטיות, לשערים פעולות, או לאיתור עם מערכות חיצוניות.
- **הגדרה קלה** - כונן כל מדיניות ללא כתיבת קוד. הגדר רשימות מותר, ענפים מוגנים, סף לכל פרויקט או גלובלי. שלוש טווחי הגדרה מתמזגים באופן אוטומטי.
- **צג סוכן** - ראה מה עשו הסוכנים שלך בזמן שהיית רחוק. עיין בהפעלות, בדוק כל קריאת כלי, ובדוק בדיוק היכן יריות מדיניויות.

הכל פועל באופן מקומי - לא נתונים משאיר את המכונה שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה ממקור)

---

## התקנה

```bash
npm install -g failproofai
# או
bun add -g failproofai
```

---

## התחלה מהירה

### 1. הפוך מדיניויות פעילות ברחבי העולם

```bash
failproofai policies --install
```

כותב ערכי ווו ל-`~/.claude/settings.json`. Claude Code יִזעוק כעת failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעל את לוח המחוונים

```bash
failproofai
```

פותח `http://localhost:8020` - עיין בהפעלות, בדוק יומנים, נהל מדיניויות.

### 3. בדוק מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### טווחים

| טווח | פקודה | היכן זה כותב |
|-------|--------|-----------------|
| גלובלי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקן מדיניויות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסר מדיניויות

```bash
failproofai policies --uninstall
# או עבור טווח ספציפי:
failproofai policies --uninstall --scope project
```

---

## הגדרה

הגדרת המדיניות חיה ב-`~/.failproofai/policies-config.json` (גלובלי) או `.failproofai/policies-config.json` בפרויקט שלך (לכל פרויקט).

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
      "hint": "השתמש ב-apt-get ישירות ללא sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "נסה ליצור ענף חדש במקום זאת."
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

**שלושה טווחי הגדרה** מתמזגים באופן אוטומטי (פרויקט → מקומי → גלובלי). ראה [docs/configuration.mdx](docs/configuration.mdx) עבור כללי מיזוג מלאים.

---

## מדיניויות מובנות

| מדיניות | תיאור | ניתן להגדרה |
|--------|-------------|:---:|
| `block-sudo` | מנע מסוכנים לתחום הרצת פקודות מערכת בעלויות | `allowPatterns` |
| `block-rm-rf` | מנע מחיקת קבצים רקורסיבית בלתי מכוונת | `allowPaths` |
| `block-curl-pipe-sh` | מנע מסוכנים מצנרור סקריפטים לא מהימנים ללוח | |
| `block-failproofai-commands` | מנע הסרה עצמית | |
| `sanitize-jwt` | עצור טוקני JWT מדליפה לתוך תיאור המכונה | |
| `sanitize-api-keys` | עצור מפתחות API מדליפה לתוך תיאור המכונה | `additionalPatterns` |
| `sanitize-connection-strings` | עצור פרטי זיהוי מסד נתונים מדליפה לתוך תיאור המכונה | |
| `sanitize-private-key-content` | ערוך בלוקי מפתח פרטי PEM מהפלט | |
| `sanitize-bearer-tokens` | ערוך טוקני Authorization Bearer מהפלט | |
| `block-env-files` | שמור סוכנים מקריאת קבצי .env | |
| `protect-env-vars` | מנע מסוכנים להדפיס משתנים סביבה | |
| `block-read-outside-cwd` | שמור סוכנים בתוך גבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מנע כתיבות לקבצי מפתח פרטי ותעודות | `additionalPatterns` |
| `block-push-master` | מנע דחיפות בלתי מכוונות לענף ראשי/master | `protectedBranches` |
| `block-work-on-main` | שמור סוכנים מעל ענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנע `git push --force` | |
| `warn-git-amend` | הזכיר לסוכנים לפני עדכון קומיטים | |
| `warn-git-stash-drop` | הזכיר לסוכנים לפני השלכת סטאשים | |
| `warn-all-files-staged` | תפוס `git add -A` בלתי מכוון | |
| `warn-destructive-sql` | תפוס DROP/DELETE SQL לפני ביצוע | |
| `warn-schema-alteration` | תפוס ALTER TABLE לפני ביצוע | |
| `warn-large-file-write` | תפוס כתיבות קבצים גדולות באופן בלתי צפוי | `thresholdKb` |
| `warn-package-publish` | תפוס `npm publish` בלתי מכוון | |
| `warn-background-process` | תפוס הפעלות תהליכים ברקע לא מכוונות | |
| `warn-global-package-install` | תפוס התקנות חבילה גלובליות לא מכוונות | |
| …ועוד | | |

פרטי מדיניות מלאים והפניית פרמטרים: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניויות מותאמות אישית

כתוב מדיניויות משלך כדי לשמור על סוכנים אמינים וממוקדים במטרה:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסום כתיבות לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבות לנתיבי production מחסומות");
    return allow();
  },
});
```

התקן עם:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי החלטה

| פונקציה | השפעה |
|----------|--------|
| `allow()` | אפשר את הפעולה |
| `allow(message)` | אפשר ושלח תיאור מידע ל-Claude |
| `deny(message)` | חסום את הפעולה; ההודעה מוצגת ל-Claude |
| `instruct(message)` | הוסף הקשר להנמקה של Claude; לא חוסם |

### אובייקט הקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי שנקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | טעינת אירוע גולמית מלאה |
| `session.cwd` | `string` | ספריית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול ההפעלה |

ווו מותאם אישית תומך בייבואים מקומיים חילופיים, async/await, וגישה ל-`process.env`. שגיאות הן fail-open (מתועדות ל-`~/.failproofai/hook.log`, מדיניויות מובנות ממשיכות). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) לקבלת מדריך מלא.

### מדיניויות על בסיס קונוונציה

שחרר קבצי `*policies.{js,mjs,ts}` ל-`.failproofai/policies/` והם נטענים באופן אוטומטי — אין צורך בדגל `--custom` או שינויי הגדרה. עובד כמו git hooks: שחרור קובץ, זה פשוט עובד.

```text
# רמת פרויקט — מחויבת ל-git, משותפת עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישית, חלה על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי רמות נטענות (union). קבצים נטענים בצורה אלפבתית בתוך כל ספרייה. קדימה עם `01-`, `02-`, וכו' כדי לשלוט בסדר. ראה [examples/convention-policies/](examples/convention-policies/) לקבלת דוגמאות המוכנות לשימוש.

---

## טלמטריה

Failproof AI אוספת טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. לא תוכן הפעלה, שמות קבצים, קלטי כלים, או מידע אישי לעולם נשלח.

השבת זאת:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 30 המדיניויות המובנות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתוב את המדיניויות שלך |
| [Configuration](docs/configuration.mdx) | פורמט קובץ הגדרה ומיזוג טווח |
| [Dashboard](docs/dashboard.mdx) | צג הפעלות ובדוק פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | כיצד מערכת הווו עובדת |
| [Testing](docs/testing.mdx) | הפעלת בדיקות וכתיבת חדשות |

### הפעל תיעוד באופן מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר Mintlify docs ב-`http://localhost:3000`. המיכל משקיף לשינויים אם אתה מרכיב את ספריית הדוקומנטציה:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

`.claude/settings.json` של repo זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` במקום הפקודה `npx -y failproofai` הסטנדרטית. זה בגלל שהרצת `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצרת סכסוך התייחסות עצמית.

עבור כל repos אחרים, הגישה המומלצת היא `npx -y failproofai`, מותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).

---

בנוי ותחזוקה של **ExosphereHost: Reliability Research Lab for Your Agents**. אנחנו עוזרים לארגונים ויזמים לשפר את האמינות של סוכני ה-AI שלהם דרך הסוכנים שלנו, תוכנה, ומומחיות. למד עוד ב-[exosphere.host](https://exosphere.host).


</div>