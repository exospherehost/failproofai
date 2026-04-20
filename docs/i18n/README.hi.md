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

आपके AI एजेंटों को विश्वसनीय, कार्य-केंद्रित और स्वायत्तता से चलाने के लिए पॉलिसी प्रबंधित करने का सबसे आसान तरीका - **Claude Code** और **Agents SDK** के लिए।

- **30 बिल्ट-इन पॉलिसीज** - आउट-ऑफ-द-बॉक्स सामान्य एजेंट विफलता मोड को पकड़ें। विनाशकारी कमांड को ब्लॉक करें, गुप्त लीकेज को रोकें, एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें, लूप का पता लगाएं, और बहुत कुछ।
- **कस्टम पॉलिसीज** - JavaScript में अपने स्वयं की विश्वसनीयता नियम लिखें। सम्मेलनों को लागू करने, ड्रिफ्ट को रोकने, संचालन को गेट करने या बाहरी सिस्टम के साथ एकीकृत करने के लिए `allow`/`deny`/`instruct` API का उपयोग करें।
- **आसान कॉन्फ़िगरेशन** - कोड लिखे बिना किसी भी पॉलिसी को ट्यून करें। अनुमति सूची, सुरक्षित शाखाएं, प्रति-प्रोजेक्ट या विश्व स्तर पर थ्रेसहोल्ड सेट करें। तीन-स्कोप कॉन्फ़िग स्वचालित रूप से मर्ज होते हैं।
- **एजेंट मॉनिटर** - देखें कि आपके एजेंट्स आपके दूर रहते हुए क्या करते थे। सेशन ब्राउज़ करें, प्रत्येक टूल कॉल का निरीक्षण करें, और देखें कि पॉलिसीज कहाँ सक्रिय हुई।

सब कुछ स्थानीय रूप से चलता है - आपकी मशीन से कोई डेटा नहीं छोड़ता है।

---

## आवश्यकताएं

- Node.js >= 20.9.0
- Bun >= 1.3.0 (वैकल्पिक - केवल विकास / स्रोत से बिल्ड करने के लिए आवश्यक)

---

## इंस्टॉल करें

```bash
npm install -g failproofai
# या
bun add -g failproofai
```

---

## त्वरित शुरुआत

### 1. पॉलिसीज को विश्व स्तर पर सक्षम करें

```bash
failproofai policies --install
```

`~/.claude/settings.json` में हुक एंट्रीज लिखता है। Claude Code अब प्रत्येक टूल कॉल से पहले और बाद में failproofai को आमंत्रित करेगा।

### 2. डैशबोर्ड लॉन्च करें

```bash
failproofai
```

`http://localhost:8020` खोलता है - सेशन ब्राउज़ करें, लॉग का निरीक्षण करें, पॉलिसीज प्रबंधित करें।

### 3. जाँचें कि क्या सक्रिय है

```bash
failproofai policies
```

---

## पॉलिसी इंस्टॉलेशन

### स्कोप्स

| स्कोप | कमांड | कहाँ लिखता है |
|-------|---------|-----------------|
| विश्व (डिफ़ॉल्ट) | `failproofai policies --install` | `~/.claude/settings.json` |
| प्रोजेक्ट | `failproofai policies --install --scope project` | `.claude/settings.json` |
| स्थानीय | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### विशिष्ट पॉलिसीज इंस्टॉल करें

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### पॉलिसीज हटाएं

```bash
failproofai policies --uninstall
# या किसी विशेष स्कोप के लिए:
failproofai policies --uninstall --scope project
```

---

## कॉन्फ़िगरेशन

पॉलिसी कॉन्फ़िगरेशन `~/.failproofai/policies-config.json` (विश्व) या आपके प्रोजेक्ट में `.failproofai/policies-config.json` (प्रति-प्रोजेक्ट) में रहती है।

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
      "hint": "sudo के बिना सीधे apt-get का उपयोग करें।"
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "इसके बजाय एक ताजा ब्रांच बनाने का प्रयास करें।"
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

**तीन कॉन्फ़िग स्कोप्स** स्वचालित रूप से मर्ज होते हैं (प्रोजेक्ट → स्थानीय → विश्व)। पूर्ण मर्ज नियमों के लिए [docs/configuration.mdx](docs/configuration.mdx) देखें।

---

## बिल्ट-इन पॉलिसीज

| पॉलिसी | विवरण | कॉन्फ़िगर योग्य |
|--------|-------------|:---:|
| `block-sudo` | एजेंट्स को विशेषाधिकार प्राप्त सिस्टम कमांड चलाने से रोकें | `allowPatterns` |
| `block-rm-rf` | आकस्मिक पुनरावर्ती फ़ाइल हटाने को रोकें | `allowPaths` |
| `block-curl-pipe-sh` | एजेंट्स को अविश्वसनीय स्क्रिप्ट को शेल में पाइप करने से रोकें | |
| `block-failproofai-commands` | स्व-अनइंस्टॉलेशन को रोकें | |
| `sanitize-jwt` | JWT टोकन को एजेंट संदर्भ में लीक होने से रोकें | |
| `sanitize-api-keys` | API कीज को एजेंट संदर्भ में लीक होने से रोकें | `additionalPatterns` |
| `sanitize-connection-strings` | डेटाबेस क्रेडेंशियल को एजेंट संदर्भ में लीक होने से रोकें | |
| `sanitize-private-key-content` | आउटपुट से PEM निजी कुंजी ब्लॉक को संपादित करें | |
| `sanitize-bearer-tokens` | आउटपुट से Authorization Bearer टोकन को संपादित करें | |
| `block-env-files` | एजेंट्स को .env फ़ाइलें पढ़ने से रोकें | |
| `protect-env-vars` | एजेंट्स को पर्यावरण चर प्रिंट करने से रोकें | |
| `block-read-outside-cwd` | एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें | `allowPaths` |
| `block-secrets-write` | निजी कुंजी और प्रमाणपत्र फ़ाइलों में लिखने को रोकें | `additionalPatterns` |
| `block-push-master` | मुख्य/मास्टर को आकस्मिक पुश को रोकें | `protectedBranches` |
| `block-work-on-main` | एजेंट्स को सुरक्षित शाखाओं से दूर रखें | `protectedBranches` |
| `block-force-push` | `git push --force` को रोकें | |
| `warn-git-amend` | कमिट संशोधित करने से पहले एजेंट्स को याद दिलाएं | |
| `warn-git-stash-drop` | स्टैश ड्रॉप करने से पहले एजेंट्स को याद दिलाएं | |
| `warn-all-files-staged` | आकस्मिक `git add -A` को पकड़ें | |
| `warn-destructive-sql` | DROP/DELETE SQL को निष्पादन से पहले पकड़ें | |
| `warn-schema-alteration` | ALTER TABLE को निष्पादन से पहले पकड़ें | |
| `warn-large-file-write` | अप्रत्याशित रूप से बड़ी फ़ाइल लिखने को पकड़ें | `thresholdKb` |
| `warn-package-publish` | आकस्मिक `npm publish` को पकड़ें | |
| `warn-background-process` | अनपेक्षित पृष्ठभूमि प्रक्रिया लॉन्च को पकड़ें | |
| `warn-global-package-install` | अनपेक्षित वैश्विक पैकेज इंस्टॉल को पकड़ें | |
| …और अधिक | | |

पूर्ण पॉलिसी विवरण और पैरामीटर संदर्भ: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## कस्टम पॉलिसीज

एजेंट्स को विश्वसनीय और कार्य-केंद्रित रखने के लिए अपनी स्वयं की पॉलिसीज लिखें:

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

के साथ इंस्टॉल करें:

```bash
failproofai policies --install --custom ./my-policies.js
```

### निर्णय सहायक

| फ़ंक्शन | प्रभाव |
|----------|--------|
| `allow()` | संचालन को अनुमति दें |
| `allow(message)` | अनुमति दें और Claude को सूचनात्मक संदर्भ भेजें |
| `deny(message)` | संचालन को ब्लॉक करें; Claude को दिखाया गया संदेश |
| `instruct(message)` | Claude के प्रॉम्प्ट में संदर्भ जोड़ें; ब्लॉक नहीं करता है |

### संदर्भ ऑब्जेक्ट (`ctx`)

| फ़ील्ड | प्रकार | विवरण |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | बुलाया जा रहा टूल (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | टूल के इनपुट पैरामीटर |
| `payload` | `object` | पूर्ण कच्ची ईवेंट पेलोड |
| `session.cwd` | `string` | Claude Code सेशन की कार्यशील निर्देशिका |
| `session.sessionId` | `string` | सेशन पहचानकर्ता |
| `session.transcriptPath` | `string` | सेशन ट्रांसक्रिप्ट फ़ाइल का पथ |

कस्टम हुक ट्रांजिटिव स्थानीय आयात, async/await, और `process.env` तक पहुंच का समर्थन करते हैं। त्रुटियां fail-open होती हैं (`~/.failproofai/hook.log` में लॉग की जाती हैं, बिल्ट-इन पॉलिसीज जारी रहती हैं)। पूर्ण गाइड के लिए [docs/custom-hooks.mdx](docs/custom-hooks.mdx) देखें।

### सम्मेलन-आधारित पॉलिसीज

`*policies.{js,mjs,ts}` फ़ाइलों को `.failproofai/policies/` में ड्रॉप करें और वे स्वचालित रूप से लोड होती हैं — कोई `--custom` फ्लैग या कॉन्फ़िग परिवर्तन की आवश्यकता नहीं। git हुक की तरह काम करता है: एक फ़ाइल ड्रॉप करें, यह बस काम करता है।

```text
# प्रोजेक्ट स्तर — git में प्रतिबद्ध, टीम के साथ साझा
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# उपयोगकर्ता स्तर — व्यक्तिगत, सभी परियोजनाओं पर लागू होता है
~/.failproofai/policies/my-policies.mjs
```

दोनों स्तर लोड होते हैं (यूनियन)। फ़ाइलें प्रत्येक निर्देशिका के भीतर वर्णक्रम में लोड होती हैं। क्रम को नियंत्रित करने के लिए `01-`, `02-`, आदि के साथ उपसर्ग करें। तैयार-से-उपयोग के लिए उदाहरणों के लिए [examples/convention-policies/](examples/convention-policies/) देखें।

---

## टेलीमेट्री

Failproof AI फ़ीचर उपयोग को समझने के लिए PostHog के माध्यम से अनाम उपयोग टेलीमेट्री एकत्र करता है। कोई सेशन सामग्री, फ़ाइल नाम, टूल इनपुट, या व्यक्तिगत जानकारी कभी नहीं भेजी जाती है।

इसे अक्षम करें:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## दस्तावेज़

| गाइड | विवरण |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | इंस्टॉलेशन और पहले कदम |
| [Built-in Policies](docs/built-in-policies.mdx) | सभी 30 बिल्ट-इन पॉलिसीज पैरामीटर के साथ |
| [Custom Policies](docs/custom-policies.mdx) | अपनी स्वयं की पॉलिसीज लिखें |
| [Configuration](docs/configuration.mdx) | कॉन्फ़िग फ़ाइल प्रारूप और स्कोप मर्जिंग |
| [Dashboard](docs/dashboard.mdx) | सेशन मॉनिटर करें और पॉलिसी गतिविधि की समीक्षा करें |
| [Architecture](docs/architecture.mdx) | हुक सिस्टम कैसे काम करता है |
| [Testing](docs/testing.mdx) | परीक्षण चलाना और नए लिखना |

### दस्तावेज़ स्थानीय रूप से चलाएं

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` पर Mintlify दस्तावेज़ साइट खोलता है। यदि आप दस्तावेज़ निर्देशिका को माउंट करते हैं तो कंटेनर परिवर्तनों के लिए देखता है:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai योगदानकर्ताओं के लिए नोट

इस रेपो का `.claude/settings.json` मानक `npx -y failproofai` कमांड के बजाय `bun ./bin/failproofai.mjs --hook <EventType>` का उपयोग करता है। यह है क्योंकि failproofai प्रोजेक्ट के अंदर `npx -y failproofai` चलाने से स्व-संदर्भ विरोध पैदा होता है।

अन्य सभी रेपो के लिए, अनुशंसित दृष्टिकोण `npx -y failproofai` है, इसके माध्यम से स्थापित:

```bash
failproofai policies --install --scope project
```

## योगदान

[CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## लाइसेंस

[LICENSE](LICENSE) देखें।

---

**ExosphereHost: आपके एजेंट्स के लिए विश्वसनीयता अनुसंधान प्रयोगशाला** द्वारा निर्मित और रखरखाव किया गया। हम उद्यमों और स्टार्टअप को अपने AI एजेंट्स की विश्वसनीयता में सुधार करने में मदद करते हैं अपने स्वयं के एजेंट्स, सॉफ्टवेयर, और विशेषज्ञता के माध्यम से। [exosphere.host](https://exosphere.host) पर अधिक जानें।
