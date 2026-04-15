> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | **🇮🇹 Italiano** | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Traduzioni**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

Il modo più semplice per gestire le policy che mantengono i tuoi agenti AI affidabili, concentrati sul compito e in esecuzione autonoma — per **Claude Code** e l'**Agents SDK**.

- **30 Policy Integrate** - Intercetta i principali scenari di fallimento degli agenti già al primo avvio. Blocca comandi distruttivi, impedisce la fuoriuscita di segreti, mantiene gli agenti entro i confini del progetto, rileva i loop e molto altro.
- **Policy Personalizzate** - Scrivi le tue regole di affidabilità in JavaScript. Usa l'API `allow`/`deny`/`instruct` per imporre convenzioni, prevenire derive, controllare le operazioni o integrarti con sistemi esterni.
- **Configurazione Semplice** - Personalizza qualsiasi policy senza scrivere codice. Imposta allowlist, branch protetti e soglie per progetto o a livello globale. La configurazione su tre livelli viene unita automaticamente.
- **Monitor degli Agenti** - Scopri cosa hanno fatto i tuoi agenti mentre eri assente. Sfoglia le sessioni, ispeziona ogni chiamata agli strumenti e verifica esattamente dove si sono attivate le policy.

Tutto viene eseguito in locale — nessun dato lascia il tuo computer.

---

## Requisiti

- Node.js >= 20.9.0
- Bun >= 1.3.0 (opzionale — necessario solo per lo sviluppo / la compilazione dai sorgenti)

---

## Installazione

```bash
npm install -g failproofai
# oppure
bun add -g failproofai
```

---

## Avvio rapido

### 1. Abilita le policy a livello globale

```bash
failproofai policies --install
```

Scrive le voci degli hook in `~/.claude/settings.json`. Claude Code invocherà ora failproofai prima e dopo ogni chiamata agli strumenti.

### 2. Avvia la dashboard

```bash
failproofai
```

Apre `http://localhost:8020` — sfoglia le sessioni, ispeziona i log, gestisci le policy.

### 3. Controlla cosa è attivo

```bash
failproofai policies
```

---

## Installazione delle policy

### Scope

| Scope | Comando | Dove scrive |
|-------|---------|-----------------|
| Globale (predefinito) | `failproofai policies --install` | `~/.claude/settings.json` |
| Progetto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installare policy specifiche

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Rimuovere le policy

```bash
failproofai policies --uninstall
# oppure per uno scope specifico:
failproofai policies --uninstall --scope project
```

---

## Configurazione

La configurazione delle policy si trova in `~/.failproofai/policies-config.json` (globale) oppure in `.failproofai/policies-config.json` nella directory del tuo progetto (per singolo progetto).

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

**I tre scope di configurazione** vengono uniti automaticamente (progetto → locale → globale). Consulta [docs/configuration.mdx](docs/configuration.mdx) per le regole complete di unione.

---

## Policy integrate

| Policy | Descrizione | Configurabile |
|--------|-------------|:---:|
| `block-sudo` | Impedisce agli agenti di eseguire comandi di sistema con privilegi elevati | `allowPatterns` |
| `block-rm-rf` | Previene l'eliminazione ricorsiva accidentale di file | `allowPaths` |
| `block-curl-pipe-sh` | Impedisce agli agenti di inviare script non attendibili alla shell tramite pipe | |
| `block-failproofai-commands` | Impedisce la disinstallazione automatica | |
| `sanitize-jwt` | Blocca la fuoriuscita di token JWT nel contesto dell'agente | |
| `sanitize-api-keys` | Blocca la fuoriuscita di chiavi API nel contesto dell'agente | `additionalPatterns` |
| `sanitize-connection-strings` | Blocca la fuoriuscita di credenziali del database nel contesto dell'agente | |
| `sanitize-private-key-content` | Oscura i blocchi di chiavi private PEM dall'output | |
| `sanitize-bearer-tokens` | Oscura i token Authorization Bearer dall'output | |
| `block-env-files` | Impedisce agli agenti di leggere i file .env | |
| `protect-env-vars` | Impedisce agli agenti di stampare le variabili d'ambiente | |
| `block-read-outside-cwd` | Mantiene gli agenti entro i confini del progetto | `allowPaths` |
| `block-secrets-write` | Impedisce la scrittura su file di chiavi private e certificati | `additionalPatterns` |
| `block-push-master` | Previene push accidentali su main/master | `protectedBranches` |
| `block-work-on-main` | Mantiene gli agenti lontani dai branch protetti | `protectedBranches` |
| `block-force-push` | Impedisce `git push --force` | |
| `warn-git-amend` | Avvisa gli agenti prima di modificare i commit | |
| `warn-git-stash-drop` | Avvisa gli agenti prima di eliminare gli stash | |
| `warn-all-files-staged` | Intercetta `git add -A` accidentali | |
| `warn-destructive-sql` | Intercetta istruzioni SQL DROP/DELETE prima dell'esecuzione | |
| `warn-schema-alteration` | Intercetta ALTER TABLE prima dell'esecuzione | |
| `warn-large-file-write` | Intercetta scritture di file inaspettatamente grandi | `thresholdKb` |
| `warn-package-publish` | Intercetta `npm publish` accidentali | |
| `warn-background-process` | Intercetta avvii non intenzionali di processi in background | |
| `warn-global-package-install` | Intercetta installazioni non intenzionali di pacchetti globali | |
| …e altre | | |

Dettagli completi sulle policy e riferimento ai parametri: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Policy personalizzate

Scrivi le tue policy per mantenere gli agenti affidabili e concentrati sul compito:

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

Installa con:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Helper per le decisioni

| Funzione | Effetto |
|----------|--------|
| `allow()` | Permette l'operazione |
| `allow(message)` | Permette l'operazione e invia un contesto informativo a Claude *(beta)* |
| `deny(message)` | Blocca l'operazione; il messaggio viene mostrato a Claude |
| `instruct(message)` | Aggiunge contesto al prompt di Claude; non blocca l'operazione |

### Oggetto di contesto (`ctx`)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Strumento in uso (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parametri di input dello strumento |
| `payload` | `object` | Payload grezzo completo dell'evento |
| `session.cwd` | `string` | Directory di lavoro della sessione Claude Code |
| `session.sessionId` | `string` | Identificatore della sessione |
| `session.transcriptPath` | `string` | Percorso al file di trascrizione della sessione |

Gli hook personalizzati supportano importazioni locali transitive, async/await e accesso a `process.env`. Gli errori sono fail-open (registrati in `~/.failproofai/hook.log`, le policy integrate continuano a funzionare). Consulta [docs/custom-hooks.mdx](docs/custom-hooks.mdx) per la guida completa.

---

## Telemetria

Failproof AI raccoglie telemetria anonima sull'utilizzo tramite PostHog per comprendere come vengono usate le funzionalità. Non vengono mai inviati contenuti delle sessioni, nomi di file, input degli strumenti o informazioni personali.

Per disabilitarla:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentazione

| Guida | Descrizione |
|-------|-------------|
| [Per iniziare](docs/getting-started.mdx) | Installazione e primi passi |
| [Policy integrate](docs/built-in-policies.mdx) | Tutte le 30 policy integrate con i relativi parametri |
| [Policy personalizzate](docs/custom-policies.mdx) | Scrivi le tue policy |
| [Configurazione](docs/configuration.mdx) | Formato del file di configurazione e unione degli scope |
| [Dashboard](docs/dashboard.mdx) | Monitora le sessioni e verifica l'attività delle policy |
| [Architettura](docs/architecture.mdx) | Come funziona il sistema di hook |
| [Testing](docs/testing.mdx) | Esecuzione dei test e scrittura di nuovi test |

### Eseguire la documentazione in locale

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Apre il sito della documentazione Mintlify su `http://localhost:3000`. Il container rileva le modifiche se monti la directory dei documenti:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Contribuire

Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licenza

Consulta [LICENSE](LICENSE).
