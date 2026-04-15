> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | **🇫🇷 Français** | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Traductions** : [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

La façon la plus simple de gérer des politiques qui maintiennent vos agents IA fiables, concentrés sur leur tâche et autonomes — pour **Claude Code** et le **Agents SDK**.

- **30 politiques intégrées** - Détectez les modes de défaillance courants des agents dès l'installation. Bloquez les commandes destructrices, prévenez les fuites de secrets, maintenez les agents dans les limites du projet, détectez les boucles, et bien plus.
- **Politiques personnalisées** - Écrivez vos propres règles de fiabilité en JavaScript. Utilisez l'API `allow`/`deny`/`instruct` pour appliquer des conventions, prévenir la dérive, contrôler les opérations ou vous intégrer à des systèmes externes.
- **Configuration simplifiée** - Ajustez n'importe quelle politique sans écrire de code. Définissez des listes d'autorisation, des branches protégées et des seuils par projet ou globalement. La configuration à trois niveaux est fusionnée automatiquement.
- **Moniteur d'agents** - Voyez ce que vos agents ont fait pendant votre absence. Parcourez les sessions, inspectez chaque appel d'outil et examinez précisément où les politiques se sont déclenchées.

Tout s'exécute localement — aucune donnée ne quitte votre machine.

---

## Prérequis

- Node.js >= 20.9.0
- Bun >= 1.3.0 (optionnel — nécessaire uniquement pour le développement / la compilation depuis les sources)

---

## Installation

```bash
npm install -g failproofai
# or
bun add -g failproofai
```

---

## Démarrage rapide

### 1. Activer les politiques globalement

```bash
failproofai policies --install
```

Écrit les entrées de hook dans `~/.claude/settings.json`. Claude Code invoquera désormais failproofai avant et après chaque appel d'outil.

### 2. Lancer le tableau de bord

```bash
failproofai
```

Ouvre `http://localhost:8020` — parcourez les sessions, inspectez les journaux, gérez les politiques.

### 3. Vérifier ce qui est actif

```bash
failproofai policies
```

---

## Installation des politiques

### Niveaux de portée

| Portée | Commande | Fichier modifié |
|--------|---------|-----------------|
| Globale (par défaut) | `failproofai policies --install` | `~/.claude/settings.json` |
| Projet | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Locale | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Installer des politiques spécifiques

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Supprimer des politiques

```bash
failproofai policies --uninstall
# ou pour une portée spécifique :
failproofai policies --uninstall --scope project
```

---

## Configuration

La configuration des politiques se trouve dans `~/.failproofai/policies-config.json` (globale) ou `.failproofai/policies-config.json` dans votre projet (par projet).

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

**Les trois niveaux de configuration** sont fusionnés automatiquement (projet → local → global). Consultez [docs/configuration.mdx](docs/configuration.mdx) pour les règles de fusion complètes.

---

## Politiques intégrées

| Politique | Description | Configurable |
|--------|-------------|:---:|
| `block-sudo` | Empêche les agents d'exécuter des commandes système privilégiées | `allowPatterns` |
| `block-rm-rf` | Empêche la suppression récursive accidentelle de fichiers | `allowPaths` |
| `block-curl-pipe-sh` | Empêche les agents de rediriger des scripts non fiables vers le shell | |
| `block-failproofai-commands` | Empêche la désinstallation automatique | |
| `sanitize-jwt` | Stoppe la fuite des tokens JWT dans le contexte de l'agent | |
| `sanitize-api-keys` | Stoppe la fuite des clés API dans le contexte de l'agent | `additionalPatterns` |
| `sanitize-connection-strings` | Stoppe la fuite des identifiants de base de données dans le contexte de l'agent | |
| `sanitize-private-key-content` | Masque les blocs de clés privées PEM dans la sortie | |
| `sanitize-bearer-tokens` | Masque les tokens Authorization Bearer dans la sortie | |
| `block-env-files` | Empêche les agents de lire les fichiers .env | |
| `protect-env-vars` | Empêche les agents d'afficher les variables d'environnement | |
| `block-read-outside-cwd` | Maintient les agents dans les limites du projet | `allowPaths` |
| `block-secrets-write` | Empêche l'écriture dans les fichiers de clés privées et de certificats | `additionalPatterns` |
| `block-push-master` | Empêche les push accidentels vers main/master | `protectedBranches` |
| `block-work-on-main` | Maintient les agents hors des branches protégées | `protectedBranches` |
| `block-force-push` | Empêche `git push --force` | |
| `warn-git-amend` | Rappelle aux agents avant d'amender des commits | |
| `warn-git-stash-drop` | Rappelle aux agents avant de supprimer des stashes | |
| `warn-all-files-staged` | Détecte les `git add -A` accidentels | |
| `warn-destructive-sql` | Détecte les instructions SQL DROP/DELETE avant exécution | |
| `warn-schema-alteration` | Détecte les ALTER TABLE avant exécution | |
| `warn-large-file-write` | Détecte les écritures de fichiers anormalement volumineux | `thresholdKb` |
| `warn-package-publish` | Détecte les `npm publish` accidentels | |
| `warn-background-process` | Détecte les lancements involontaires de processus en arrière-plan | |
| `warn-global-package-install` | Détecte les installations involontaires de paquets globaux | |
| …et plus encore | | |

Détails complets des politiques et référence des paramètres : [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Politiques personnalisées

Écrivez vos propres politiques pour maintenir les agents fiables et concentrés sur leur tâche :

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

Installez avec :

```bash
failproofai policies --install --custom ./my-policies.js
```

### Fonctions de décision

| Fonction | Effet |
|----------|--------|
| `allow()` | Autorise l'opération |
| `allow(message)` | Autorise et envoie un contexte informatif à Claude *(bêta)* |
| `deny(message)` | Bloque l'opération ; le message est affiché à Claude |
| `instruct(message)` | Ajoute du contexte au prompt de Claude ; ne bloque pas |

### Objet contexte (`ctx`)

| Champ | Type | Description |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Outil appelé (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Paramètres d'entrée de l'outil |
| `payload` | `object` | Charge utile brute complète de l'événement |
| `session.cwd` | `string` | Répertoire de travail de la session Claude Code |
| `session.sessionId` | `string` | Identifiant de session |
| `session.transcriptPath` | `string` | Chemin vers le fichier de transcription de la session |

Les hooks personnalisés prennent en charge les imports locaux transitifs, async/await et l'accès à `process.env`. Les erreurs sont en mode fail-open (journalisées dans `~/.failproofai/hook.log`, les politiques intégrées continuent). Consultez [docs/custom-hooks.mdx](docs/custom-hooks.mdx) pour le guide complet.

### Politiques basées sur les conventions (v0.0.2-beta.7+)

Déposez des fichiers `*policies.{js,mjs,ts}` dans `.failproofai/policies/` et ils sont chargés automatiquement — aucun indicateur `--custom` ni modification de configuration n'est nécessaire. Fonctionne comme les hooks git : déposez un fichier, ça marche tout simplement.

```text
# Niveau projet — validé dans git, partagé avec l'équipe
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Niveau utilisateur — personnel, s'applique à tous les projets
~/.failproofai/policies/my-policies.mjs
```

Les deux niveaux sont chargés (union). Les fichiers sont chargés par ordre alphabétique dans chaque répertoire. Préfixez avec `01-`, `02-`, etc. pour contrôler l'ordre. Consultez [examples/convention-policies/](examples/convention-policies/) pour des exemples prêts à l'emploi.

---

## Télémétrie

Failproof AI collecte une télémétrie d'utilisation anonyme via PostHog afin de comprendre l'utilisation des fonctionnalités. Aucun contenu de session, nom de fichier, entrée d'outil ni information personnelle n'est jamais transmis.

Pour la désactiver :

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Démarrage](docs/getting-started.mdx) | Installation et premiers pas |
| [Politiques intégrées](docs/built-in-policies.mdx) | Les 30 politiques intégrées avec leurs paramètres |
| [Politiques personnalisées](docs/custom-policies.mdx) | Écrire vos propres politiques |
| [Configuration](docs/configuration.mdx) | Format du fichier de configuration et fusion des portées |
| [Tableau de bord](docs/dashboard.mdx) | Surveiller les sessions et examiner l'activité des politiques |
| [Architecture](docs/architecture.mdx) | Fonctionnement du système de hooks |
| [Tests](docs/testing.mdx) | Exécuter les tests et en écrire de nouveaux |

### Lancer la documentation localement

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Ouvre le site de documentation Mintlify sur `http://localhost:3000`. Le conteneur surveille les modifications si vous montez le répertoire docs :

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Note pour les contributeurs de failproofai

Le fichier `.claude/settings.json` de ce dépôt utilise `bun ./bin/failproofai.mjs --hook <EventType>` à la place de la commande standard `npx -y failproofai`. En effet, exécuter `npx -y failproofai` à l'intérieur même du projet failproofai crée un conflit d'auto-référencement.

Pour tous les autres dépôts, l'approche recommandée est `npx -y failproofai`, installée via :

```bash
failproofai policies --install --scope project
```

## Contribuer

Consultez [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licence

Consultez [LICENSE](LICENSE).

---

Créé et maintenu par **ExosphereHost : Reliability Research Lab for Your Agents**. Nous aidons les entreprises et les startups à améliorer la fiabilité de leurs agents IA grâce à nos propres agents, logiciels et expertises. En savoir plus sur [exosphere.host](https://exosphere.host).
