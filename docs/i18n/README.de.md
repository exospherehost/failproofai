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

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in Aktion" width="800" />
</p>

- **32 eingebaute Richtlinien** – Häufige Ausfallmuster von Agenten werden sofort abgefangen. Destruktive Befehle blockieren, Secret-Leaks verhindern, Agenten innerhalb der Projektgrenzen halten, Schleifen erkennen und vieles mehr.
- **Benutzerdefinierte Richtlinien** – Schreiben Sie eigene Zuverlässigkeitsregeln in JavaScript. Nutzen Sie die `allow`/`deny`/`instruct`-API, um Konventionen durchzusetzen, Abweichungen zu verhindern, Operationen abzusichern oder externe Systeme einzubinden.
- **Einfache Konfiguration** – Jede Richtlinie lässt sich ohne Code-Änderungen anpassen. Allowlists, geschützte Branches und Schwellenwerte können pro Projekt oder global festgelegt werden. Drei Konfigurationsebenen werden automatisch zusammengeführt.
- **Agent Monitor** – Sehen Sie, was Ihre Agenten während Ihrer Abwesenheit getan haben. Sitzungen durchsuchen, jeden Tool-Aufruf inspizieren und genau nachvollziehen, wo Richtlinien ausgelöst wurden.

Alles läuft lokal – keine Daten verlassen Ihren Rechner.

---

## Voraussetzungen

- Node.js >= 20.9.0
- Bun >= 1.3.0 (optional – nur für die Entwicklung / das Bauen aus dem Quellcode erforderlich)

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

## Richtlinieninstallation

### Geltungsbereiche

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

Die Richtlinienkonfiguration befindet sich in `~/.failproofai/policies-config.json` (global) oder `.failproofai/policies-config.json` in Ihrem Projekt (projektbezogen).

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

**Drei Konfigurationsebenen** werden automatisch zusammengeführt (Projekt → Lokal → Global). Vollständige Merge-Regeln finden Sie unter [docs/configuration.mdx](docs/configuration.mdx).

---

## Eingebaute Richtlinien

| Richtlinie | Beschreibung | Konfigurierbar |
|------------|-------------|:---:|
| `block-sudo` | Verhindert, dass Agenten privilegierte Systembefehle ausführen | `allowPatterns` |
| `block-rm-rf` | Verhindert versehentliches rekursives Löschen von Dateien | `allowPaths` |
| `block-curl-pipe-sh` | Verhindert, dass Agenten nicht vertrauenswürdige Skripte in die Shell pipen | |
| `block-failproofai-commands` | Verhindert die Selbstdeinstallation | |
| `sanitize-jwt` | Verhindert, dass JWT-Tokens in den Agenten-Kontext gelangen | |
| `sanitize-api-keys` | Verhindert, dass API-Schlüssel in den Agenten-Kontext gelangen | `additionalPatterns` |
| `sanitize-connection-strings` | Verhindert, dass Datenbank-Zugangsdaten in den Agenten-Kontext gelangen | |
| `sanitize-private-key-content` | Entfernt PEM-Private-Key-Blöcke aus der Ausgabe | |
| `sanitize-bearer-tokens` | Entfernt Authorization-Bearer-Tokens aus der Ausgabe | |
| `block-env-files` | Verhindert, dass Agenten .env-Dateien lesen | |
| `protect-env-vars` | Verhindert, dass Agenten Umgebungsvariablen ausgeben | |
| `block-read-outside-cwd` | Hält Agenten innerhalb der Projektgrenzen | `allowPaths` |
| `block-secrets-write` | Verhindert Schreibzugriffe auf Private-Key- und Zertifikatsdateien | `additionalPatterns` |
| `block-push-master` | Verhindert versehentliche Pushes auf main/master | `protectedBranches` |
| `block-work-on-main` | Hält Agenten von geschützten Branches fern | `protectedBranches` |
| `block-force-push` | Verhindert `git push --force` | |
| `warn-git-amend` | Erinnert Agenten vor dem Ändern von Commits | |
| `warn-git-stash-drop` | Erinnert Agenten vor dem Löschen von Stashes | |
| `warn-all-files-staged` | Erkennt versehentliches `git add -A` | |
| `warn-destructive-sql` | Erkennt DROP/DELETE-SQL vor der Ausführung | |
| `warn-schema-alteration` | Erkennt ALTER TABLE vor der Ausführung | |
| `warn-large-file-write` | Erkennt unerwartet große Datei-Schreibvorgänge | `thresholdKb` |
| `warn-package-publish` | Erkennt versehentliches `npm publish` | |
| `warn-background-process` | Erkennt unbeabsichtigtes Starten von Hintergrundprozessen | |
| `warn-global-package-install` | Erkennt unbeabsichtigte globale Paketinstallationen | |
| …und mehr | | |

Vollständige Richtliniendetails und Parameterreferenz: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Benutzerdefinierte Richtlinien

Schreiben Sie eigene Richtlinien, um Agenten zuverlässig und auf Kurs zu halten:

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

### Entscheidungs-Helfer

| Funktion | Wirkung |
|----------|---------|
| `allow()` | Operation erlauben |
| `allow(message)` | Operation erlauben und informativen Kontext an Claude senden |
| `deny(message)` | Operation blockieren; Nachricht wird Claude angezeigt |
| `instruct(message)` | Kontext zum Prompt von Claude hinzufügen; blockiert nicht |

### Kontextobjekt (`ctx`)

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Aufgerufenes Tool (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Eingabeparameter des Tools |
| `payload` | `object` | Vollständige rohe Event-Payload |
| `session.cwd` | `string` | Arbeitsverzeichnis der Claude Code-Sitzung |
| `session.sessionId` | `string` | Sitzungskennung |
| `session.transcriptPath` | `string` | Pfad zur Sitzungstranskriptionsdatei |

Benutzerdefinierte Hooks unterstützen transitive lokale Imports, async/await und Zugriff auf `process.env`. Fehler sind fail-open (werden in `~/.failproofai/hook.log` protokolliert, eingebaute Richtlinien laufen weiter). Die vollständige Anleitung finden Sie unter [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Konventionsbasierte Richtlinien

Legen Sie `*policies.{js,mjs,ts}`-Dateien in `.failproofai/policies/` ab und sie werden automatisch geladen – ohne Flags oder Konfigurationsänderungen. Committen Sie das Verzeichnis in Git, und alle Teammitglieder erhalten automatisch dieselben Qualitätsstandards.

```text
# Projektebene — in Git eingecheckt, mit dem Team geteilt
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Benutzerebene — persönlich, gilt für alle Projekte
~/.failproofai/policies/my-policies.mjs
```

Beide Ebenen werden geladen (Vereinigung). Dateien werden innerhalb jedes Verzeichnisses alphabetisch geladen. Verwenden Sie Präfixe wie `01-`, `02-` usw., um die Reihenfolge zu steuern. Wenn Ihr Team neue Ausfallmuster entdeckt, fügen Sie einfach eine Richtlinie hinzu und pushen – alle erhalten das Update beim nächsten Pull. Fertige Beispiele finden Sie unter [examples/convention-policies/](examples/convention-policies/).

---

## Telemetrie

Failproof AI erfasst anonyme Nutzungstelemetrie über PostHog, um die Verwendung von Funktionen zu verstehen. Es werden niemals Sitzungsinhalte, Dateinamen, Tool-Eingaben oder persönliche Informationen übermittelt.

Deaktivieren:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Dokumentation

| Leitfaden | Beschreibung |
|-----------|-------------|
| [Erste Schritte](docs/getting-started.mdx) | Installation und erster Einstieg |
| [Eingebaute Richtlinien](docs/built-in-policies.mdx) | Alle 32 eingebauten Richtlinien mit Parametern |
| [Benutzerdefinierte Richtlinien](docs/custom-policies.mdx) | Eigene Richtlinien schreiben |
| [Konfiguration](docs/configuration.mdx) | Konfigurationsdateiformat und Bereichs-Merging |
| [Dashboard](docs/dashboard.mdx) | Sitzungen überwachen und Richtlinienaktivität überprüfen |
| [Architektur](docs/architecture.mdx) | Wie das Hook-System funktioniert |
| [Tests](docs/testing.mdx) | Tests ausführen und neue schreiben |

### Dokumentation lokal ausführen

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Öffnet die Mintlify-Dokumentationsseite unter `http://localhost:3000`. Der Container überwacht Änderungen, wenn Sie das Dokumentationsverzeichnis einbinden:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Hinweis für failproofai-Mitwirkende

Die `.claude/settings.json` dieses Repositories verwendet `bun ./bin/failproofai.mjs --hook <EventType>` anstelle des üblichen `npx -y failproofai`-Befehls. Der Grund dafür ist, dass die Ausführung von `npx -y failproofai` innerhalb des failproofai-Projekts selbst einen selbstreferenzierenden Konflikt erzeugt.

Für alle anderen Repositories ist der empfohlene Ansatz `npx -y failproofai`, installiert über:

```bash
failproofai policies --install --scope project
```

## Mitwirken

Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lizenz

Siehe [LICENSE](LICENSE).

---

Entwickelt und gepflegt von **ExosphereHost: Reliability Research Lab for Your Agents**. Wir helfen Unternehmen und Startups, die Zuverlässigkeit ihrer KI-Agenten durch eigene Agenten, Software und Expertise zu verbessern. Mehr erfahren Sie unter [exosphere.host](https://exosphere.host).
