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

Il modo più semplice per gestire le policy che mantengono i tuoi agenti AI affidabili, focalizzati e in esecuzione autonoma - per **Claude Code** e **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **30 Policy Integrate** - Rileva i comuni fallimenti degli agenti immediatamente. Blocca i comandi distruttivi, previeni le fughe di segreti, mantieni gli agenti all'interno dei confini del progetto, rileva i loop e altro ancora.
- **Policy Personalizzate** - Scrivi le tue regole di affidabilità in JavaScript. Usa l'API `allow`/`deny`/`instruct` per applicare convenzioni, prevenire derive, controllare operazioni, o integrarti con sistemi esterni.
- **Configurazione Semplice** - Regola qualsiasi policy senza scrivere codice. Imposta liste di allowlist, branch protetti, soglie per progetto o globalmente. Le config a tre livelli si uniscono automaticamente.
- **Agent Monitor** - Vedi cosa hanno fatto i tuoi agenti mentre eri assente. Sfoglia le sessioni, ispeziona ogni chiamata di strumento, e verifica esattamente dove le policy si sono attivate.

Tutto viene eseguito localmente - nessun dato esce dal tuo computer.

---

## Requisiti

- Node.js >= 20.9.0
- Bun >= 1.3.0 (facoltativo - solo per sviluppo / compilazione da sorgente)

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

Scrive le voci hook in `~/.claude/settings.json`. Claude Code ora invocare failproofai prima e dopo ogni chiamata dello strumento.

### 2. Avvia la dashboard

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

### Ambiti

| Ambito | Comando | Dove scrive |
|--------|---------|------------|
| Global (predefinito) | `failproofai policies --install` | `~/.claude/settings.json` |
| Progetto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installa policy specifiche

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Rimuovi policy

```bash
failproofai policies --uninstall
# oppure per un ambito specifico:
failproofai policies --uninstall --scope project
```

---

## Configurazione

La configurazione della policy si trova in `~/.failproofai/policies-config.json` (globale) o `.failproofai/policies-config.json` nel tuo progetto (per progetto).

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
      "hint": "Prova a creare un branch nuovo invece."
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

**Tre ambiti di config** vengono uniti automaticamente (progetto → locale → globale). Vedi [docs/configuration.mdx](docs/configuration.mdx) per le regole di unione complete.

---

## Policy integrate

| Policy | Descrizione | Configurabile |
|--------|------------|:---:|
| `block-sudo` | Previeni che gli agenti eseguano comandi di sistema privilegiati | `allowPatterns` |
| `block-rm-rf` | Previeni l'eliminazione accidentale di file ricorsiva | `allowPaths` |
| `block-curl-pipe-sh` | Previeni che gli agenti eseguano script non attendibili piping alla shell | |
| `block-failproofai-commands` | Previeni l'auto-disinstallazione | |
| `sanitize-jwt` | Ferma i token JWT dal perdere nel contesto dell'agente | |
| `sanitize-api-keys` | Ferma i codici API dal perdere nel contesto dell'agente | `additionalPatterns` |
| `sanitize-connection-strings` | Ferma le credenziali di database dal perdere nel contesto dell'agente | |
| `sanitize-private-key-content` | Redigi i blocchi di chiave privata PEM dall'output | |
| `sanitize-bearer-tokens` | Redigi i token Authorization Bearer dall'output | |
| `block-env-files` | Impedi agli agenti di leggere i file .env | |
| `protect-env-vars` | Previeni che gli agenti stampino le variabili di ambiente | |
| `block-read-outside-cwd` | Mantieni gli agenti all'interno dei confini del progetto | `allowPaths` |
| `block-secrets-write` | Previeni le scritture su file di chiave privata e certificato | `additionalPatterns` |
| `block-push-master` | Previeni i push accidentali a main/master | `protectedBranches` |
| `block-work-on-main` | Mantieni gli agenti fuori dai branch protetti | `protectedBranches` |
| `block-force-push` | Previeni `git push --force` | |
| `warn-git-amend` | Avvisa gli agenti prima di emendare i commit | |
| `warn-git-stash-drop` | Avvisa gli agenti prima di scartare gli stash | |
| `warn-all-files-staged` | Rileva l'accidentale `git add -A` | |
| `warn-destructive-sql` | Rileva DROP/DELETE SQL prima dell'esecuzione | |
| `warn-schema-alteration` | Rileva ALTER TABLE prima dell'esecuzione | |
| `warn-large-file-write` | Rileva scritture di file inaspettatamente grandi | `thresholdKb` |
| `warn-package-publish` | Rileva l'accidentale `npm publish` | |
| `warn-background-process` | Rileva i lanci di processi in background non intenzionali | |
| `warn-global-package-install` | Rileva le installazioni di pacchetti globali non intenzionali | |
| …e altri | | |

Dettagli completi della policy e riferimento dei parametri: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

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

### Funzioni di supporto alle decisioni

| Funzione | Effetto |
|----------|--------|
| `allow()` | Consenti l'operazione |
| `allow(message)` | Consenti e invia il contesto informativo a Claude |
| `deny(message)` | Blocca l'operazione; il messaggio viene mostrato a Claude |
| `instruct(message)` | Aggiungi il contesto al prompt di Claude; non blocca |

### Oggetto contesto (`ctx`)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Strumento chiamato (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parametri di input dello strumento |
| `payload` | `object` | Payload dell'evento grezzo completo |
| `session.cwd` | `string` | Directory di lavoro della sessione Claude Code |
| `session.sessionId` | `string` | Identificatore della sessione |
| `session.transcriptPath` | `string` | Percorso del file trascrizione della sessione |

Gli hook personalizzati supportano importazioni locali transitive, async/await, e accesso a `process.env`. Gli errori non bloccano (registrati in `~/.failproofai/hook.log`, le policy integrate continuano). Vedi [docs/custom-hooks.mdx](docs/custom-hooks.mdx) per la guida completa.

### Policy basate su convenzioni

Copia i file `*policies.{js,mjs,ts}` in `.failproofai/policies/` e vengono caricati automaticamente — nessun flag o cambio di configurazione necessario. Committa la directory su git e ogni membro del team ottiene automaticamente gli stessi standard di qualità.

```text
# Livello progetto — committato su git, condiviso con il team
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Livello utente — personale, si applica a tutti i progetti
~/.failproofai/policies/my-policies.mjs
```

Entrambi i livelli si caricano (unione). I file vengono caricati in ordine alfabetico all'interno di ogni directory. Prefissa con `01-`, `02-`, ecc. per controllare l'ordine. Man mano che il tuo team scopre nuovi modelli di fallimento, aggiungi una policy e esegui il push — tutti ricevono l'aggiornamento al prossimo pull. Vedi [examples/convention-policies/](examples/convention-policies/) per esempi pronti all'uso.

---

## Telemetria

Failproof AI raccoglie la telemetria di utilizzo anonima tramite PostHog per comprendere l'utilizzo delle funzionalità. Il contenuto della sessione, i nomi dei file, gli input degli strumenti, o le informazioni personali non vengono mai inviate.

Disabilitalo:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentazione

| Guida | Descrizione |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | Installazione e primi passi |
| [Built-in Policies](docs/built-in-policies.mdx) | Tutte le 30 policy integrate con parametri |
| [Custom Policies](docs/custom-policies.mdx) | Scrivi le tue policy |
| [Configuration](docs/configuration.mdx) | Formato del file di configurazione e unione degli ambiti |
| [Dashboard](docs/dashboard.mdx) | Monitora le sessioni e rivedi l'attività delle policy |
| [Architecture](docs/architecture.mdx) | Come funziona il sistema di hook |
| [Testing](docs/testing.mdx) | Esecuzione dei test e scrittura di nuovi test |

### Esegui la documentazione localmente

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Apre il sito della documentazione Mintlify su `http://localhost:3000`. Il contenitore osserva i cambiamenti se monti la directory della documentazione:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Nota per i contributori di failproofai

Il `.claude/settings.json` di questo repo usa `bun ./bin/failproofai.mjs --hook <EventType>` invece del comando standard `npx -y failproofai`. Questo perché l'esecuzione di `npx -y failproofai` all'interno del progetto failproofai stesso crea un conflitto di auto-referenza.

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

Costruito e gestito da **ExosphereHost: Reliability Research Lab for Your Agents**. Aiutiamo le aziende e le startup a migliorare l'affidabilità dei loro agenti AI attraverso i nostri agenti, software e competenza. Scopri di più su [exosphere.host](https://exosphere.host).
