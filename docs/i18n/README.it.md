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

Il modo più semplice per gestire le policy che mantengono i tuoi agenti AI affidabili, focalizzati e in esecuzione autonoma - per **Claude Code**, **OpenAI Codex**, **GitHub Copilot CLI** _(beta)_ e l'**Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

## CLI agenti supportati

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
  <strong>+ altri in arrivo a breve</strong>
</p>

> Installa gli hook per uno, due o tutti e tre: `failproofai policies --install --cli copilot` (oppure `--cli claude codex copilot`). Ometti `--cli` per il rilevamento automatico dei CLI installati e un prompt. **Il supporto per GitHub Copilot CLI è in beta.**

- **39 Policy Integrate** - Cattura i comuni modi di fallimento degli agenti già pronti all'uso. Blocca i comandi distruttivi, previene le fughe di segreti, mantiene gli agenti entro i confini del progetto, rileva i loop e altro ancora.
- **Policy Personalizzate** - Scrivi le tue regole di affidabilità in JavaScript. Usa l'API `allow`/`deny`/`instruct` per applicare convenzioni, prevenire derive, controllare le operazioni o integrarsi con sistemi esterni.
- **Configurazione Facile** - Sintonizza qualsiasi policy senza scrivere codice. Imposta liste di permessi, branch protetti, soglie per progetto o globalmente. Tre scope di configurazione si uniscono automaticamente.
- **Monitor Agenti** - Guarda cosa hanno fatto i tuoi agenti mentre eri via. Consulta le sessioni, ispeziona ogni chiamata di tool e rivedi esattamente dove le policy sono state attivate.

Tutto viene eseguito localmente - nessun dato lascia la tua macchina.

---

## Requisiti

- Node.js >= 20.9.0
- Bun >= 1.3.0 (opzionale - necessario solo per lo sviluppo / compilazione da fonte)

---

## Installazione

```bash
npm install -g failproofai
# oppure
bun add -g failproofai
```

---

## Avvio rapido

### 1. Abilita le policy globalmente

```bash
failproofai policies --install
```

Scrive i dati hook in `~/.claude/settings.json`. Claude Code ora invocherà failproofai prima e dopo ogni chiamata di tool.

### 2. Avvia il dashboard

```bash
failproofai
```

Apre `http://localhost:8020` - consulta le sessioni, ispeziona i log, gestisci le policy.

### 3. Controlla cosa è attivo

```bash
failproofai policies
```

---

## Installazione della policy

### Scope

| Scope | Comando | Dove scrive |
|-------|---------|-------------|
| Globale (predefinito) | `failproofai policies --install` | `~/.claude/settings.json` |
| Progetto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installa policy specifiche

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Rimuovi le policy

```bash
failproofai policies --uninstall
# oppure per uno scope specifico:
failproofai policies --uninstall --scope project
```

---

## Configurazione

La configurazione della policy si trova in `~/.failproofai/policies-config.json` (globale) o `.failproofai/policies-config.json` nel tuo progetto (per-progetto).

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
      "hint": "Use apt-get directly without sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Try creating a fresh branch instead."
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

**Tre scope di configurazione** vengono uniti automaticamente (progetto → locale → globale). Vedi [docs/configuration.mdx](docs/configuration.mdx) per le regole di unione complete.

---

## Policy integrate

| Policy | Descrizione | Configurabile |
|--------|-------------|:---:|
| `block-sudo` | Impedisce agli agenti di eseguire comandi di sistema privilegiati | `allowPatterns` |
| `block-rm-rf` | Impedisce l'eliminazione ricorsiva accidentale di file | `allowPaths` |
| `block-curl-pipe-sh` | Impedisce agli agenti di convogliare script non attendibili alla shell | |
| `block-failproofai-commands` | Impedisce l'auto-disinstallazione | |
| `sanitize-jwt` | Ferma la perdita di token JWT nel contesto dell'agente | |
| `sanitize-api-keys` | Ferma la perdita di chiavi API nel contesto dell'agente | `additionalPatterns` |
| `sanitize-connection-strings` | Ferma la perdita delle credenziali del database nel contesto dell'agente | |
| `sanitize-private-key-content` | Redige i blocchi di chiave privata PEM dall'output | |
| `sanitize-bearer-tokens` | Redige i token Bearer di Authorization dall'output | |
| `block-env-files` | Impedisce agli agenti di leggere file .env | |
| `protect-env-vars` | Impedisce agli agenti di stampare le variabili d'ambiente | |
| `block-read-outside-cwd` | Mantiene gli agenti entro i confini del progetto | `allowPaths` |
| `block-secrets-write` | Impedisce le scritture su file di chiave privata e certificato | `additionalPatterns` |
| `block-push-master` | Impedisce i push accidentali su main/master | `protectedBranches` |
| `block-work-on-main` | Mantiene gli agenti lontani dai branch protetti | `protectedBranches` |
| `block-force-push` | Impedisce `git push --force` | |
| `warn-git-amend` | Ricorda agli agenti prima di modificare i commit | |
| `warn-git-stash-drop` | Ricorda agli agenti prima di eliminare gli stash | |
| `warn-all-files-staged` | Cattura `git add -A` accidentale | |
| `warn-destructive-sql` | Cattura DROP/DELETE SQL prima dell'esecuzione | |
| `warn-schema-alteration` | Cattura ALTER TABLE prima dell'esecuzione | |
| `warn-large-file-write` | Cattura le scritture di file inaspettatamente grandi | `thresholdKb` |
| `warn-package-publish` | Cattura `npm publish` accidentale | |
| `warn-background-process` | Cattura l'avvio di processi di background involontario | |
| `warn-global-package-install` | Cattura gli install di pacchetti globali involontari | |
| …e altri | | |

Dettagli completi sulla policy e riferimento dei parametri: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Policy personalizzate

Scrivi le tue policy per mantenere gli agenti affidabili e focalizzati:

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

### Helper di decisione

| Funzione | Effetto |
|----------|--------|
| `allow()` | Consenti l'operazione |
| `allow(message)` | Consenti e invia contesto informativo a Claude |
| `deny(message)` | Blocca l'operazione; il messaggio viene mostrato a Claude |
| `instruct(message)` | Aggiungi contesto al prompt di Claude; non blocca |

### Oggetto di contesto (`ctx`)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Tool in fase di chiamata (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parametri di input del tool |
| `payload` | `object` | Payload di evento grezzo completo |
| `session.cwd` | `string` | Directory di lavoro della sessione Claude Code |
| `session.sessionId` | `string` | Identificatore della sessione |
| `session.transcriptPath` | `string` | Percorso al file di trascrizione della sessione |

I hook personalizzati supportano import locali transitivi, async/await e accesso a `process.env`. Gli errori sono fail-open (registrati in `~/.failproofai/hook.log`, le policy integrate continuano). Vedi [docs/custom-hooks.mdx](docs/custom-hooks.mdx) per la guida completa.

### Policy basate su convenzione

Scarica i file `*policies.{js,mjs,ts}` in `.failproofai/policies/` e vengono caricati automaticamente - nessun flag o cambiamento di configurazione necessario. Esegui il commit della directory in git e ogni membro del team ottiene automaticamente gli stessi standard di qualità.

```text
# Livello progetto — committed a git, condiviso con il team
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Livello utente — personale, si applica a tutti i progetti
~/.failproofai/policies/my-policies.mjs
```

Entrambi i livelli vengono caricati (union). I file vengono caricati alfabeticamente all'interno di ogni directory. Prefisso con `01-`, `02-`, ecc. per controllare l'ordine. Man mano che il tuo team scopre nuovi modi di fallimento, aggiungi una policy e fai il push - tutti ottengono l'aggiornamento al loro prossimo pull. Vedi [examples/convention-policies/](examples/convention-policies/) per esempi pronti all'uso.

---

## Telemetria

Failproof AI raccoglie telemetria d'uso anonima tramite PostHog per comprendere l'utilizzo delle funzionalità. Il contenuto della sessione, i nomi dei file, gli input dei tool o le informazioni personali non vengono mai inviati.

Disabilitalo:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentazione

| Guida | Descrizione |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | Installazione e primi passi |
| [Built-in Policies](docs/built-in-policies.mdx) | Tutte le 39 policy integrate con parametri |
| [Custom Policies](docs/custom-policies.mdx) | Scrivi le tue policy |
| [Configuration](docs/configuration.mdx) | Formato del file di configurazione e unione degli scope |
| [Dashboard](docs/dashboard.mdx) | Monitora le sessioni e rivedi l'attività delle policy |
| [Architecture](docs/architecture.mdx) | Come funziona il sistema di hook |
| [Testing](docs/testing.mdx) | Esecuzione dei test e scrittura di nuovi |

### Esegui la documentazione localmente

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Apre il sito di documentazione Mintlify su `http://localhost:3000`. Il contenitore guarda i cambiamenti se monti la directory della documentazione:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Nota per i contributori di failproofai

Il `.claude/settings.json` di questo repo utilizza `bun ./bin/failproofai.mjs --hook <EventType>` invece del comando standard `npx -y failproofai`. Questo è perché eseguire `npx -y failproofai` all'interno del progetto failproofai stesso crea un conflitto di auto-riferimento.

Per tutti gli altri repo, l'approccio consigliato è `npx -y failproofai`, installato tramite:

```bash
failproofai policies --install --scope project
```

## Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licenza

Vedi [LICENSE](LICENSE).

---

Creato e Mantenuto da **ExosphereHost: Reliability Research Lab for Your Agents**. Aiutiamo aziende e startup a migliorare l'affidabilità dei loro agenti AI attraverso i nostri agenti, software e competenze. Scopri di più su [exosphere.host](https://exosphere.host).
