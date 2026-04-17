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

הדרך הקלה ביותר לנהל מדיניויות המשמרות את סוכני ה-AI שלך אמינים, ממוקדים ופועלים בעצמאות - עבור **Claude Code** ו-**Agents SDK**.

- **30 מדיניויות מובנות** - תפסו מצבי כשל נפוצים של סוכנים מחוץ לתיבה. חסמו פקודות הרסניות, מנעו דליפות סודות, שמרו סוכנים בתוך גבולות פרויקט, גלו לולאות ועוד.
- **מדיניויות מותאמות** - כתבו את כללי האמינות שלכם ב-JavaScript. השתמשו ב-API של `allow`/`deny`/`instruct` כדי לאכוף קונוונציות, למנוע סטייה, לשער פעולות, או להשתלב עם מערכות חיצוניות.
- **קונפיגורציה קלה** - כייל כל מדיניות ללא כתיבת קוד. הגדר רשימות הקצאה, ענפים מוגנים, סף לכל פרויקט או ברמת עולם. שלוש טווחי קונפיגורציה מתמזגים באופן אוטומטי.
- **Agent Monitor** - ראה מה עשו הסוכנים שלך בזמן שהיית רחוק. עיין בהפעלות, בדוק כל קריאת כלי, וסקור בדיוק היכן עברו מדיניויות.

הכל פועל באופן מקומי - לא נתונים לא עוזבים את המכונה שלך.

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

### 1. הפעל מדיניויות ברחבי העולם

```bash
failproofai policies --install
```

כותב ערכי hook ל-`~/.claude/settings.json`. Claude Code יזמן כעת את failproofai לפני ואחרי כל קריאת כלי.

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

| טווח | פקודה | היכן הוא כותב |
|-------|---------|-----------------|
| ברחבי העולם (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
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

## קונפיגורציה

קונפיגורציית מדיניות חיה ב-`~/.failproofai/policies-config.json` (ברחבי העולם) או `.failproofai/policies-config.json` בפרויקט שלך (לכל פרויקט).

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
      "hint": "נסה ליצור ענף טרי במקום."
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

**שלוש טווחי קונפיגורציה** מתמזגים באופן אוטומטי (project → local → global). ראה [docs/configuration.mdx](docs/configuration.mdx) לכללי מיזוג מלאים.

---

## מדיניויות מובנות

| מדיניות | תיאור | ניתן להגדרה |
|--------|-------------|:---:|
| `block-sudo` | מנע מסוכנים להריץ פקודות מערכת בעלות הרשאה | `allowPatterns` |
| `block-rm-rf` | מנע מחיקת קבצים רקורסיבית בתאונה | `allowPaths` |
| `block-curl-pipe-sh` | מנע מסוכנים מצינור סקריפטים לא-מהימנים ל-shell | |
| `block-failproofai-commands` | מנע הסרה עצמית | |
| `sanitize-jwt` | עצור דלפות JWT tokenים להקשר סוכן | |
| `sanitize-api-keys` | עצור דלפות API keys להקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצור דלפות credentials מסד נתונים להקשר סוכן | |
| `sanitize-private-key-content` | הסתר בלוקי PEM private key מהפלט | |
| `sanitize-bearer-tokens` | הסתר Authorization Bearer tokens מהפלט | |
| `block-env-files` | מנע מסוכנים לקרוא קבצי .env | |
| `protect-env-vars` | מנע מסוכנים להדפיס משתנים סביבה | |
| `block-read-outside-cwd` | שמור על סוכנים בתוך גבולות פרויקט | `allowPaths` |
| `block-secrets-write` | מנע כתיבה לקבצי private key ותעודות | `additionalPatterns` |
| `block-push-master` | מנע דחפים בתאונה ל-main/master | `protectedBranches` |
| `block-work-on-main` | שמור על סוכנים בחוץ מענפים מוגנים | `protectedBranches` |
| `block-force-push` | מנע `git push --force` | |
| `warn-git-amend` | הזכר לסוכנים לפני שינוי commits | |
| `warn-git-stash-drop` | הזכר לסוכנים לפני drop של stashes | |
| `warn-all-files-staged` | תפס בתאונה `git add -A` | |
| `warn-destructive-sql` | תפס DROP/DELETE SQL לפני הביצוע | |
| `warn-schema-alteration` | תפס ALTER TABLE לפני הביצוע | |
| `warn-large-file-write` | תפס כתיבות קבצים גדולות בצורה בלתי צפויה | `thresholdKb` |
| `warn-package-publish` | תפס בתאונה `npm publish` | |
| `warn-background-process` | תפס הפעלות תהליך בתהליך לא מכוונות | |
| `warn-global-package-install` | תפס התקנות חבילות גלובליות לא מכוונות | |
| …ועוד | | |

פרטי מדיניות מלאים והפניה לפרמטרים: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניויות מותאמות

כתוב את המדיניויות שלך כדי לשמור על סוכנים אמינים וממוקדים:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסום כתיבות לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבות לנתיבי production חסומות");
    return allow();
  },
});
```

התקן עם:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי החלטות

| פונקציה | השפעה |
|----------|--------|
| `allow()` | אפשר את הפעולה |
| `allow(message)` | אפשר וקבל הקשר מידע ל-Claude |
| `deny(message)` | חסום את הפעולה; ההודעה מוצגת ל-Claude |
| `instruct(message)` | הוסף הקשר להנחיית Claude; לא חוסם |

### אובייקט ההקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי הנקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | payload אירוע גולמי מלא |
| `session.cwd` | `string` | ספריית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול ההפעלה |

custom hooks תומכים בייבוא מקומי טרנזיטיבי, async/await, וגישה ל-`process.env`. שגיאות הן fail-open (רשומות ל-`~/.failproofai/hook.log`, מדיניויות מובנות ממשיכות). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) להנחיית המלא.

### מדיניויות מבוססות קונוונציה

זרוק קבצי `*policies.{js,mjs,ts}` ל-`.failproofai/policies/` והם יטענו באופן אוטומטי — אין צורך בדגל `--custom` או שינויי קונפיגורציה. פועל כמו git hooks: זרוק קובץ, זה פשוט עובד.

```text
# רמת פרויקט — מחויבת ל-git, משותפת עם הצוות
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישית, חלה על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי הרמות טוענות (union). קבצים טענים בסדר אלפביתי בתוך כל ספרייה. קדימה עם `01-`, `02-`, וכו' כדי לשלוט בסדר. ראה [examples/convention-policies/](examples/convention-policies/) לדוגמאות מוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. לא מופעלת תוכן הפעלה, שמות קבצים, קלטי כלי, או מידע אישי לעולם נשלחים.

השבית:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| הנחיה | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 30 מדיניויות מובנות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתוב את המדיניויות שלך |
| [Configuration](docs/configuration.mdx) | פורמט קובץ קונפיגורציה ויזוג טווח |
| [Dashboard](docs/dashboard.mdx) | מונית הפעלות וסקור פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | איך מערכת ה-hook עובדת |
| [Testing](docs/testing.mdx) | הרצת בדיקות וכתיבת חדשות |

### הפעל תיעוד באופן מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר Mintlify docs ב-`http://localhost:3000`. הקונטיינר צופה בשינויים אם תעגן את ספריית ה-docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה למתרמים failproofai

ה-`.claude/settings.json` של repo זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` במקום בפקודה `npx -y failproofai` הסטנדרטית. זה בגלל שהרצת `npx -y failproofai` בפנים פרויקט failproofai עצמו יוצרת קונפליקט עצמי-הפנה.

עבור כל repos אחרים, הגישה המומלצת היא `npx -y failproofai`, המותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).

---

בנוי וניהול על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנו עוזרים לארגונים וסטארטאפים לשפר את אמינות סוכני ה-AI שלהם דרך הסוכנים, התוכנה, והמומחיות שלנו. למידע נוסף בקרו ב-[exosphere.host](https://exosphere.host).


</div>