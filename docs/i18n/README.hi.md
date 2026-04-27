> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | **🇮🇳 हिन्दी** | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

---

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

**अनुवाद**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

आपके AI एजेंट्स को विश्वसनीय, लक्ष्य-केंद्रित और स्वायत्त रूप से चलाने के लिए नीतियों को प्रबंधित करने का सबसे आसान तरीका - **Claude Code** और **Agents SDK** के लिए।

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **32 बिल्ट-इन पॉलिसीज़** - सामान्य एजेंट विफलता मोड्स को तुरंत पकड़ें। विनाशकारी कमांड ब्लॉक करें, गोपनीय सूचना रिसाव रोकें, एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें, लूप्स पहचानें, और बहुत कुछ।
- **कस्टम पॉलिसीज़** - JavaScript में अपने स्वयं की विश्वसनीयता नियम लिखें। `allow`/`deny`/`instruct` API का उपयोग करके कन्वेंशन लागू करें, विचलन रोकें, ऑपरेशन गेट करें, या बाहरी सिस्टम के साथ एकीकृत करें।
- **आसान कॉन्फ़िगरेशन** - कोड लिखे बिना किसी भी नीति को ट्यून करें। allowlists, संरक्षित शाखाएं, प्रति-प्रोजेक्ट या विश्व स्तर पर थ्रेशहोल्ड सेट करें। तीन-स्कोप कॉन्फ़िग स्वचालित रूप से मर्ज होते हैं।
- **एजेंट मॉनिटर** - देखें कि जब आप दूर थे तो आपके एजेंट्स ने क्या किया। सत्रों को ब्राउज़ करें, हर टूल कॉल का निरीक्षण करें, और देखें कि नीतियां कहां सक्रिय हुईं।

सब कुछ स्थानीय रूप से चलता है - कोई डेटा आपकी मशीन से बाहर नहीं जाता।

---

## आवश्यकताएं

- Node.js >= 20.9.0
- Bun >= 1.3.0 (वैकल्पिक - केवल विकास / स्रोत से बनाने के लिए आवश्यक)

---

## इंस्टॉल करें

```bash
npm install -g failproofai
# या
bun add -g failproofai
```

---

## त्वरित प्रारंभ

### 1. पॉलिसीज़ को विश्व स्तर पर सक्षम करें

```bash
failproofai policies --install
```

`~/.claude/settings.json` में हुक प्रविष्टियां लिखता है। Claude Code अब प्रत्येक टूल कॉल से पहले और बाद में failproofai को आमंत्रित करेगा।

### 2. डैशबोर्ड लॉन्च करें

```bash
failproofai
```

`http://localhost:8020` खोलता है - सत्रों को ब्राउज़ करें, लॉग का निरीक्षण करें, नीतियां प्रबंधित करें।

### 3. जांचें कि क्या सक्रिय है

```bash
failproofai policies
```

---

## पॉलिसी इंस्टॉलेशन

### स्कोप्स

| स्कोप | कमांड | जहां यह लिखता है |
|-------|---------|-----------------|
| विश्व स्तर (डिफ़ॉल्ट) | `failproofai policies --install` | `~/.claude/settings.json` |
| प्रोजेक्ट | `failproofai policies --install --scope project` | `.claude/settings.json` |
| स्थानीय | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### विशिष्ट नीतियां इंस्टॉल करें

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### नीतियां हटाएं

```bash
failproofai policies --uninstall
# या किसी विशिष्ट स्कोप के लिए:
failproofai policies --uninstall --scope project
```

---

## कॉन्फ़िगरेशन

पॉलिसी कॉन्फ़िगरेशन `~/.failproofai/policies-config.json` (विश्व स्तर) या आपके प्रोजेक्ट में `.failproofai/policies-config.json` (प्रति-प्रोजेक्ट) में रहता है।

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
      "hint": "बिना sudo के सीधे apt-get का उपयोग करें।"
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "इसके बजाय एक नई शाखा बनाने का प्रयास करें।"
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

**तीन कॉन्फ़िग स्कोप्स** स्वचालित रूप से मर्ज होते हैं (प्रोजेक्ट → स्थानीय → विश्व स्तर)। पूर्ण मर्ज नियमों के लिए [docs/configuration.mdx](docs/configuration.mdx) देखें।

---

## बिल्ट-इन पॉलिसीज़

| नीति | विवरण | कॉन्फ़िगर योग्य |
|--------|-------------|:---:|
| `block-sudo` | एजेंट्स को विशेषाधिकार प्राप्त सिस्टम कमांड चलाने से रोकें | `allowPatterns` |
| `block-rm-rf` | आकस्मिक पुनरावर्ती फ़ाइल हटाने से रोकें | `allowPaths` |
| `block-curl-pipe-sh` | एजेंट्स को अविश्वसनीय स्क्रिप्ट को शेल में पाइप करने से रोकें | |
| `block-failproofai-commands` | स्व-अनइंस्टॉलेशन रोकें | |
| `sanitize-jwt` | JWT टोकन को एजेंट संदर्भ में रिसाव से रोकें | |
| `sanitize-api-keys` | API कुंजियों को एजेंट संदर्भ में रिसाव से रोकें | `additionalPatterns` |
| `sanitize-connection-strings` | डेटाबेस क्रेडेंशियल को एजेंट संदर्भ में रिसाव से रोकें | |
| `sanitize-private-key-content` | आउटपुट से PEM निजी कुंजी ब्लॉक संपादित करें | |
| `sanitize-bearer-tokens` | आउटपुट से प्राधिकरण Bearer टोकन संपादित करें | |
| `block-env-files` | एजेंट्स को .env फ़ाइलें पढ़ने से रोकें | |
| `protect-env-vars` | एजेंट्स को पर्यावरण चर प्रिंट करने से रोकें | |
| `block-read-outside-cwd` | एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें | `allowPaths` |
| `block-secrets-write` | निजी कुंजी और प्रमाणपत्र फ़ाइलों में लेखन से रोकें | `additionalPatterns` |
| `block-push-master` | मुख्य/मास्टर में आकस्मिक पुश से रोकें | `protectedBranches` |
| `block-work-on-main` | एजेंट्स को संरक्षित शाखाओं से दूर रखें | `protectedBranches` |
| `block-force-push` | `git push --force` से रोकें | |
| `warn-git-amend` | कमिट संशोधित करने से पहले एजेंट्स को याद दिलाएं | |
| `warn-git-stash-drop` | स्टैश को हटाने से पहले एजेंट्स को याद दिलाएं | |
| `warn-all-files-staged` | आकस्मिक `git add -A` पकड़ें | |
| `warn-destructive-sql` | निष्पादन से पहले DROP/DELETE SQL पकड़ें | |
| `warn-schema-alteration` | निष्पादन से पहले ALTER TABLE पकड़ें | |
| `warn-large-file-write` | अप्रत्याशित रूप से बड़ी फ़ाइल लेखन पकड़ें | `thresholdKb` |
| `warn-package-publish` | आकस्मिक `npm publish` पकड़ें | |
| `warn-background-process` | अनपेक्षित पृष्ठभूमि प्रक्रिया लॉन्च पकड़ें | |
| `warn-global-package-install` | अनपेक्षित विश्व स्तर पर पैकेज इंस्टॉल पकड़ें | |
| …और अधिक | | |

पूर्ण नीति विवरण और पैरामीटर संदर्भ: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## कस्टम पॉलिसीज़

एजेंट्स को विश्वसनीय और लक्ष्य-केंद्रित रखने के लिए अपनी स्वयं की नीतियां लिखें:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "'production' युक्त पथों में लेखन को ब्लॉक करें",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("उत्पादन पथों में लेखन ब्लॉक किया गया है");
    return allow();
  },
});
```

इसके साथ इंस्टॉल करें:

```bash
failproofai policies --install --custom ./my-policies.js
```

### निर्णय हेल्पर्स

| फंक्शन | प्रभाव |
|----------|--------|
| `allow()` | ऑपरेशन की अनुमति दें |
| `allow(message)` | अनुमति दें और Claude को सूचनात्मक संदर्भ भेजें |
| `deny(message)` | ऑपरेशन ब्लॉक करें; संदेश Claude को दिखाया जाता है |
| `instruct(message)` | Claude के प्रॉम्प्ट में संदर्भ जोड़ें; ब्लॉक नहीं करता |

### संदर्भ ऑब्जेक्ट (`ctx`)

| फील्ड | प्रकार | विवरण |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | बुलाया जा रहा टूल (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | टूल के इनपुट पैरामीटर |
| `payload` | `object` | पूर्ण raw इवेंट पेलोड |
| `session.cwd` | `string` | Claude Code सत्र की कार्यशील निर्देशिका |
| `session.sessionId` | `string` | सत्र पहचानकर्ता |
| `session.transcriptPath` | `string` | सत्र प्रतिलिपि फ़ाइल का पथ |

कस्टम हुक्स पारगमन स्थानीय आयात, async/await, और `process.env` तक पहुंच का समर्थन करते हैं। त्रुटियां fail-open हैं (लॉग किए गए `~/.failproofai/hook.log` में, बिल्ट-इन नीतियां जारी रहती हैं)। संपूर्ण गाइड के लिए [docs/custom-hooks.mdx](docs/custom-hooks.mdx) देखें।

### कन्वेंशन-आधारित पॉलिसीज़

`*policies.{js,mjs,ts}` फ़ाइलें `.failproofai/policies/` में ड्रॉप करें और वे स्वचालित रूप से लोड होती हैं - कोई फ्लैग या कॉन्फ़िग परिवर्तन की आवश्यकता नहीं। निर्देशिका को git में कमिट करें और प्रत्येक टीम सदस्य को स्वचालित रूप से समान गुणवत्ता मानदंड मिलते हैं।

```text
# प्रोजेक्ट स्तर — git में कमिट किया गया, टीम के साथ साझा किया गया
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# उपयोगकर्ता स्तर — व्यक्तिगत, सभी प्रोजेक्ट्स पर लागू होता है
~/.failproofai/policies/my-policies.mjs
```

दोनों स्तर लोड होते हैं (union)। फ़ाइलें प्रत्येक निर्देशिका के भीतर वर्णमाला में लोड होती हैं। क्रम को नियंत्रित करने के लिए `01-`, `02-`, आदि के साथ उपसर्ग करें। जैसे ही आपकी टीम नए विफलता मोड्स की खोज करती है, एक नीति जोड़ें और पुश करें — सभी को अपने अगले pull पर अपडेट मिलता है। तत्पर उपयोग के लिए तैयार उदाहरणों के लिए [examples/convention-policies/](examples/convention-policies/) देखें।

---

## टेलीमेट्री

Failproof AI, PostHog के माध्यम से गुमनाम उपयोग टेलीमेट्री एकत्र करता है ताकि फीचर उपयोग को समझा जा सके। कोई सत्र सामग्री, फ़ाइल नाम, टूल इनपुट, या व्यक्तिगत जानकारी कभी नहीं भेजी जाती।

इसे अक्षम करें:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## दस्तावेज़

| गाइड | विवरण |
|-------|-------------|
| [प्रारंभ करना](docs/getting-started.mdx) | इंस्टॉलेशन और पहले कदम |
| [बिल्ट-इन पॉलिसीज़](docs/built-in-policies.mdx) | सभी 32 बिल्ट-इन नीतियां पैरामीटर के साथ |
| [कस्टम पॉलिसीज़](docs/custom-policies.mdx) | अपनी स्वयं की नीतियां लिखें |
| [कॉन्फ़िगरेशन](docs/configuration.mdx) | कॉन्फ़िग फ़ाइल प्रारूप और स्कोप मर्जिंग |
| [डैशबोर्ड](docs/dashboard.mdx) | सत्रों को मॉनिटर करें और नीति गतिविधि की समीक्षा करें |
| [आर्किटेक्चर](docs/architecture.mdx) | हुक सिस्टम कैसे काम करता है |
| [परीक्षण](docs/testing.mdx) | परीक्षण चलाएं और नई परीक्षाएं लिखें |

### डॉक्स को स्थानीय रूप से चलाएं

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` पर Mintlify डॉक्स साइट खोलता है। कंटेनर यदि आप डॉक्स निर्देशिका को माउंट करते हैं तो परिवर्तनों को देखता है:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai योगदानकर्ताओं के लिए नोट

इस रिपो का `.claude/settings.json` मानक `npx -y failproofai` कमांड के बजाय `bun ./bin/failproofai.mjs --hook <EventType>` का उपयोग करता है। ऐसा इसलिए है क्योंकि failproofai प्रोजेक्ट के अंदर `npx -y failproofai` चलाने से स्व-संदर्भ संघर्ष बनता है।

अन्य सभी रिपोज़ के लिए, अनुशंसित दृष्टिकोण है `npx -y failproofai`, जिसे इसके माध्यम से इंस्टॉल किया जाता है:

```bash
failproofai policies --install --scope project
```

## योगदान

[CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## लाइसेंस

[LICENSE](LICENSE) देखें।

---

**ExosphereHost द्वारा निर्मित और रखरखाव: आपके एजेंट्स के लिए विश्वसनीयता अनुसंधान प्रयोगशाला**। हम एंटरप्राइज और स्टार्टअप को अपने स्वयं के एजेंट्स, सॉफ़्टवेयर और विशेषज्ञता के माध्यम से अपने AI एजेंट्स की विश्वसनीयता में सुधार करने में सहायता करते हैं। [exosphere.host](https://exosphere.host) पर अधिक जानें।
