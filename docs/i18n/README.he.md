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

הדרך הקלה ביותר לנהל מדיניות המשמרות על סוכני AI שלך בעלי אמינות, ממוקדי משימה, ופועלים באופן עצמאי - עבור **Claude Code** וה-**Agents SDK**.

- **30 מדיניות מובנות** - תפסו מצבי כישלון נפוצים של סוכנים מהותיבה. חסמו פקודות הרסניות, מנעו דליפת סודות, שמרו סוכנים בתוך גבולות הפרויקט, גלו לולאות, ועוד.
- **מדיניות מותאמות אישית** - כתבו את כללי האמינות שלכם ב-JavaScript. השתמשו ב-API `allow`/`deny`/`instruct` כדי לאכוף קונוונציות, למנוע סטייה, לשער פעולות, או להשתלב עם מערכות חיצוניות.
- **תצורה קלה** - כווננו כל מדיניות ללא כתיבת קוד. הגדרו רשימות מורשה, ענפים מוגנים, סף ליחידה לפרויקט או באופן גלובלי. שלוש-טווח תצורה מתמזגת באופן אוטומטי.
- **Agent Monitor** - ראו מה עשו הסוכנים שלכם בזמן שהייתם הרחוק. דפדפו בהפעלות, בדקו כל קריאת כלי, וסקרו בדיוק איפה מדיניויות הופעלו.

הכל פועל באופן מקומי - אף נתונים לא משאירים את המכונה שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה מהקוד המקור)

---

## התקנה

```bash
npm install -g failproofai
# או
bun add -g failproofai
```

---

## התחלה מהירה

### 1. הפעלת מדיניויות בגלובליות

```bash
failproofai policies --install
```

כותב ערכי hook ל-`~/.claude/settings.json`. Claude Code יזמן כעת את failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעלת לוח הבקרה

```bash
failproofai
```

פותח את `http://localhost:8020` - דפדפו בהפעלות, בדקו יומנים, נהלו מדיניויות.

### 3. בדיקת מה הוא פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### טווחים

| טווח | פקודה | היכן הוא כותב |
|-------|---------|-----------------|
| גלובלי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקנת מדיניויות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסרת מדיניויות

```bash
failproofai policies --uninstall
# או לטווח ספציפי:
failproofai policies --uninstall --scope project
```

---

## תצורה

תצורת מדיניות נמצאת ב-`~/.failproofai/policies-config.json` (גלובלי) או `.failproofai/policies-config.json` בפרויקט שלכם (לכל פרויקט).

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
      "hint": "השתמשו ב-apt-get ישירות ללא sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "נסו ליצור ענף טרי במקום."
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

**שלוש טווחי תצורה** מתמזגים באופן אוטומטי (פרויקט → מקומי → גלובלי). ראו [docs/configuration.mdx](docs/configuration.mdx) לכללי מזג מלאים.

---

## מדיניויות מובנות

| מדיניות | תיאור | הניתן להגדרה |
|--------|-------------|:---:|
| `block-sudo` | מנעו סוכנים מהפעלת פקודות מערכת מעודכנות | `allowPatterns` |
| `block-rm-rf` | מנעו מחיקת קבצים רקורסיבית בשגגה | `allowPaths` |
| `block-curl-pipe-sh` | מנעו סוכנים מהובלת סקריפטים לא מהימנים לshell | |
| `block-failproofai-commands` | מנעו הסרה עצמית | |
| `sanitize-jwt` | עצרו דלפות JWT טוקנים להקשר סוכן | |
| `sanitize-api-keys` | עצרו דלפות API keys להקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצרו דלפות הנתונים של בסיס הנתונים להקשר סוכן | |
| `sanitize-private-key-content` | מחקו בלוקי PEM מפתח פרטי מהפלט | |
| `sanitize-bearer-tokens` | מחקו Bearer Token של Authorization מהפלט | |
| `block-env-files` | שמרו סוכנים מקריאת קבצי .env | |
| `protect-env-vars` | מנעו סוכנים מהדפסת משתנים סביבה | |
| `block-read-outside-cwd` | שמרו סוכנים בתוך גבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מנעו כתיבות לקבצי מפתח פרטי וקובצי אישור | `additionalPatterns` |
| `block-push-master` | מנעו דחפים בשגגה לmain/master | `protectedBranches` |
| `block-work-on-main` | שמרו סוכנים מענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנעו `git push --force` | |
| `warn-git-amend` | הזכירו סוכנים לפני תיקון commits | |
| `warn-git-stash-drop` | הזכירו סוכנים לפני ירידת stashes | |
| `warn-all-files-staged` | תפסו בשגגה `git add -A` | |
| `warn-destructive-sql` | תפסו DROP/DELETE SQL לפני הביצוע | |
| `warn-schema-alteration` | תפסו ALTER TABLE לפני הביצוע | |
| `warn-large-file-write` | תפסו כתיבות קבצים גדולות בצורה בלתי צפויה | `thresholdKb` |
| `warn-package-publish` | תפסו בשגגה `npm publish` | |
| `warn-background-process` | תפסו הפעלות תהליך רקע בלתי מכוונות | |
| `warn-global-package-install` | תפסו התקנות חבילה גלובליות בלתי מכוונות | |
| … ועוד | | |

פרטי מדיניות מלא והפניה לפרמטר: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניויות מותאמות אישית

כתבו את המדיניויות שלכם כדי להשאיר סוכנים אמינים וממוקדי משימה:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסמו כתיבות לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבות לנתיבי production חסומות");
    return allow();
  },
});
```

התקינו עם:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי החלטות

| פונקציה | השפעה |
|----------|--------|
| `allow()` | אפשרו את הפעולה |
| `allow(message)` | אפשרו ושלחו הקשר מידע ל-Claude |
| `deny(message)` | חסמו את הפעולה; ההודעה מוצגת ל-Claude |
| `instruct(message)` | הוסיפו הקשר להנמקת Claude; לא חוסמות |

### אובייקט הקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי שמקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | עומס ईvévénement גולמי מלא |
| `session.cwd` | `string` | ספריית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול של ההפעלה |

hook מותאמים תומכים ביבוא מקומי טרנזיטיבי, async/await, וגישה ל-`process.env`. שגיאות הן fail-open (logged ל-`~/.failproofai/hook.log`, מדיניויות מובנות ממשיכות). ראו [docs/custom-hooks.mdx](docs/custom-hooks.mdx) לעבור מלא.

### מדיניויות מבוססות קונוונציה

שימו `*policies.{js,mjs,ts}` קבצים ל-`.failproofai/policies/` והם נטענים באופן אוטומטי — ללא דגלים או שינויי תצורה. זרמו את הספרייה ל-git וכל חבר בצוות מקבל את אותם תקנים איכות באופן אוטומטי.

```text
# רמת הפרויקט — commited ל-git, משותף עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישי, חל על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי רמות נטענות (union). קבצים נטענים בסדר אלפביתי בתוך כל ספרייה. קדימו עם `01-`, `02-`, וכו' כדי לשלוט בסדר. כשהצוות שלך מגלה מצבי כישלון חדשים, הוסיפו מדיניות ודחפו — כולם מקבלים עדכון ב-pull הבא שלהם. ראו [examples/convention-policies/](examples/convention-policies/) לדוגמאות מוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריית שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. תוכן הפעלה, שמות קבצים, קלטי כלים, או מידע אישי לעולם לא נשלחים.

הסירו את זה:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 30 המדיניויות המובנות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתבו את המדיניויות שלכם |
| [Configuration](docs/configuration.mdx) | פורמט קובץ תצורה ומזג טווח |
| [Dashboard](docs/dashboard.mdx) | מעקב אחר הפעלות וסקירת פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | איך מערכת ה-hook פועלת |
| [Testing](docs/testing.mdx) | הפעלת בדיקות וכתיבת חדשות |

### הפעלת תיעוד באופן מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר Mintlify docs ב-`http://localhost:3000`. המכולה צופה בשינויים אם אתם מעגנים את ספריית התיעוד:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

`~/.claude/settings.json` של repo זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` במקום הפקודה הסטנדרטית `npx -y failproofai`. זה מכיוון שהפעלת `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצרת סכסוך התייחסות עצמית.

לכל repos אחרים, הגישה המומלצת היא `npx -y failproofai`, מותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראו [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראו [LICENSE](LICENSE).

---

בנוי ותחזוקה על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנחנו עוזרים לחברות וסטארטאפים לשפר את האמינות של סוכני AI שלהם דרך סוכנים, תוכנה, וכישוריות שלנו. למידע נוסף בקרו ב-[exosphere.host](https://exosphere.host).


</div>