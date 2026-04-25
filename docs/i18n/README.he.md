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

הדרך הקלה ביותר לנהל מדיניויות שמשמרות את סוכנים ה-AI שלך אמינים, ממוקדים ופועלים בצורה עצמאית - עבור **Claude Code** וה-**Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI בפעולה" width="800" />
</p>

- **30 מדיניויות מובנות** - תפוס מצבי כשל נפוצים של סוכנים מידית. חסום פקודות הרסניות, מנע דליפת סודות, שמור סוכנים בתוך גבולות הפרויקט, גלה לולאות ועוד.
- **מדיניויות מותאמות** - כתוב את כללי האמינות שלך ב-JavaScript. השתמש ב-API של `allow`/`deny`/`instruct` כדי אכוף מוסכמות, מנע סטיות, שער פעולות או התכנס עם מערכות חיצוניות.
- **קונפיגורציה קלה** - כיוונון כל מדיניות ללא כתיבת קוד. הגדר רשימות הרשאות, ענפים מוגנים, סף לכל פרויקט או בעולם. שלוש טווחי קונפיגורציה מתמזגים באופן אוטומטי.
- **מוניטור סוכן** - ראה מה עשו הסוכנים שלך בזמן שלא היית. עיין בהפעלות, בדוק כל קריאת כלי, וסקור בדיוק היכן מדיניויות הופעלו.

הכל רץ באופן מקומי - שום נתון לא עוזב את המכונה שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה מקוד מקור)

---

## התקנה

```bash
npm install -g failproofai
# או
bun add -g failproofai
```

---

## התחלה מהירה

### 1. הפוך מדיניויות לזמינות בעולם

```bash
failproofai policies --install
```

כותב רשומות hook ל-`~/.claude/settings.json`. Claude Code כעת יקרא ל-failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעל את לוח הבקרה

```bash
failproofai
```

פותח את `http://localhost:8020` - עיין בהפעלות, בדוק יומנים, נהל מדיניויות.

### 3. בדוק מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### טווחים

| טווח | פקודה | איפה זה כותב |
|-------|---------|-----------------|
| עולמי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקן מדיניויות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסר מדיניויות

```bash
failproofai policies --uninstall
# או לטווח ספציפי:
failproofai policies --uninstall --scope project
```

---

## קונפיגורציה

קונפיגורציית מדיניות חיה ב-`~/.failproofai/policies-config.json` (עולמי) או `.failproofai/policies-config.json` בפרויקט שלך (לפי פרויקט).

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
      "hint": "נסה ליצור ענף חדש."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "מפתח API של MyCo" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**שלוש טווחי קונפיגורציה** מתמזגים באופן אוטומטי (פרויקט → מקומי → עולמי). ראה [docs/configuration.mdx](docs/configuration.mdx) לקבלת כללי מיזוג מלאים.

---

## מדיניויות מובנות

| מדיניות | תיאור | ניתן להגדיר |
|--------|-------------|:---:|
| `block-sudo` | מנע סוכנים מהרצת פקודות מערכת עם הרשאות | `allowPatterns` |
| `block-rm-rf` | מנע מחיקת קבצים רקורסיבית בשגגה | `allowPaths` |
| `block-curl-pipe-sh` | מנע סוכנים מהעברת סקריפטים לא מהימנים לשל | |
| `block-failproofai-commands` | מנע הסרה עצמית | |
| `sanitize-jwt` | עצור דלף של אסימוני JWT להקשר סוכן | |
| `sanitize-api-keys` | עצור דלף של מפתחות API להקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצור דלף של פרטי זיהוי בסיס נתונים להקשר סוכן | |
| `sanitize-private-key-content` | כסה בלוקים של מפתח פרטי PEM מפלט | |
| `sanitize-bearer-tokens` | כסה אסימוני Authorization Bearer מפלט | |
| `block-env-files` | שמור סוכנים מקריאת קבצי .env | |
| `protect-env-vars` | מנע סוכנים מהדפסת משתני סביבה | |
| `block-read-outside-cwd` | שמור סוכנים בתוך גבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מנע כתיבה לקבצי מפתח פרטי ותעודות | `additionalPatterns` |
| `block-push-master` | מנע push בשגגה ל-main/master | `protectedBranches` |
| `block-work-on-main` | שמור סוכנים מענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנע `git push --force` | |
| `warn-git-amend` | הזכר סוכנים לפני תיקון ההתחייבויות | |
| `warn-git-stash-drop` | הזכר סוכנים לפני ירידת stashes | |
| `warn-all-files-staged` | תפוס `git add -A` בשגגה | |
| `warn-destructive-sql` | תפוס DROP/DELETE SQL לפני ביצוע | |
| `warn-schema-alteration` | תפוס ALTER TABLE לפני ביצוע | |
| `warn-large-file-write` | תפוס כתיבת קבצים גדולים בחוזקה | `thresholdKb` |
| `warn-package-publish` | תפוס `npm publish` בשגגה | |
| `warn-background-process` | תפוס השקות תהליך רקע לא מכוונות | |
| `warn-global-package-install` | תפוס התקנות חבילה גלובליות לא מכוונות | |
| …ועוד | | |

פרטים מלאים של מדיניות ותיאור פרמטרים: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניויות מותאמות

כתוב את המדיניויות שלך כדי להשמר סוכנים אמינים וממוקדים:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסום כתיבה לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבה לנתיבי production מחסומה");
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
| `allow(message)` | אפשר והשלח הקשר מידעון ל-Claude |
| `deny(message)` | חסום את הפעולה; ההודעה מוצגת ל-Claude |
| `instruct(message)` | הוסף הקשר להנחיית ההנחיה של Claude; לא חוסם |

### אובייקט ההקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי שנקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | מטען אירוע גולמי מלא |
| `session.cwd` | `string` | ספריית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול הפעלה |

hook מותאם תומך בייבואים מקומיים טרנזיטיביים, async/await וגישה ל-`process.env`. שגיאות הן fail-open (רשומות ל-`~/.failproofai/hook.log`, מדיניויות מובנות ממשיכות). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) לקבלת המדריך המלא.

### מדיניויות מבוססות מוסכמה

הפל קבצי `*policies.{js,mjs,ts}` ל-`.failproofai/policies/` והם נטענים באופן אוטומטי — ללא דגלים או שינויי קונפיגורציה. בצע commit לספריה ל-git וכל חבר בצוות מקבל את אותם תקני איכות באופן אוטומטי.

```text
# רמת פרויקט — מתוחזק ב-git, משותף עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישי, חל על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי רמות נטענות (union). קבצים נטענים בסדר אלפביתי בתוך כל ספריה. קדם עם `01-`, `02-`, וכן הלאה כדי לשלוט בסדר. כשהצוות שלך מגלה מצבי כשל חדשים, הוסף מדיניות ו-push — כולם מקבלים את העדכון ב-pull הבא שלהם. ראה [examples/convention-policies/](examples/convention-policies/) לדוגמאות מוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש תכונה. אין תוכן הפעלה, שמות קבצים, קלטי כלי או מידע אישי שנשלח אי פעם.

השבית זאת:

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
| [Configuration](docs/configuration.mdx) | פורמט קובץ קונפיגורציה ומיזוג טווח |
| [Dashboard](docs/dashboard.mdx) | מוניטור הפעלות וסקור פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | כיצד מערכת ה-hook עובדת |
| [Testing](docs/testing.mdx) | הרץ בדיקות וכתוב חדשות |

### הרץ תיעוד מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר התיעוד של Mintlify ב-`http://localhost:3000`. המיכל צופה בשינויים אם אתה עוגן את ספריית התיעוד:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

ה-`.claude/settings.json` של repo זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` במקום הפקודה הסטנדרטית `npx -y failproofai`. הסיבה לכך היא שהרץ של `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצר סכסוך עצמי.

לכל repos אחרים, הגישה המומלצת היא `npx -y failproofai`, מותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).

---

בנוי ותחזוק על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנחנו עוזרים לארגונים ולעלומים לשפר את האמינות של סוכני ה-AI שלהם דרך הסוכנים, התוכנה והמומחיות שלנו. למד עוד ב-[exosphere.host](https://exosphere.host).


</div>