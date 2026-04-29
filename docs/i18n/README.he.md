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

הדרך הקלה ביותר לנהל מדיניות שמשמרות את סוכני ה-AI שלך אמינים, ממוקדים והפועלים באופן עצמאי - עבור **Claude Code**, **OpenAI Codex**, **GitHub Copilot CLI** _(בטא)_ והמערך **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI בפעולה" width="800" />
</p>

## CLIs של סוכנים תומכים

<p align="center">
  <a href="https://claude.com/claude-code" title="Claude Code">
    <img src="assets/logos/claude.svg" alt="Claude Code" width="64" height="64" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://developers.openai.com/codex" title="OpenAI Codex">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/openai-dark.svg" />
      <img src="assets/logos/openai-light.svg" alt="OpenAI Codex" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks" title="GitHub Copilot CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/copilot-dark.svg" />
      <img src="assets/logos/copilot-light.svg" alt="GitHub Copilot" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>+ עוד בקרוב</strong>
</p>

> התקן hookים לאחד, שניים או שלושתם: `failproofai policies --install --cli copilot` (או `--cli claude codex copilot`). השמט את `--cli` לגילוי אוטומטי של CLIs מותקנים והודעה לאישור. **תמיכת GitHub Copilot CLI נמצאת בבטא.**

- **39 מדיניות מובנות** - תפס מצבי כשל נפוצים של סוכנים מחוץ לקופסה. חסום פקודות הרסניות, מנע דליפת סודות, שמור סוכנים בתוך גבולות פרויקט, גלה לולאות ועוד.
- **מדיניות מותאמת אישית** - כתוב את כללי האמינות שלך ב-JavaScript. השתמש ב-API `allow`/`deny`/`instruct` כדי לאכוף קונוונציות, למנוע סטייה, להגביל פעולות או להשתלב עם מערכות חיצוניות.
- **תצורה קלה** - כוונן כל מדיניות ללא כתיבת קוד. הגדר רשימות מאושרות, ענפים מוגנים, סף לפי פרויקט או בעולם. תצורה תלת-היקף מתמזגת באופן אוטומטי.
- **צג סוכן** - ראה מה סוכניך עשו בזמן שהיית בחוץ. עיין בהפעלות, בדוק כל קריאת כלי, וסקור בדיוק היכן מדיניות הופעלו.

הכל פועל מקומית - אף נתון לא משאיר את המכונה שלך.

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

## התחלה מהירה

### 1. הפעל מדיניות בעולם

```bash
failproofai policies --install
```

כותב ערכי hook לתוך `~/.claude/settings.json`. Claude Code יהפוך failproofai לפני ואחרי כל קריאת כלי.

### 2. הפעל את לוח הבקרה

```bash
failproofai
```

פותח `http://localhost:8020` - עיין בהפעלות, בדוק יומנים, נהל מדיניות.

### 3. בדוק מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### היקפים

| היקף | פקודה | איתם הוא כותב |
|-------|---------|-----------------|
| עולמי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקן מדיניות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסר מדיניות

```bash
failproofai policies --uninstall
# או לגבי היקף ספציפי:
failproofai policies --uninstall --scope project
```

---

## תצורה

תצורת המדיניות נמצאת ב-`~/.failproofai/policies-config.json` (עולמי) או `.failproofai/policies-config.json` בפרויקט שלך (לכל פרויקט).

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
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "מפתח API של MyCo" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**שלוש היקפי תצורה** מתמזגות באופן אוטומטי (פרויקט → מקומי → עולמי). ראה [docs/configuration.mdx](docs/configuration.mdx) לכללי מיזוג מלאים.

---

## מדיניות מובנות

| מדיניות | תיאור | ניתן להגדיר |
|--------|-------------|:---:|
| `block-sudo` | מנע מסוכנים הפעלת פקודות מערכת מיוחסות | `allowPatterns` |
| `block-rm-rf` | מנע מחיקת קבצים רקורסיבית בשוגג | `allowPaths` |
| `block-curl-pipe-sh` | מנע מסוכנים צנרור סקריפטים לא אמינים לשל | |
| `block-failproofai-commands` | מנע הסרה עצמית | |
| `sanitize-jwt` | עצור JWT tokens מלהדיף לתוך הקשר סוכן | |
| `sanitize-api-keys` | עצור API keys מלהדיף לתוך הקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצור credentials של בסיס נתונים מלהדיף לתוך הקשר סוכן | |
| `sanitize-private-key-content` | הסתר בלוקים של מפתח פרטי PEM מהפלט | |
| `sanitize-bearer-tokens` | הסתר Bearer tokens של Authorization מהפלט | |
| `block-env-files` | שמור סוכנים מקריאת קובצי .env | |
| `protect-env-vars` | מנע מסוכנים הדפסת משתני סביבה | |
| `block-read-outside-cwd` | שמור סוכנים בתוך גבולות פרויקט | `allowPaths` |
| `block-secrets-write` | מנע כתיבות לקבצי מפתח פרטי ותעודות | `additionalPatterns` |
| `block-push-master` | מנע דחיפות בשוגג לעיקר/master | `protectedBranches` |
| `block-work-on-main` | שמור סוכנים מעל ענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנע `git push --force` | |
| `warn-git-amend` | הזכר סוכנים לפני שינוי commits | |
| `warn-git-stash-drop` | הזכר סוכנים לפני הורדת stashes | |
| `warn-all-files-staged` | תפס `git add -A` בשוגג | |
| `warn-destructive-sql` | תפס DROP/DELETE SQL לפני ביצוע | |
| `warn-schema-alteration` | תפס ALTER TABLE לפני ביצוע | |
| `warn-large-file-write` | תפס כתיבות קובץ גדולות באופן בלתי צפוי | `thresholdKb` |
| `warn-package-publish` | תפס `npm publish` בשוגג | |
| `warn-background-process` | תפס הפעלות תהליך בתוך כדור בלא כוונה | |
| `warn-global-package-install` | תפס התקנות חבילה גלובליות בלא כוונה | |
| …ועוד | | |

פרטי מדיניות מלאים והפניה של פרמטרים: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניות מותאמת אישית

כתוב את המדיניות שלך כדי לשמור סוכנים אמינים וממוקדים:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסום כתיבות לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבות לנתיבים production חסומות");
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
| `allow()` | אישור הפעולה |
| `allow(message)` | אישור והשלח הקשר מידע ל-Claude |
| `deny(message)` | חסום את הפעולה; הודעה מוצגת ל-Claude |
| `instruct(message)` | הוסף הקשר לפרומפט של Claude; אל תחסום |

### אובייקט הקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי שמקראים (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של כלי |
| `payload` | `object` | מטען אירוע גולמי מלא |
| `session.cwd` | `string` | ספרית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול של הפעלה |

hookים מותאמים אישית תומכים בייבואים מקומיים טרנזיטיביים, async/await, וגישה ל-`process.env`. שגיאות פועלות בפתיחה בכשל (רשומות ב-`~/.failproofai/hook.log`, מדיניות מובנות ממשיכות). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) למדריך מלא.

### מדיניות מבוססות קונוונציה

הוסף קבצי `*policies.{js,mjs,ts}` לתוך `.failproofai/policies/` והם טוענים באופן אוטומטי — אף דגלים או שינויי תצורה לא נדרשים. בצע commit של הספרייה ל-git וכל חברי הצוות מקבלים את אותם סטנדרטים איכות באופן אוטומטי.

```text
# רמת פרויקט — committed ל-git, משותף עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישי, חל על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי הרמות טוענות (union). קבצים טוענים בסדר אלפביתי בתוך כל ספרייה. הוסף קידומת עם `01-`, `02-`, וכו' כדי לשלוט בסדר. כאשר הצוות שלך מגלה מצבי כשל חדשים, הוסף מדיניות ודחוף — כולם מקבלים את העדכון ב-pull הבא שלהם. ראה [examples/convention-policies/](examples/convention-policies/) לדוגמאות מוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. תוכן הפעלה, שמות קבצים, קלטי כלים או מידע אישי לעולם לא נשלחים.

השבת זאת:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה ורגעים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 39 מדיניות מובנות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתוב את המדיניות שלך |
| [Configuration](docs/configuration.mdx) | פורמט קובץ תצורה ומיזוג היקף |
| [Dashboard](docs/dashboard.mdx) | עקוב אחר הפעלות וסקור פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | כיצד מערכת hook פועלת |
| [Testing](docs/testing.mdx) | הרץ בדיקות וכתוב חדשות |

### הרץ תיעוד מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר Mintlify docs ב-`http://localhost:3000`. המיכל עוקב אחר שינויים אם אתה מעגן את ספרית ה-docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

ה-`.claude/settings.json` של repot זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` במקום הפקודה `npx -y failproofai` הסטנדרטית. זה בגלל שהרצה של `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצרת קונפליקט הסתמכות עצמית.

עבור כל ה-repos האחרים, הגישה המומלצת היא `npx -y failproofai`, המותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).

---

בנוי ותוחזק על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנחנו עוזרים לחברות ולסטארטאפים לשפר את אמינות סוכני ה-AI שלהם דרך הסוכנים, התוכנה והמומחיות שלנו. למד עוד ב-[exosphere.host](https://exosphere.host).


</div>