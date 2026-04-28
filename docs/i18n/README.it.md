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

Il modo più semplice per gestire le policy che mantengono i tuoi agenti AI affidabili, concentrati e in esecuzione autonoma - per **Claude Code**, **OpenAI Codex** e l'**Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in azione" width="800" />
</p>

## CLI di agenti supportati

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
  <strong>+ altri in arrivo presto</strong>
</p>

> Installa gli hook per uno o entrambi: `failproofai policies --install --cli codex` (oppure `--cli claude codex`). Ometti `--cli` per rilevamento automatico dei CLI installati e prompt interattivo.

- **39 Policy integrate** - Cattura i comuni problemi di fallimento degli agenti pronti all'uso. Blocca i comandi distruttivi, previeni le fughe di segreti, mantieni gli agenti dentro i confini del progetto, rileva i cicli e molto altro.
- **Policy personalizzate** - Scrivi le tue regole di affidabilità in JavaScript. Usa l'API `allow`/`deny`/`instruct` per applicare convenzioni, prevenire derive, controllare operazioni o integrare con sistemi esterni.
- **Configurazione semplice** - Sintonizza qualsiasi policy senza scrivere codice. Imposta allowlist, rami protetti, soglie per progetto o globalmente. La configurazione a tre scope si unisce automaticamente.
- **Monitoraggio agente** - Vedi cosa hanno fatto i tuoi agenti mentre eri fuori. Sfoglia le sessioni, ispeziona ogni chiamata a tool e verifica esattamente dove le policy si sono attivate.

Tutto viene eseguito localmente - nessun dato lascia la tua macchina.

---

## Requisiti

- Node.js >= 20.9.0
- Bun >= 1.3.0 (opzionale - necessario solo per sviluppo / compilazione dal sorgente)

---

## Installazione

```bash
npm install -g failproofai
# o
bun add -g failproofai
```

---

## Avvio rapido

### 1. Abilita le policy globalmente

```bash
failproofai policies --install
```

Scrive le voci di hook in `~/.claude/settings.json`. Claude Code ora invocherà failproofai prima e dopo ogni chiamata a tool.

### 2. Avvia il dashboard

```bash
failproofai
```

Apre `http://localhost:8020` - sfoglia le sessioni, ispeziona i log, gestisci le policy.

### 3. Verifica cosa è attivo

```bash
failproofai policies
```

---

## Installazione delle policy

### Scope

| Scope | Comando | Dove scrive |
|-------|---------|-------------|
| Globale (default) | `failproofai policies --install` | `~/.claude/settings.json` |
| Progetto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installa policy specifiche

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Rimuovi policy

```bash
failproofai policies --uninstall
# o per uno scope specifico:
failproofai policies --uninstall --scope project
```

---

## Configurazione

La configurazione delle policy si trova in `~/.failproofai/policies-config.json` (globale) o `.failproofai/policies-config.json` nel tuo progetto (per-progetto).

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
      "hint": "Usa apt-get direttamente senza sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Prova a creare un nuovo ramo invece."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "Chiave API MyCo" }
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
| `block-sudo` | Impedisci agli agenti di eseguire comandi di sistema privilegiati | `allowPatterns` |
| `block-rm-rf` | Previeni l'eliminazione ricorsiva accidentale dei file | `allowPaths` |
| `block-curl-pipe-sh` | Impedisci agli agenti di indirizzare script non attendibili alla shell | |
| `block-failproofai-commands` | Previeni l'auto-disinstallazione | |
| `sanitize-jwt` | Impedisci ai token JWT di perdere nel contesto dell'agente | |
| `sanitize-api-keys` | Impedisci alle chiavi API di perdere nel contesto dell'agente | `additionalPatterns` |
| `sanitize-connection-strings` | Impedisci alle credenziali di database di perdere nel contesto dell'agente | |
| `sanitize-private-key-content` | Oscura i blocchi di chiave privata PEM dall'output | |
| `sanitize-bearer-tokens` | Oscura i token Bearer di autorizzazione dall'output | |
| `block-env-files` | Impedisci agli agenti di leggere file .env | |
| `protect-env-vars` | Impedisci agli agenti di stampare variabili d'ambiente | |
| `block-read-outside-cwd` | Mantieni gli agenti dentro i confini del progetto | `allowPaths` |
| `block-secrets-write` | Previeni le scritture in file di chiavi private e certificati | `additionalPatterns` |
| `block-push-master` | Previeni i push accidentali a main/master | `protectedBranches` |
| `block-work-on-main` | Tieni gli agenti lontani dai rami protetti | `protectedBranches` |
| `block-force-push` | Previeni `git push --force` | |
| `warn-git-amend` | Ricorda agli agenti prima di emendare i commit | |
| `warn-git-stash-drop` | Ricorda agli agenti prima di eliminare gli stash | |
| `warn-all-files-staged` | Cattura l'accidentale `git add -A` | |
| `warn-destructive-sql` | Cattura DROP/DELETE SQL prima dell'esecuzione | |
| `warn-schema-alteration` | Cattura ALTER TABLE prima dell'esecuzione | |
| `warn-large-file-write` | Cattura le scritture di file inaspettatamente grandi | `thresholdKb` |
| `warn-package-publish` | Cattura l'accidentale `npm publish` | |
| `warn-background-process` | Cattura i lanci di processi di background non intenzionali | |
| `warn-global-package-install` | Cattura i lanci di installazione di pacchetti globali non intenzionali | |
| …e altri | | |

Dettagli completi delle policy e riferimento dei parametri: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Policy personalizzate

Scrivi le tue policy per mantenere gli agenti affidabili e concentrati:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Blocca le scritture in percorsi contenenti 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Le scritture in percorsi di produzione sono bloccate");
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
| `allow()` | Consenti l'operazione |
| `allow(message)` | Consenti e invia il contesto informativo a Claude |
| `deny(message)` | Blocca l'operazione; il messaggio viene mostrato a Claude |
| `instruct(message)` | Aggiungi contesto al prompt di Claude; non blocca |

### Oggetto contesto (`ctx`)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Tool in fase di chiamata (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parametri di input del tool |
| `payload` | `object` | Payload dell'evento completo non elaborato |
| `session.cwd` | `string` | Directory di lavoro della sessione Claude Code |
| `session.sessionId` | `string` | Identificatore della sessione |
| `session.transcriptPath` | `string` | Percorso al file di trascrizione della sessione |

Gli hook personalizzati supportano importazioni locali transitive, async/await e accesso a `process.env`. Gli errori sono fail-open (registrati in `~/.failproofai/hook.log`, le policy integrate continuano). Vedi [docs/custom-hooks.mdx](docs/custom-hooks.mdx) per la guida completa.

### Policy basate su convenzione

Rilascia i file `*policies.{js,mjs,ts}` in `.failproofai/policies/` e vengono caricati automaticamente — nessun flag o cambio di configurazione necessario. Esegui il commit della directory su git e ogni membro del team ottiene gli stessi standard di qualità automaticamente.

```text
# Livello di progetto — sottoposto a commit su git, condiviso con il team
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Livello utente — personale, si applica a tutti i progetti
~/.failproofai/policies/my-policies.mjs
```

Entrambi i livelli vengono caricati (unione). I file vengono caricati alfabeticamente all'interno di ogni directory. Anteponi `01-`, `02-`, ecc. per controllare l'ordine. Man mano che il tuo team scopre nuovi modi di fallire, aggiungi una policy e fai il push — tutti ricevono l'aggiornamento al loro prossimo pull. Vedi [examples/convention-policies/](examples/convention-policies/) per esempi pronti all'uso.

---

## Telemetria

Failproof AI raccoglie telemetria di utilizzo anonima tramite PostHog per comprendere l'utilizzo delle funzionalità. Il contenuto della sessione, i nomi dei file, i dati di input dei tool o le informazioni personali non vengono mai inviati.

Disabilitalo:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentazione

| Guida | Descrizione |
|-------|-------------|
| [Guida introduttiva](docs/getting-started.mdx) | Installazione e primi passi |
| [Policy integrate](docs/built-in-policies.mdx) | Tutte le 39 policy integrate con parametri |
| [Policy personalizzate](docs/custom-policies.mdx) | Scrivi le tue policy |
| [Configurazione](docs/configuration.mdx) | Formato del file di configurazione e unione degli scope |
| [Dashboard](docs/dashboard.mdx) | Monitora le sessioni e rivedi l'attività delle policy |
| [Architettura](docs/architecture.mdx) | Come funziona il sistema di hook |
| [Test](docs/testing.mdx) | Esecuzione dei test e scrittura di nuovi test |

### Esegui la documentazione in locale

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Apre il sito di documentazione Mintlify su `http://localhost:3000`. Il contenitore guarda i cambiamenti se monti la directory dei docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Nota per i contributori di failproofai

Il `.claude/settings.json` di questo repository usa `bun ./bin/failproofai.mjs --hook <EventType>` invece del comando standard `npx -y failproofai`. Questo è perché eseguire `npx -y failproofai` all'interno del progetto failproofai stesso crea un conflitto auto-referenziale.

Per tutti gli altri repository, l'approccio consigliato è `npx -y failproofai`, installato tramite:

```bash
failproofai policies --install --scope project
```

## Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licenza

Vedi [LICENSE](LICENSE).

---

Costruito e mantenuto da **ExosphereHost: Reliability Research Lab for Your Agents**. Aiutiamo le aziende e le startup a migliorare l'affidabilità dei loro agenti AI attraverso i nostri agenti, software e competenze. Scopri di più su [exosphere.host](https://exosphere.host).
