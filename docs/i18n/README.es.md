> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | **🇪🇸 Español** | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Traducciones**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

La forma más sencilla de gestionar políticas que mantienen a tus agentes de IA confiables, enfocados y funcionando de manera autónoma - para **Claude Code** y el **Agents SDK**.

- **30 Políticas integradas** - Detecta los fallos más comunes de los agentes desde el primer momento. Bloquea comandos destructivos, evita la fuga de secretos, mantiene a los agentes dentro de los límites del proyecto, detecta bucles y mucho más.
- **Políticas personalizadas** - Escribe tus propias reglas de fiabilidad en JavaScript. Usa la API `allow`/`deny`/`instruct` para aplicar convenciones, prevenir desvíos, controlar operaciones o integrarte con sistemas externos.
- **Configuración sencilla** - Ajusta cualquier política sin escribir código. Define listas de permisos, ramas protegidas y umbrales por proyecto o de forma global. La configuración en tres niveles se combina automáticamente.
- **Monitor de agentes** - Descubre qué hicieron tus agentes mientras estabas ausente. Navega por las sesiones, inspecciona cada llamada a herramientas y revisa exactamente dónde se activaron las políticas.

Todo se ejecuta localmente — ningún dato sale de tu máquina.

---

## Requisitos

- Node.js >= 20.9.0
- Bun >= 1.3.0 (opcional — solo necesario para desarrollo o compilación desde el código fuente)

---

## Instalación

```bash
npm install -g failproofai
# o
bun add -g failproofai
```

---

## Inicio rápido

### 1. Habilitar políticas globalmente

```bash
failproofai policies --install
```

Escribe las entradas de hook en `~/.claude/settings.json`. A partir de ahora, Claude Code invocará failproofai antes y después de cada llamada a herramientas.

### 2. Iniciar el panel de control

```bash
failproofai
```

Abre `http://localhost:8020` — navega por las sesiones, inspecciona los registros y gestiona las políticas.

### 3. Verificar qué está activo

```bash
failproofai policies
```

---

## Instalación de políticas

### Niveles

| Nivel | Comando | Dónde escribe |
|-------|---------|---------------|
| Global (por defecto) | `failproofai policies --install` | `~/.claude/settings.json` |
| Proyecto | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Local | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Instalar políticas específicas

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Eliminar políticas

```bash
failproofai policies --uninstall
# o para un nivel específico:
failproofai policies --uninstall --scope project
```

---

## Configuración

La configuración de políticas se almacena en `~/.failproofai/policies-config.json` (global) o en `.failproofai/policies-config.json` dentro de tu proyecto (por proyecto).

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

**Los tres niveles de configuración** se combinan automáticamente (proyecto → local → global). Consulta [docs/configuration.mdx](docs/configuration.mdx) para conocer las reglas completas de combinación.

---

## Políticas integradas

| Política | Descripción | Configurable |
|----------|-------------|:---:|
| `block-sudo` | Impide que los agentes ejecuten comandos de sistema con privilegios | `allowPatterns` |
| `block-rm-rf` | Previene la eliminación recursiva accidental de archivos | `allowPaths` |
| `block-curl-pipe-sh` | Impide que los agentes canalicen scripts no confiables hacia la shell | |
| `block-failproofai-commands` | Previene la autodesinstalación | |
| `sanitize-jwt` | Evita que tokens JWT se filtren al contexto del agente | |
| `sanitize-api-keys` | Evita que claves API se filtren al contexto del agente | `additionalPatterns` |
| `sanitize-connection-strings` | Evita que credenciales de base de datos se filtren al contexto del agente | |
| `sanitize-private-key-content` | Redacta bloques de clave privada PEM de la salida | |
| `sanitize-bearer-tokens` | Redacta tokens Authorization Bearer de la salida | |
| `block-env-files` | Impide que los agentes lean archivos .env | |
| `protect-env-vars` | Evita que los agentes impriman variables de entorno | |
| `block-read-outside-cwd` | Mantiene a los agentes dentro de los límites del proyecto | `allowPaths` |
| `block-secrets-write` | Previene escrituras en archivos de clave privada y certificados | `additionalPatterns` |
| `block-push-master` | Previene envíos accidentales a main/master | `protectedBranches` |
| `block-work-on-main` | Mantiene a los agentes fuera de las ramas protegidas | `protectedBranches` |
| `block-force-push` | Previene `git push --force` | |
| `warn-git-amend` | Avisa a los agentes antes de modificar commits | |
| `warn-git-stash-drop` | Avisa a los agentes antes de eliminar stashes | |
| `warn-all-files-staged` | Detecta `git add -A` accidentales | |
| `warn-destructive-sql` | Detecta sentencias DROP/DELETE SQL antes de ejecutarlas | |
| `warn-schema-alteration` | Detecta ALTER TABLE antes de ejecutarlos | |
| `warn-large-file-write` | Detecta escrituras de archivos inesperadamente grandes | `thresholdKb` |
| `warn-package-publish` | Detecta `npm publish` accidentales | |
| `warn-background-process` | Detecta lanzamientos no intencionados de procesos en segundo plano | |
| `warn-global-package-install` | Detecta instalaciones globales de paquetes no intencionadas | |
| …y más | | |

Detalles completos de políticas y referencia de parámetros: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Políticas personalizadas

Escribe tus propias políticas para mantener a los agentes fiables y enfocados:

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

Instala con:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Funciones de decisión

| Función | Efecto |
|---------|--------|
| `allow()` | Permite la operación |
| `allow(message)` | Permite y envía contexto informativo a Claude |
| `deny(message)` | Bloquea la operación; el mensaje se muestra a Claude |
| `instruct(message)` | Añade contexto al prompt de Claude; no bloquea |

### Objeto de contexto (`ctx`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Herramienta que se está invocando (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Parámetros de entrada de la herramienta |
| `payload` | `object` | Payload completo del evento en bruto |
| `session.cwd` | `string` | Directorio de trabajo de la sesión de Claude Code |
| `session.sessionId` | `string` | Identificador de sesión |
| `session.transcriptPath` | `string` | Ruta al archivo de transcripción de la sesión |

Los hooks personalizados admiten importaciones locales transitivas, async/await y acceso a `process.env`. Los errores son fail-open (registrados en `~/.failproofai/hook.log`; las políticas integradas continúan). Consulta [docs/custom-hooks.mdx](docs/custom-hooks.mdx) para la guía completa.

### Políticas basadas en convenciones

Coloca archivos `*policies.{js,mjs,ts}` en `.failproofai/policies/` y se cargarán automáticamente — sin indicadores ni cambios de configuración adicionales. Confirma el directorio en git y todos los miembros del equipo obtendrán los mismos estándares de calidad de forma automática.

```text
# Nivel de proyecto — confirmado en git, compartido con el equipo
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Nivel de usuario — personal, se aplica a todos los proyectos
~/.failproofai/policies/my-policies.mjs
```

Ambos niveles se cargan conjuntamente. Los archivos se cargan en orden alfabético dentro de cada directorio. Usa los prefijos `01-`, `02-`, etc. para controlar el orden. A medida que tu equipo descubra nuevos modos de fallo, añade una política y envíala — todos recibirán la actualización en su próximo pull. Consulta [examples/convention-policies/](examples/convention-policies/) para ver ejemplos listos para usar.

---

## Telemetría

Failproof AI recopila telemetría de uso anónima a través de PostHog para entender el uso de las funciones. Nunca se envía el contenido de las sesiones, nombres de archivos, entradas de herramientas ni información personal.

Para desactivarla:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentación

| Guía | Descripción |
|------|-------------|
| [Primeros pasos](docs/getting-started.mdx) | Instalación y primeros pasos |
| [Políticas integradas](docs/built-in-policies.mdx) | Las 30 políticas integradas con sus parámetros |
| [Políticas personalizadas](docs/custom-policies.mdx) | Escribe tus propias políticas |
| [Configuración](docs/configuration.mdx) | Formato del archivo de configuración y combinación de niveles |
| [Panel de control](docs/dashboard.mdx) | Monitoriza sesiones y revisa la actividad de las políticas |
| [Arquitectura](docs/architecture.mdx) | Cómo funciona el sistema de hooks |
| [Pruebas](docs/testing.mdx) | Ejecutar pruebas y escribir nuevas |

### Ejecutar la documentación localmente

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Abre el sitio de documentación Mintlify en `http://localhost:3000`. El contenedor detecta cambios si montas el directorio de documentación:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Nota para colaboradores de failproofai

El archivo `.claude/settings.json` de este repositorio utiliza `bun ./bin/failproofai.mjs --hook <EventType>` en lugar del comando estándar `npx -y failproofai`. Esto se debe a que ejecutar `npx -y failproofai` dentro del propio proyecto failproofai genera un conflicto de autorreferencia.

Para todos los demás repositorios, el enfoque recomendado es `npx -y failproofai`, instalado mediante:

```bash
failproofai policies --install --scope project
```

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licencia

Consulta [LICENSE](LICENSE).

---

Desarrollado y mantenido por **ExosphereHost: Reliability Research Lab for Your Agents**. Ayudamos a empresas y startups a mejorar la fiabilidad de sus agentes de IA a través de nuestros propios agentes, software y experiencia. Más información en [exosphere.host](https://exosphere.host).
