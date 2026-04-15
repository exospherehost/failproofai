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

הדרך הקלה ביותר לנהל מדיניות שמשמרת את סוכני ה-AI שלך אמינים, ממוקדים במשימה ופועלים באופן אוטונומי - עבור **Claude Code** וה-**Agents SDK**.

- **30 מדיניות מובנות** - זיהוי תקלות נפוצות של סוכנים מחוץ לקופסה. חסימת פקודות הרסניות, מניעת דליפת סודות, שמירת סוכנים בגבולות הפרויקט, זיהוי לולאות ועוד.
- **מדיניות מותאמת אישית** - כתוב כללי אמינות משלך ב-JavaScript. השתמש ב-API של `allow`/`deny`/`instruct` כדי לאכוף קונבנציות, למנוע סטייה, לשלוט בפעולות, או להשתלב עם מערכות חיצוניות.
- **הגדרה קלה** - כוון כל מדיניות ללא כתיבת קוד. הגדר רשימות היתרים, ענפים מוגנים וסף ערכים לכל פרויקט או גלובלית. שלושה היקפי תצורה ממוזגים אוטומטית.
- **ניטור סוכנים** - ראה מה עשו הסוכנים שלך בזמן שלא היית. עיין בסשנים, בחן כל קריאת כלי, ובדוק בדיוק היכן הופעלה המדיניות.

הכל פועל באופן מקומי - אף מידע לא יוצא מהמחשב שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה מקוד מקור)

---

## התקנה

```bash
npm install -g failproofai
# or
bun add -g failproofai
```

---

## התחלה מהירה

### 1. הפעל מדיניות גלובלית

```bash
failproofai policies --install
```

כותב ערכי hook לתוך `~/.claude/settings.json`. Claude Code יפעיל כעת את failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעל את לוח הבקרה

```bash
failproofai
```

פותח את `http://localhost:8020` - עיין בסשנים, בחן לוגים, נהל מדיניות.

### 3. בדוק מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### היקפים

| היקף | פקודה | מיקום הכתיבה |
|-------|---------|-----------------|
| גלובלי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקנת מדיניות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסרת מדיניות

```bash
failproofai policies --uninstall
# or for a specific scope:
failproofai policies --uninstall --scope project
```

---

## תצורה

תצורת המדיניות נמצאת ב-`~/.failproofai/policies-config.json` (גלובלי) או `.failproofai/policies-config.json` בפרויקט שלך (לכל פרויקט).

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

**שלושה היקפי תצורה** ממוזגים אוטומטית (פרויקט ← מקומי ← גלובלי). ראה [docs/configuration.mdx](docs/configuration.mdx) לכללי מיזוג מלאים.

---

## מדיניות מובנות

| מדיניות | תיאור | ניתן להגדרה |
|--------|-------------|:---:|
| `block-sudo` | מניעת הרצת פקודות מערכת מורשות על ידי סוכנים | `allowPatterns` |
| `block-rm-rf` | מניעת מחיקת קבצים רקורסיבית בשוגג | `allowPaths` |
| `block-curl-pipe-sh` | מניעת העברת סקריפטים לא מהימנים ל-shell על ידי סוכנים | |
| `block-failproofai-commands` | מניעת הסרה עצמית | |
| `sanitize-jwt` | עצירת דליפת טוקני JWT לתוך הקשר הסוכן | |
| `sanitize-api-keys` | עצירת דליפת מפתחות API לתוך הקשר הסוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצירת דליפת אישורי מסד נתונים לתוך הקשר הסוכן | |
| `sanitize-private-key-content` | הסרת בלוקי מפתח פרטי PEM מהפלט | |
| `sanitize-bearer-tokens` | הסרת טוקני Authorization Bearer מהפלט | |
| `block-env-files` | מניעת קריאת קבצי .env על ידי סוכנים | |
| `protect-env-vars` | מניעת הדפסת משתני סביבה על ידי סוכנים | |
| `block-read-outside-cwd` | שמירת סוכנים בגבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מניעת כתיבה לקבצי מפתח פרטי ואישורים | `additionalPatterns` |
| `block-push-master` | מניעת דחיפה בשוגג לענף main/master | `protectedBranches` |
| `block-work-on-main` | שמירת סוכנים מחוץ לענפים מוגנים | `protectedBranches` |
| `block-force-push` | מניעת `git push --force` | |
| `warn-git-amend` | תזכורת לסוכנים לפני תיקון commits | |
| `warn-git-stash-drop` | תזכורת לסוכנים לפני מחיקת stashes | |
| `warn-all-files-staged` | תפיסת `git add -A` בשוגג | |
| `warn-destructive-sql` | תפיסת SQL מסוג DROP/DELETE לפני הרצה | |
| `warn-schema-alteration` | תפיסת ALTER TABLE לפני הרצה | |
| `warn-large-file-write` | תפיסת כתיבת קבצים גדולים באופן בלתי צפוי | `thresholdKb` |
| `warn-package-publish` | תפיסת `npm publish` בשוגג | |
| `warn-background-process` | תפיסת הפעלת תהליכי רקע לא מכוונים | |
| `warn-global-package-install` | תפיסת התקנות חבילות גלובליות לא מכוונות | |
| …ועוד | | |

פרטי מדיניות מלאים ועיון בפרמטרים: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניות מותאמת אישית

כתוב מדיניות משלך לשמירת אמינות הסוכנים וממוקדות במשימה:

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

התקן באמצעות:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי החלטה

| פונקציה | אפקט |
|----------|--------|
| `allow()` | אישור הפעולה |
| `allow(message)` | אישור ושליחת הקשר מידעי ל-Claude *(בטא)* |
| `deny(message)` | חסימת הפעולה; ההודעה מוצגת ל-Claude |
| `instruct(message)` | הוספת הקשר לפרומפט של Claude; לא חוסם |

### אובייקט ההקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | הכלי הנקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי הקלט של הכלי |
| `payload` | `object` | מטען האירוע הגולמי המלא |
| `session.cwd` | `string` | ספריית העבודה של סשן Claude Code |
| `session.sessionId` | `string` | מזהה הסשן |
| `session.transcriptPath` | `string` | נתיב לקובץ תמליל הסשן |

hooks מותאמים אישית תומכים בייבוא מקומי טרנזיטיבי, async/await וגישה ל-`process.env`. שגיאות הן fail-open (נרשמות ל-`~/.failproofai/hook.log`, מדיניות מובנות ממשיכות לפעול). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) למדריך המלא.

---

## טלמטריה

Failproof AI אוסף טלמטריית שימוש אנונימית דרך PostHog להבנת אופן השימוש בתכונות. תוכן סשנים, שמות קבצים, קלטי כלים, או מידע אישי לא נשלחים לעולם.

השבתה:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [התחלה](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [מדיניות מובנות](docs/built-in-policies.mdx) | כל 30 המדיניות המובנות עם פרמטרים |
| [מדיניות מותאמת אישית](docs/custom-policies.mdx) | כתוב מדיניות משלך |
| [תצורה](docs/configuration.mdx) | פורמט קובץ תצורה ומיזוג היקפים |
| [לוח בקרה](docs/dashboard.mdx) | ניטור סשנים וסקירת פעילות מדיניות |
| [ארכיטקטורה](docs/architecture.mdx) | איך מערכת ה-hook עובדת |
| [בדיקות](docs/testing.mdx) | הרצת בדיקות וכתיבת בדיקות חדשות |

### הרצת תיעוד מקומית

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר התיעוד של Mintlify בכתובת `http://localhost:3000`. הקונטיינר עוקב אחר שינויים אם תרכיב את ספריית התיעוד:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## תרומה לפרויקט

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).


</div>