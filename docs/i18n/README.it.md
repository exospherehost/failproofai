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

- **30 Policy Integrate** - Rileva i comuni modi di fallimento degli agenti immediatamente. Blocca i comandi distruttivi, previeni le fughe di segreti, mantieni gli agenti entro i confini del progetto, rileva i loop e altro ancora.
- **Policy Personalizzate** - Scrivi le tue regole di affidabilità in JavaScript. Usa l'API `allow`/`deny`/`instruct` per imporre convenzioni, prevenire derive, controllare operazioni o integrarti con sistemi esterni.
- **Configurazione Facile** - Personalizza qualsiasi policy senza scrivere codice. Imposta allowlist, rami protetti, soglie per progetto o globalmente. La configurazione con tre ambiti si unisce automaticamente.
- **Monitoraggio Agenti** - Vedi cosa hanno fatto i tuoi agenti mentre eri assente. Sfoglia le sessioni, ispeziona ogni chiamata di strumento e verifica esattamente dove sono state applicate le policy.

Tutto funziona localmente - nessun dato esce dalla tua macchina.

---

## Requisiti

- Node.js >= 20.9.0
- Bun >= 1.3.0 (opzionale - necessario solo per lo sviluppo / compilazione da sorgente)

---

## Installa

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

Scrive le voci di hook in `~/.claude/settings.json`. Claude Code ora richiamerà failproofai prima e dopo ogni chiamata di strumento.

### 2. Avvia il dashboard

```bash
failproofai
```

Apre `http://localhost:8020` - sfoglia le sessioni, ispeziona i log, gestisci le policy.

### 3. Controlla cosa è attivo

```bash
failproofai policies
```

---

## Installazione delle policy

### Ambiti

| Ambito | Comando | Dove scrive |
|--------|---------|-------------|
| Globale (predefinito) | `failproofai policies --install` | `~/.claude/settings.json` |
| Progetto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installa policy specifiche

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Rimuovi policy

```bash
failproofai policies --uninstall
# o per uno specifico ambito:
failproofai policies --uninstall --scope project
```

---

## Configurazione

La configurazione delle policy si trova in `~/.failproofai/policies-config.json` (globale) o `.failproofai/policies-config.json` nel tuo progetto (per progetto).

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

**Tre ambiti di configurazione** vengono uniti automaticamente (progetto → locale → globale). Vedi [docs/configuration.mdx](docs/configuration.mdx) per le regole di unione complete.

---

## Policy integrate

| Policy | Descrizione | Configurabile |
|--------|-------------|:---:|
| `block-sudo` | Previeni che gli agenti eseguano comandi di sistema privilegiati | `allowPatterns` |
| `block-rm-rf` | Previeni l'eliminazione accidentale ricorsiva di file | `allowPaths` |
| `block-curl-pipe-sh` | Previeni che gli agenti inviino script non attendibili alla shell tramite pipe | |
| `block-failproofai-commands` | Previeni l'autodisininstallazione | |
| `sanitize-jwt` | Ferma i token JWT dal trapelare nel contesto dell'agente | |
| `sanitize-api-keys` | Ferma le chiavi API dal trapelare nel contesto dell'agente | `additionalPatterns` |
| `sanitize-connection-strings` | Ferma le credenziali del database dal trapelare nel contesto dell'agente | |
| `sanitize-private-key-content` | Redigi i blocchi di chiave privata PEM dall'output | |
| `sanitize-bearer-tokens` | Redigi i token Authorization Bearer dall'output | |
| `block-env-files` | Mantieni gli agenti lontani dalla lettura dei file .env | |
| `protect-env-vars` | Previeni che gli agenti stampino le variabili di ambiente | |
| `block-read-outside-cwd` | Mantieni gli agenti entro i confini del progetto | `allowPaths` |
| `block-secrets-write` | Previeni le scritture nei file di chiave privata e certificati | `additionalPatterns` |
| `block-push-master` | Previeni i push accidentali a main/master | `protectedBranches` |
| `block-work-on-main` | Mantieni gli agenti lontani dai rami protetti | `protectedBranches` |
| `block-force-push` | Previeni `git push --force` | |
| `warn-git-amend` | Ricorda agli agenti prima di modificare i commit | |
| `warn-git-stash-drop` | Ricorda agli agenti prima di eliminare gli stash | |
| `warn-all-files-staged` | Rileva `git add -A` accidentale | |
| `warn-destructive-sql` | Rileva DROP/DELETE SQL prima dell'esecuzione | |
| `warn-schema-alteration` | Rileva ALTER TABLE prima dell'esecuzione | |
| `warn-large-file-write` | Rileva scritture di file inaspettatamente grandi | `thresholdKb` |
| `warn-package-publish` | Rileva `npm publish` accidentale | |
| `warn-background-process` | Rileva avvii di processi in background non previsti | |
| `warn-global-package-install` | Rileva installazioni di pacchetti globali non previste | |
| …e altre | | |

Dettagli completi delle policy e riferimento dei parametri: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

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

### Funzioni helper per le decisioni

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
| `toolName` | `string` | Strumento richiamato (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parametri di input dello strumento |
| `payload` | `object` | Payload grezzo completo dell'evento |
| `session.cwd` | `string` | Directory di lavoro della sessione Claude Code |
| `session.sessionId` | `string` | Identificatore della sessione |
| `session.transcriptPath` | `string` | Percorso del file di trascrizione della sessione |

I hook personalizzati supportano importazioni locali transitive, async/await e accesso a `process.env`. Gli errori sono fail-open (registrati in `~/.failproofai/hook.log`, le policy integrate continuano). Vedi [docs/custom-hooks.mdx](docs/custom-hooks.mdx) per la guida completa.

### Policy basate su convenzione

Metti i file `*policies.{js,mjs,ts}` in `.failproofai/policies/` e vengono caricati automaticamente - nessun flag `--custom` o modifiche di configurazione necessarie. Funziona come i git hook: metti un file e basta.

```text
# Livello di progetto — commits in git, condiviso con il team
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Livello utente — personale, si applica a tutti i progetti
~/.failproofai/policies/my-policies.mjs
```

Entrambi i livelli si caricano (unione). I file vengono caricati alfabeticamente all'interno di ogni directory. Usa il prefisso `01-`, `02-`, ecc. per controllare l'ordine. Vedi [examples/convention-policies/](examples/convention-policies/) per esempi pronti all'uso.

---

## Telemetria

Failproof AI raccoglie telemetria di utilizzo anonima tramite PostHog per comprendere l'utilizzo delle funzioni. Nessun contenuto di sessione, nome di file, input di strumenti o informazioni personali viene mai inviato.

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
| [Dashboard](docs/dashboard.mdx) | Monitora le sessioni e verifica l'attività delle policy |
| [Architecture](docs/architecture.mdx) | Come funziona il sistema di hook |
| [Testing](docs/testing.mdx) | Eseguire i test e scrivere i nuovi |

### Esegui la documentazione localmente

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Apre il sito della documentazione Mintlify su `http://localhost:3000`. Il contenitore osserva i cambiamenti se monti la directory dei documenti:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Nota per i contributori di failproofai

Il file `.claude/settings.json` di questo repository utilizza `bun ./bin/failproofai.mjs --hook <EventType>` al posto del comando standard `npx -y failproofai`. Questo perché eseguire `npx -y failproofai` all'interno del progetto failproofai stesso crea un conflitto auto-referenziante.

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

Costruito e mantenuto da **ExosphereHost: Reliability Research Lab per i tuoi Agenti**. Aiutiamo aziende e startup a migliorare l'affidabilità dei loro agenti AI attraverso i nostri agenti, software e expertise. Scopri di più su [exosphere.host](https://exosphere.host).
