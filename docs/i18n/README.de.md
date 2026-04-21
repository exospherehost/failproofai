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

Der einfachste Weg, Richtlinien zu verwalten, die Ihre KI-Agenten zuverlässig, fokussiert und autonom am Laufen halten – für **Claude Code** & das **Agents SDK**.

- **30 integrierte Richtlinien** – Häufige Fehlerquellen bei Agenten werden direkt ab Werk abgefangen. Destruktive Befehle blockieren, Secret-Leaks verhindern, Agenten innerhalb der Projektgrenzen halten, Endlosschleifen erkennen und vieles mehr.
- **Benutzerdefinierte Richtlinien** – Schreiben Sie eigene Zuverlässigkeitsregeln in JavaScript. Nutzen Sie die `allow`/`deny`/`instruct`-API, um Konventionen durchzusetzen, Drift zu verhindern, Operationen abzusichern oder externe Systeme einzubinden.
- **Einfache Konfiguration** – Jede Richtlinie lässt sich ohne Code anpassen. Erlaubnislisten, geschützte Branches und Schwellenwerte pro Projekt oder global festlegen. Drei Konfigurationsebenen werden automatisch zusammengeführt.
- **Agent Monitor** – Sehen Sie, was Ihre Agenten gemacht haben, während Sie weg waren. Sitzungen durchsuchen, jeden Tool-Aufruf inspizieren und genau nachvollziehen, wo Richtlinien ausgelöst wurden.

Alles läuft lokal – keine Daten verlassen Ihren Rechner.

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

Öffnet `http://localhost:8020` – Sitzungen durchsuchen, Logs inspizieren, Richtlinien verwalten.

### 3. Aktive Richtlinien prüfen

```bash
failproofai policies
```

---

## Richtlinien-Installation

### Geltungsbereiche

| Bereich | Befehl | Schreibort |
|---------|--------|------------|
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

Die Richtlinienkonfiguration liegt in `~/.failproofai/policies-config.json` (global) oder `.failproofai/policies-config.json` in Ihrem Projekt (projektspezifisch).

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

**Drei Konfigurationsbereiche** werden automatisch zusammengeführt (Projekt → Lokal → Global). Vollständige Zusammenführungsregeln: [docs/configuration.mdx](docs/configuration.mdx).

---

## Integrierte Richtlinien

| Richtlinie | Beschreibung | Konfigurierbar |
|------------|--------------|:--------------:|
| `block-sudo` | Verhindert, dass Agenten privilegierte Systembefehle ausführen | `allowPatterns` |
| `block-rm-rf` | Verhindert versehentliches rekursives Löschen von Dateien | `allowPaths` |
| `block-curl-pipe-sh` | Verhindert, dass Agenten nicht vertrauenswürdige Skripte an die Shell weiterleiten | |
| `block-failproofai-commands` | Verhindert die Selbstdeinstallation | |
| `sanitize-jwt` | Verhindert, dass JWT-Tokens in den Agenten-Kontext gelangen | |
| `sanitize-api-keys` | Verhindert, dass API-Schlüssel in den Agenten-Kontext gelangen | `additionalPatterns` |
| `sanitize-connection-strings` | Verhindert, dass Datenbank-Zugangsdaten in den Agenten-Kontext gelangen | |
| `sanitize-private-key-content` | Entfernt PEM-Private-Key-Blöcke aus der Ausgabe | |
| `sanitize-bearer-tokens` | Entfernt Authorization-Bearer-Tokens aus der Ausgabe | |
| `block-env-files` | Hindert Agenten daran, .env-Dateien zu lesen | |
| `protect-env-vars` | Verhindert, dass Agenten Umgebungsvariablen ausgeben | |
| `block-read-outside-cwd` | Hält Agenten innerhalb der Projektgrenzen | `allowPaths` |
| `block-secrets-write` | Verhindert Schreibzugriffe auf Private-Key- und Zertifikatsdateien | `additionalPatterns` |
| `block-push-master` | Verhindert versehentliche Pushes auf main/master | `protectedBranches` |
| `block-work-on-main` | Hält Agenten von geschützten Branches fern | `protectedBranches` |
| `block-force-push` | Verhindert `git push --force` | |
| `warn-git-amend` | Erinnert Agenten vor dem Ändern von Commits | |
| `warn-git-stash-drop` | Erinnert Agenten vor dem Verwerfen von Stashes | |
| `warn-all-files-staged` | Erkennt versehentliches `git add -A` | |
| `warn-destructive-sql` | Erkennt DROP/DELETE-SQL vor der Ausführung | |
| `warn-schema-alteration` | Erkennt ALTER TABLE vor der Ausführung | |
| `warn-large-file-write` | Erkennt unerwartet große Datei-Schreibvorgänge | `thresholdKb` |
| `warn-package-publish` | Erkennt versehentliches `npm publish` | |
| `warn-background-process` | Erkennt unbeabsichtigte Hintergrundprozess-Starts | |
| `warn-global-package-install` | Erkennt unbeabsichtigte globale Paket-Installationen | |
| …und weitere | | |

Vollständige Richtlinien-Details und Parameterreferenz: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Benutzerdefinierte Richtlinien

Schreiben Sie eigene Richtlinien, um Agenten zuverlässig und fokussiert zu halten:

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
| `allow()` | Aktion erlauben |
| `allow(message)` | Aktion erlauben und informativen Kontext an Claude senden |
| `deny(message)` | Aktion blockieren; Nachricht wird Claude angezeigt |
| `instruct(message)` | Kontext zum Prompt von Claude hinzufügen; blockiert nicht |

### Kontext-Objekt (`ctx`)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Aufgerufenes Tool (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Eingabeparameter des Tools |
| `payload` | `object` | Vollständiger roher Event-Payload |
| `session.cwd` | `string` | Arbeitsverzeichnis der Claude Code-Sitzung |
| `session.sessionId` | `string` | Sitzungskennung |
| `session.transcriptPath` | `string` | Pfad zur Sitzungsprotokoll-Datei |

Benutzerdefinierte Hooks unterstützen transitive lokale Imports, async/await und Zugriff auf `process.env`. Fehler sind fail-open (werden in `~/.failproofai/hook.log` protokolliert, integrierte Richtlinien laufen weiter). Vollständige Anleitung: [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Konventionsbasierte Richtlinien

Legen Sie `*policies.{js,mjs,ts}`-Dateien in `.failproofai/policies/` ab, und sie werden automatisch geladen – ohne Flags oder Konfigurationsänderungen. Committen Sie das Verzeichnis in Git, und jedes Teammitglied erhält dieselben Qualitätsstandards automatisch.

```text
# Projektebene — in Git eingecheckt, mit dem Team geteilt
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Benutzerebene — persönlich, gilt für alle Projekte
~/.failproofai/policies/my-policies.mjs
```

Beide Ebenen werden geladen (Vereinigung). Dateien werden innerhalb jedes Verzeichnisses alphabetisch geladen. Präfixe wie `01-`, `02-` usw. steuern die Reihenfolge. Sobald Ihr Team neue Fehlerquellen entdeckt, fügen Sie eine Richtlinie hinzu und pushen – alle erhalten das Update beim nächsten Pull. Fertige Beispiele finden Sie unter [examples/convention-policies/](examples/convention-policies/).

---

## Telemetrie

Failproof AI erfasst anonyme Nutzungstelemetrie über PostHog, um die Funktionsnutzung zu verstehen. Es werden niemals Sitzungsinhalte, Dateinamen, Tool-Eingaben oder persönliche Informationen übermittelt.

Deaktivierung:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Dokumentation

| Leitfaden | Beschreibung |
|-----------|--------------|
| [Erste Schritte](docs/getting-started.mdx) | Installation und erster Einstieg |
| [Integrierte Richtlinien](docs/built-in-policies.mdx) | Alle 30 integrierten Richtlinien mit Parametern |
| [Benutzerdefinierte Richtlinien](docs/custom-policies.mdx) | Eigene Richtlinien schreiben |
| [Konfiguration](docs/configuration.mdx) | Konfigurationsdateiformat und Bereichs-Zusammenführung |
| [Dashboard](docs/dashboard.mdx) | Sitzungen überwachen und Richtlinienaktivität überprüfen |
| [Architektur](docs/architecture.mdx) | Funktionsweise des Hook-Systems |
| [Tests](docs/testing.mdx) | Tests ausführen und neue schreiben |

### Dokumentation lokal ausführen

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Öffnet die Mintlify-Dokumentationsseite unter `http://localhost:3000`. Der Container erkennt Änderungen, wenn Sie das Docs-Verzeichnis einbinden:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Hinweis für failproofai-Mitwirkende

Das `.claude/settings.json` dieses Repos verwendet `bun ./bin/failproofai.mjs --hook <EventType>` anstelle des üblichen `npx -y failproofai`-Befehls. Der Grund: Das Ausführen von `npx -y failproofai` innerhalb des failproofai-Projekts selbst führt zu einem selbstreferenzierenden Konflikt.

Für alle anderen Repos ist der empfohlene Ansatz `npx -y failproofai`, installiert über:

```bash
failproofai policies --install --scope project
```

## Mitwirken

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lizenz

Siehe [LICENSE](LICENSE).

---

Entwickelt und gepflegt von **ExosphereHost: Reliability Research Lab for Your Agents**. Wir helfen Unternehmen und Startups, die Zuverlässigkeit ihrer KI-Agenten durch eigene Agenten, Software und Expertise zu verbessern. Mehr erfahren unter [exosphere.host](https://exosphere.host).
