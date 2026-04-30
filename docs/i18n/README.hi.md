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

अपने AI एजेंट्स को विश्वसनीय, केंद्रित और स्वायत्त रूप से चलाने के लिए नीतियों को प्रबंधित करने का सबसे आसान तरीका - **Claude Code**, **OpenAI Codex**, **GitHub Copilot CLI** _(बीटा)_ & **Agents SDK** के लिए।

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI कार्यरत" width="800" />
</p>

## समर्थित एजेंट CLIs

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
  <strong>+ अन्य जल्द आने वाले हैं</strong>
</p>

> एक, दो, या तीनों के लिए हुक इंस्टॉल करें: `failproofai policies --install --cli copilot` (या `--cli claude codex copilot`)। `--cli` को छोड़ दें ताकि स्वचालित रूप से इंस्टॉल किए गए CLIs का पता लगाया जा सके और प्रेरित किया जा सके। **GitHub Copilot CLI समर्थन बीटा में है।**

- **39 अंतर्निहित नीतियां** - सामान्य एजेंट विफलता मोड को बॉक्स से बाहर निकालें। विनाशकारी कमांड को ब्लॉक करें, गुप्त रिसाव को रोकें, एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें, लूप का पता लगाएं, और बहुत कुछ।
- **कस्टम नीतियां** - JavaScript में अपने स्वयं की विश्वसनीयता नियम लिखें। `allow`/`deny`/`instruct` API का उपयोग करके सम्मेलन लागू करें, बहाव को रोकें, संचालन को गेट करें, या बाहरी सिस्टम के साथ एकीकृत करें।
- **आसान कॉन्फ़िगरेशन** - कोड लिखे बिना किसी भी नीति को ट्यून करें। allowlist, सुरक्षित शाखाएं, प्रति-प्रोजेक्ट या विश्व स्तर पर सीमा सेट करें। तीन-स्कोप कॉन्फ़िगरेशन स्वचालित रूप से मर्ज हो जाता है।
- **एजेंट मॉनिटर** - देखें कि आपके एजेंट्स आपके दूर रहते हुए क्या करते थे। सत्रों को ब्राउज़ करें, हर टूल कॉल का निरीक्षण करें, और बिल्कुल देखें कि नीतियां कहां कार्य करती हैं।

सब कुछ स्थानीय रूप से चलता है - कोई डेटा आपकी मशीन से बाहर नहीं जाता है।

---

## आवश्यकताएं

- Node.js >= 20.9.0
- Bun >= 1.3.0 (वैकल्पिक - केवल विकास / स्रोत से बनाने के लिए आवश्यक)

---

## स्थापित करें

```bash
npm install -g failproofai
# या
bun add -g failproofai
```

---

## त्वरित शुरुआत

### 1. नीतियों को विश्व स्तर पर सक्षम करें

```bash
failproofai policies --install
```

`~/.claude/settings.json` में हुक प्रविष्टियां लिखता है। Claude Code अब प्रत्येक टूल कॉल से पहले और बाद में failproofai को लागू करेगा।

### 2. डैशबोर्ड लॉन्च करें

```bash
failproofai
```

`http://localhost:8020` खोलता है - सत्रों को ब्राउज़ करें, लॉग का निरीक्षण करें, नीतियों को प्रबंधित करें।

### 3. जांचें कि क्या सक्रिय है

```bash
failproofai policies
```

---

## नीति स्थापन

### स्कोप

| स्कोप | कमांड | कहाँ यह लिखता है |
|-------|---------|-----------------|
| विश्व स्तर (डिफ़ॉल्ट) | `failproofai policies --install` | `~/.claude/settings.json` |
| प्रोजेक्ट | `failproofai policies --install --scope project` | `.claude/settings.json` |
| स्थानीय | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### विशिष्ट नीतियां स्थापित करें

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### नीतियों को हटाएं

```bash
failproofai policies --uninstall
# या एक विशिष्ट स्कोप के लिए:
failproofai policies --uninstall --scope project
```

---

## विन्यास

नीति विन्यास `~/.failproofai/policies-config.json` (विश्व स्तर) या आपके प्रोजेक्ट में `.failproofai/policies-config.json` (प्रति-प्रोजेक्ट) में रहता है।

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
      "hint": "sudo के बिना apt-get का उपयोग सीधे करें।"
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "इसके बजाय एक ताजा शाखा बनाने का प्रयास करें।"
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API कुंजी" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**तीन विन्यास स्कोप** स्वचालित रूप से मर्ज हो जाते हैं (प्रोजेक्ट → स्थानीय → विश्व स्तर)। पूर्ण मर्ज नियमों के लिए [docs/configuration.mdx](docs/configuration.mdx) देखें।

---

## अंतर्निहित नीतियां

| नीति | विवरण | कॉन्फ़िगरेबल |
|--------|-------------|:---:|
| `block-sudo` | एजेंट्स को विशेषाधिकार प्राप्त सिस्टम कमांड चलाने से रोकें | `allowPatterns` |
| `block-rm-rf` | आकस्मिक पुनरावर्ती फ़ाइल विलोपन को रोकें | `allowPaths` |
| `block-curl-pipe-sh` | एजेंट्स को अविश्वसनीय स्क्रिप्ट को शेल में पाइप करने से रोकें | |
| `block-failproofai-commands` | स्व-स्थापना को रोकें | |
| `sanitize-jwt` | JWT टोकन को एजेंट संदर्भ में रिसाव से रोकें | |
| `sanitize-api-keys` | API कुंजी को एजेंट संदर्भ में रिसाव से रोकें | `additionalPatterns` |
| `sanitize-connection-strings` | डेटाबेस क्रेडेंशियल को एजेंट संदर्भ में रिसाव से रोकें | |
| `sanitize-private-key-content` | आउटपुट से PEM निजी कुंजी ब्लॉक को संपादित करें | |
| `sanitize-bearer-tokens` | आउटपुट से प्राधिकरण Bearer टोकन को संपादित करें | |
| `block-env-files` | एजेंट्स को .env फ़ाइलें पढ़ने से रखें | |
| `protect-env-vars` | एजेंट्स को पर्यावरण चर प्रिंट करने से रोकें | |
| `block-read-outside-cwd` | एजेंट्स को प्रोजेक्ट सीमाओं के अंदर रखें | `allowPaths` |
| `block-secrets-write` | निजी कुंजी और प्रमाणपत्र फ़ाइलों में लिखने को रोकें | `additionalPatterns` |
| `block-push-master` | मुख्य/मास्टर में आकस्मिक पुश को रोकें | `protectedBranches` |
| `block-work-on-main` | एजेंट्स को सुरक्षित शाखाओं से दूर रखें | `protectedBranches` |
| `block-force-push` | `git push --force` को रोकें | |
| `warn-git-amend` | कमिट संशोधित करने से पहले एजेंट्स को याद दिलाएं | |
| `warn-git-stash-drop` | स्टैश को छोड़ने से पहले एजेंट्स को याद दिलाएं | |
| `warn-all-files-staged` | आकस्मिक `git add -A` को पकड़ें | |
| `warn-destructive-sql` | DROP/DELETE SQL को निष्पादन से पहले पकड़ें | |
| `warn-schema-alteration` | ALTER TABLE को निष्पादन से पहले पकड़ें | |
| `warn-large-file-write` | अप्रत्याशित रूप से बड़ी फ़ाइल लिखने को पकड़ें | `thresholdKb` |
| `warn-package-publish` | आकस्मिक `npm publish` को पकड़ें | |
| `warn-background-process` | अनपेक्षित बैकग्राउंड प्रक्रिया लॉन्च को पकड़ें | |
| `warn-global-package-install` | अनपेक्षित वैश्विक पैकेज इंस्टॉल को पकड़ें | |
| …और अधिक | | |

पूर्ण नीति विवरण और पैरामीटर संदर्भ: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## कस्टम नीतियां

एजेंट्स को विश्वसनीय और केंद्रित रखने के लिए अपनी स्वयं की नीतियां लिखें:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "'production' युक्त पथों में लिखने को ब्लॉक करें",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("उत्पादन पथों में लिखना अवरुद्ध है");
    return allow();
  },
});
```

इसके साथ स्थापित करें:

```bash
failproofai policies --install --custom ./my-policies.js
```

### निर्णय सहायक

| कार्य | प्रभाव |
|----------|--------|
| `allow()` | संचालन की अनुमति दें |
| `allow(message)` | अनुमति दें और Claude को सूचनात्मक संदर्भ भेजें |
| `deny(message)` | संचालन को ब्लॉक करें; संदेश Claude को दिखाया गया |
| `instruct(message)` | Claude के प्रॉम्प्ट को संदर्भ जोड़ें; ब्लॉक नहीं करता है |

### संदर्भ ऑब्जेक्ट (`ctx`)

| फील्ड | प्रकार | विवरण |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | कॉल किया जा रहा टूल (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | टूल के इनपुट पैरामीटर |
| `payload` | `object` | पूर्ण कच्ची इवेंट पेलोड |
| `session.cwd` | `string` | Claude Code सत्र की कार्य निर्देशिका |
| `session.sessionId` | `string` | सत्र पहचानकर्ता |
| `session.transcriptPath` | `string` | सत्र प्रतिलेख फ़ाइल का पथ |

कस्टम हुक transitive स्थानीय आयात, async/await, और `process.env` तक पहुंच का समर्थन करते हैं। त्रुटियां fail-open हैं (लॉग किए गए `~/.failproofai/hook.log`, अंतर्निहित नीतियां जारी रहती हैं)। पूर्ण मार्गदर्शन के लिए [docs/custom-hooks.mdx](docs/custom-hooks.mdx) देखें।

### सम्मेलन-आधारित नीतियां

`.failproofai/policies/` में `*policies.{js,mjs,ts}` फ़ाइलें छोड़ें और वे स्वचालित रूप से लोड होती हैं - कोई फ्लैग या कॉन्फ़िगरेशन परिवर्तन की आवश्यकता नहीं है। निर्देशिका को git में कमिट करें और हर टीम सदस्य को स्वचालित रूप से समान गुणवत्ता मानक मिलते हैं।

```text
# प्रोजेक्ट स्तर — git में कमिट किया गया, टीम के साथ साझा किया गया
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# उपयोगकर्ता स्तर — व्यक्तिगत, सभी प्रोजेक्ट्स पर लागू होता है
~/.failproofai/policies/my-policies.mjs
```

दोनों स्तर लोड होते हैं (union)। फ़ाइलें प्रत्येक निर्देशिका के अंदर वर्णक्रम के आधार पर लोड होती हैं। आदेश को नियंत्रित करने के लिए `01-`, `02-`, आदि से उपसर्ग करें। जब आपकी टीम नई विफलता मोड को खोजती है, तो एक नीति जोड़ें और पुश करें — सभी को अपने अगले पुल पर अपडेट मिलता है। [examples/convention-policies/](examples/convention-policies/) में उपयोग के लिए तैयार उदाहरण देखें।

---

## टेलीमेट्री

Failproof AI PostHog के माध्यम से गुमनाम उपयोग टेलीमेट्री एकत्र करता है ताकि सुविधा उपयोग को समझा जा सके। कोई सत्र सामग्री, फ़ाइल के नाम, टूल इनपुट, या व्यक्तिगत जानकारी कभी नहीं भेजी जाती है।

इसे अक्षम करें:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## प्रलेखन

| गाइड | विवरण |
|-------|-------------|
| [शुरुआत करना](docs/getting-started.mdx) | स्थापन और पहले कदम |
| [अंतर्निहित नीतियां](docs/built-in-policies.mdx) | सभी 39 अंतर्निहित नीतियां पैरामीटर के साथ |
| [कस्टम नीतियां](docs/custom-policies.mdx) | अपनी स्वयं की नीतियां लिखें |
| [विन्यास](docs/configuration.mdx) | कॉन्फ़िगरेशन फ़ाइल प्रारूप और स्कोप मर्जिंग |
| [डैशबोर्ड](docs/dashboard.mdx) | सत्रों की निगरानी करें और नीति गतिविधि की समीक्षा करें |
| [आर्किटेक्चर](docs/architecture.mdx) | हुक सिस्टम कैसे काम करता है |
| [परीक्षण](docs/testing.mdx) | परीक्षण चलाना और नए लिखना |

### स्थानीय रूप से दस्तावेज़ चलाएं

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` पर Mintlify दस्तावेज़ साइट खोलता है। कंटेनर दस्तावेज़ निर्देशिका को माउंट करने पर परिवर्तनों के लिए देखता है:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai योगदानकर्ताओं के लिए नोट

इस रिपो का `.claude/settings.json` मानक `npx -y failproofai` कमांड के बजाय `bun ./bin/failproofai.mjs --hook <EventType>` का उपयोग करता है। यह इसलिए है क्योंकि failproofai प्रोजेक्ट के अंदर `npx -y failproofai` चलाने से स्व-संदर्भित विरोध पैदा होता है।

अन्य सभी रिपो के लिए, अनुशंसित दृष्टिकोण `npx -y failproofai` है, जो इसके द्वारा स्थापित है:

```bash
failproofai policies --install --scope project
```

## योगदान देना

[CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## लाइसेंस

[LICENSE](LICENSE) देखें।

---

**ExosphereHost: आपके एजेंट्स के लिए विश्वसनीयता अनुसंधान प्रयोगशाला** द्वारा निर्मित और रखरखाव किया गया। हम अपने स्वयं के एजेंट्स, सॉफ्टवेयर, और विशेषज्ञता के माध्यम से उद्यम और स्टार्टअप को अपने AI एजेंट्स की विश्वसनीयता में सुधार करने में मदद करते हैं। [exosphere.host](https://exosphere.host) पर और जानें।
