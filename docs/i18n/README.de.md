> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | **🇩🇪 Deutsch** | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Übersetzungen**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

Der einfachste Weg, Richtlinien zu verwalten, die deine KI-Agenten zuverlässig, aufgabenfokussiert und autonom laufen lassen – für **Claude Code** & das **Agents SDK**.

- **30 integrierte Richtlinien** – Häufige Fehlerursachen von Agenten werden sofort abgefangen. Destruktive Befehle werden blockiert, der Abfluss von Secrets verhindert, Agenten innerhalb der Projektgrenzen gehalten, Endlosschleifen erkannt und vieles mehr.
- **Benutzerdefinierte Richtlinien** – Schreibe eigene Zuverlässigkeitsregeln in JavaScript. Nutze die `allow`/`deny`/`instruct`-API, um Konventionen durchzusetzen, Abweichungen zu verhindern, Operationen zu steuern oder externe Systeme anzubinden.
- **Einfache Konfiguration** – Passe jede Richtlinie ohne Code-Änderungen an. Lege Allowlists, geschützte Branches und Schwellenwerte pro Projekt oder global fest. Drei Konfigurationsbereiche werden automatisch zusammengeführt.
- **Agent Monitor** – Sieh, was deine Agenten in deiner Abwesenheit getan haben. Durchsuche Sitzungen, untersuche jeden Tool-Aufruf und prüfe genau, wo Richtlinien ausgelöst wurden.

Alles läuft lokal – keine Daten verlassen deinen Rechner.

---

## Voraussetzungen

- Node.js >= 20.9.0
- Bun >= 1.3.0 (optional – wird nur für die Entwicklung / das Bauen aus dem Quellcode benötigt)

---

## Installation

```bash
npm install -g failproofai
# oder
bun add -g failproofai
```

---

## Schnellstart

### 1. Richtlinien global aktivieren

```bash
failproofai policies --install
```

Schreibt Hook-Einträge in `~/.claude/settings.json`. Claude Code ruft failproofai nun vor und nach jedem Tool-Aufruf auf.

### 2. Dashboard starten

```bash
failproofai
```

Öffnet `http://localhost:8020` – Sitzungen durchsuchen, Logs einsehen, Richtlinien verwalten.

### 3. Aktive Richtlinien prüfen

```bash
failproofai policies
```

---

## Richtlinieninstallation

### Bereiche

| Bereich | Befehl | Schreibziel |
|---------|--------|-------------|
| Global (Standard) | `failproofai policies --install` | `~/.claude/settings.json` |
| Projekt | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Lokal | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Bestimmte Richtlinien installieren

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Richtlinien entfernen

```bash
failproofai policies --uninstall
# oder für einen bestimmten Bereich:
failproofai policies --uninstall --scope project
```

---

## Konfiguration

Die Richtlinienkonfiguration liegt in `~/.failproofai/policies-config.json` (global) oder `.failproofai/policies-config.json` in deinem Projekt (projektspezifisch).

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

**Drei Konfigurationsbereiche** werden automatisch zusammengeführt (Projekt → Lokal → Global). Vollständige Zusammenführungsregeln: [docs/configuration.mdx](docs/configuration.mdx).

---

## Integrierte Richtlinien

| Richtlinie | Beschreibung | Konfigurierbar |
|-----------|--------------|:--------------:|
| `block-sudo` | Verhindert, dass Agenten privilegierte Systembefehle ausführen | `allowPatterns` |
| `block-rm-rf` | Verhindert versehentliches rekursives Löschen von Dateien | `allowPaths` |
| `block-curl-pipe-sh` | Verhindert, dass Agenten nicht vertrauenswürdige Skripte an die Shell pipen | |
| `block-failproofai-commands` | Verhindert die Selbst-Deinstallation | |
| `sanitize-jwt` | Verhindert, dass JWT-Tokens in den Agenten-Kontext gelangen | |
| `sanitize-api-keys` | Verhindert, dass API-Keys in den Agenten-Kontext gelangen | `additionalPatterns` |
| `sanitize-connection-strings` | Verhindert, dass Datenbank-Credentials in den Agenten-Kontext gelangen | |
| `sanitize-private-key-content` | Schwärzt PEM-Private-Key-Blöcke aus der Ausgabe | |
| `sanitize-bearer-tokens` | Schwärzt Authorization-Bearer-Tokens aus der Ausgabe | |
| `block-env-files` | Verhindert, dass Agenten .env-Dateien lesen | |
| `protect-env-vars` | Verhindert, dass Agenten Umgebungsvariablen ausgeben | |
| `block-read-outside-cwd` | Hält Agenten innerhalb der Projektgrenzen | `allowPaths` |
| `block-secrets-write` | Verhindert Schreibzugriffe auf Private-Key- und Zertifikatsdateien | `additionalPatterns` |
| `block-push-master` | Verhindert versehentliche Pushes auf main/master | `protectedBranches` |
| `block-work-on-main` | Hält Agenten von geschützten Branches fern | `protectedBranches` |
| `block-force-push` | Verhindert `git push --force` | |
| `warn-git-amend` | Erinnert Agenten vor dem Ändern von Commits | |
| `warn-git-stash-drop` | Erinnert Agenten vor dem Löschen von Stashes | |
| `warn-all-files-staged` | Fängt versehentliche `git add -A`-Aufrufe ab | |
| `warn-destructive-sql` | Fängt DROP/DELETE-SQL vor der Ausführung ab | |
| `warn-schema-alteration` | Fängt ALTER TABLE vor der Ausführung ab | |
| `warn-large-file-write` | Fängt unerwartet große Datei-Schreibvorgänge ab | `thresholdKb` |
| `warn-package-publish` | Fängt versehentliche `npm publish`-Aufrufe ab | |
| `warn-background-process` | Fängt unbeabsichtigte Hintergrundprozess-Starts ab | |
| `warn-global-package-install` | Fängt unbeabsichtigte globale Paketinstallationen ab | |
| …und weitere | | |

Vollständige Richtliniendetails und Parameterreferenz: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Benutzerdefinierte Richtlinien

Schreibe eigene Richtlinien, um Agenten zuverlässig und aufgabenfokussiert zu halten:

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

Installation mit:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Entscheidungs-Hilfsfunktionen

| Funktion | Wirkung |
|----------|---------|
| `allow()` | Erlaubt die Operation |
| `allow(message)` | Erlaubt und sendet informativen Kontext an Claude *(Beta)* |
| `deny(message)` | Blockiert die Operation; Nachricht wird Claude angezeigt |
| `instruct(message)` | Fügt Claude's Prompt Kontext hinzu; blockiert nicht |

### Kontextobjekt (`ctx`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Aufgerufenes Tool (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Eingabeparameter des Tools |
| `payload` | `object` | Vollständiger roher Event-Payload |
| `session.cwd` | `string` | Arbeitsverzeichnis der Claude Code-Sitzung |
| `session.sessionId` | `string` | Sitzungskennung |
| `session.transcriptPath` | `string` | Pfad zur Sitzungs-Transcript-Datei |

Benutzerdefinierte Hooks unterstützen transitive lokale Imports, async/await und Zugriff auf `process.env`. Fehler sind fail-open (werden in `~/.failproofai/hook.log` protokolliert, integrierte Richtlinien laufen weiter). Die vollständige Anleitung: [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

---

## Telemetrie

Failproof AI erfasst anonyme Nutzungstelemetrie über PostHog, um die Verwendung von Funktionen zu verstehen. Es werden zu keinem Zeitpunkt Sitzungsinhalte, Dateinamen, Tool-Eingaben oder personenbezogene Daten übermittelt.

Deaktivierung:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Dokumentation

| Leitfaden | Beschreibung |
|-----------|--------------|
| [Erste Schritte](docs/getting-started.mdx) | Installation und Einstieg |
| [Integrierte Richtlinien](docs/built-in-policies.mdx) | Alle 30 integrierten Richtlinien mit Parametern |
| [Benutzerdefinierte Richtlinien](docs/custom-policies.mdx) | Eigene Richtlinien schreiben |
| [Konfiguration](docs/configuration.mdx) | Konfigurationsdateiformat und Bereichszusammenführung |
| [Dashboard](docs/dashboard.mdx) | Sitzungen überwachen und Richtlinienaktivität prüfen |
| [Architektur](docs/architecture.mdx) | Funktionsweise des Hook-Systems |
| [Tests](docs/testing.mdx) | Tests ausführen und neue schreiben |

### Dokumentation lokal ausführen

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Öffnet die Mintlify-Dokumentationsseite unter `http://localhost:3000`. Der Container beobachtet Änderungen, wenn du das Docs-Verzeichnis einbindest:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Mitwirken

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lizenz

Siehe [LICENSE](LICENSE).
