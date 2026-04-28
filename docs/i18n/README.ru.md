> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | **🇷🇺 Русский** | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Переводы**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

Простейший способ управления политиками, которые делают ваших AI агентов надёжными, сосредоточенными на задаче и способными работать автономно — для **Claude Code**, **OpenAI Codex** и **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI в действии" width="800" />
</p>

## Поддерживаемые CLI агентов

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
  <strong>+ ещё скоро</strong>
</p>

> Установите хуки для одного или обоих: `failproofai policies --install --cli codex` (или `--cli claude codex`). Опустите `--cli`, чтобы автоматически обнаружить установленные CLI и получить приглашение.

- **39 встроенных политик** — перехватывайте распространённые режимы отказа агентов из коробки. Блокируйте деструктивные команды, предотвращайте утечку секретов, держите агентов в границах проекта, обнаруживайте циклы и многое другое.
- **Пользовательские политики** — напишите собственные правила надёжности на JavaScript. Используйте API `allow`/`deny`/`instruct` для соблюдения соглашений, предотвращения дрейфа, контроля операций или интеграции с внешними системами.
- **Простая конфигурация** — настраивайте любую политику без кода. Установите допустимые списки, защищённые ветки, пороги для проекта или глобально. Конфигурация с тремя областями автоматически объединяется.
- **Монитор агентов** — посмотрите, что делали ваши агенты, пока вас не было. Просматривайте сеансы, проверяйте каждый вызов инструмента и видите, где срабатывали политики.

Всё работает локально — никакие данные не покидают вашу машину.

---

## Требования

- Node.js >= 20.9.0
- Bun >= 1.3.0 (опционально — требуется только для разработки / сборки из исходного кода)

---

## Установка

```bash
npm install -g failproofai
# или
bun add -g failproofai
```

---

## Быстрый старт

### 1. Включите политики глобально

```bash
failproofai policies --install
```

Записывает записи хуков в `~/.claude/settings.json`. Claude Code теперь будет вызывать failproofai перед и после каждого вызова инструмента.

### 2. Запустите приборную панель

```bash
failproofai
```

Открывает `http://localhost:8020` — просматривайте сеансы, проверяйте логи, управляйте политиками.

### 3. Проверьте, что активно

```bash
failproofai policies
```

---

## Установка политик

### Области

| Область | Команда | Где записывается |
|---------|---------|------------------|
| Глобальная (по умолчанию) | `failproofai policies --install` | `~/.claude/settings.json` |
| Проект | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Локальная | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Установите конкретные политики

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Удалите политики

```bash
failproofai policies --uninstall
# или для конкретной области:
failproofai policies --uninstall --scope project
```

---

## Конфигурация

Конфигурация политики находится в `~/.failproofai/policies-config.json` (глобальная) или `.failproofai/policies-config.json` в вашем проекте (по проектам).

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

**Три области конфигурации** автоматически объединяются (проект → локальная → глобальная). Полные правила объединения см. в [docs/configuration.mdx](docs/configuration.mdx).

---

## Встроенные политики

| Политика | Описание | Настраивается |
|----------|---------|:---:|
| `block-sudo` | Предотвратить запуск агентами привилегированных системных команд | `allowPatterns` |
| `block-rm-rf` | Предотвратить случайное рекурсивное удаление файлов | `allowPaths` |
| `block-curl-pipe-sh` | Предотвратить подачу агентами ненадёжных скриптов в оболочку | |
| `block-failproofai-commands` | Предотвратить самоудаление | |
| `sanitize-jwt` | Остановить утечку токенов JWT в контекст агента | |
| `sanitize-api-keys` | Остановить утечку ключей API в контекст агента | `additionalPatterns` |
| `sanitize-connection-strings` | Остановить утечку учётных данных БД в контекст агента | |
| `sanitize-private-key-content` | Скрыть блоки приватных ключей PEM из вывода | |
| `sanitize-bearer-tokens` | Скрыть токены Authorization Bearer из вывода | |
| `block-env-files` | Удержать агентов от чтения файлов .env | |
| `protect-env-vars` | Предотвратить вывод переменных среды агентами | |
| `block-read-outside-cwd` | Держать агентов в границах проекта | `allowPaths` |
| `block-secrets-write` | Предотвратить запись в файлы приватных ключей и сертификатов | `additionalPatterns` |
| `block-push-master` | Предотвратить случайные отправки на main/master | `protectedBranches` |
| `block-work-on-main` | Удержать агентов от защищённых веток | `protectedBranches` |
| `block-force-push` | Предотвратить `git push --force` | |
| `warn-git-amend` | Напомнить агентам перед изменением коммитов | |
| `warn-git-stash-drop` | Напомнить агентам перед удалением stash | |
| `warn-all-files-staged` | Поймать случайный `git add -A` | |
| `warn-destructive-sql` | Поймать DROP/DELETE SQL перед выполнением | |
| `warn-schema-alteration` | Поймать ALTER TABLE перед выполнением | |
| `warn-large-file-write` | Поймать неожиданно большие записи файлов | `thresholdKb` |
| `warn-package-publish` | Поймать случайный `npm publish` | |
| `warn-background-process` | Поймать непреднамеренные запуски фоновых процессов | |
| `warn-global-package-install` | Поймать непреднамеренные глобальные установки пакетов | |
| …и др. | | |

Полные детали политик и справочник параметров: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Пользовательские политики

Напишите собственные политики, чтобы ваши агенты оставались надёжными и сосредоточенными на задаче:

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

Установите с помощью:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Помощники решений

| Функция | Эффект |
|---------|--------|
| `allow()` | Разрешить операцию |
| `allow(message)` | Разрешить и отправить информационный контекст Claude |
| `deny(message)` | Заблокировать операцию; сообщение показано Claude |
| `instruct(message)` | Добавить контекст в подсказку Claude; не блокирует |

### Объект контекста (`ctx`)

| Поле | Тип | Описание |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Вызываемый инструмент (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Параметры входа инструмента |
| `payload` | `object` | Полная полезная нагрузка события |
| `session.cwd` | `string` | Рабочий каталог сеанса Claude Code |
| `session.sessionId` | `string` | Идентификатор сеанса |
| `session.transcriptPath` | `string` | Путь к файлу транскрипта сеанса |

Пользовательские хуки поддерживают локальные импорты, async/await и доступ к `process.env`. Ошибки логируются как fail-open (в `~/.failproofai/hook.log`, встроенные политики продолжают работу). Полное руководство см. в [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Политики на основе соглашений

Поместите файлы `*policies.{js,mjs,ts}` в `.failproofai/policies/` и они автоматически загружаются — никаких флагов или изменений конфигурации не требуется. Закоммитьте каталог в git и все члены команды получат одинаковые стандарты качества автоматически.

```text
# Уровень проекта — закоммичено в git, используется командой
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Уровень пользователя — личное, применяется ко всем проектам
~/.failproofai/policies/my-policies.mjs
```

Оба уровня загружаются (объединение). Файлы загружаются в алфавитном порядке в каждом каталоге. Префиксируйте с `01-`, `02-` и т. д., чтобы контролировать порядок. По мере открытия новых режимов отказа добавьте политику и отправьте — каждый получит обновление при следующем pull. Готовые примеры см. в [examples/convention-policies/](examples/convention-policies/).

---

## Телеметрия

Failproof AI собирает анонимные данные телеметрии через PostHog для понимания использования функций. Содержимое сеанса, имена файлов, входные данные инструментов или личная информация никогда не отправляются.

Отключите:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Документация

| Руководство | Описание |
|-------------|---------|
| [Начало работы](docs/getting-started.mdx) | Установка и первые шаги |
| [Встроенные политики](docs/built-in-policies.mdx) | Все 39 встроенных политик с параметрами |
| [Пользовательские политики](docs/custom-policies.mdx) | Напишите собственные политики |
| [Конфигурация](docs/configuration.mdx) | Формат файла конфигурации и объединение областей |
| [Приборная панель](docs/dashboard.mdx) | Мониторинг сеансов и проверка активности политик |
| [Архитектура](docs/architecture.mdx) | Как работает система хуков |
| [Тестирование](docs/testing.mdx) | Запуск тестов и написание новых |

### Запустите документацию локально

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Открывает сайт документации Mintlify по адресу `http://localhost:3000`. Контейнер следит за изменениями, если вы смонтируете каталог документации:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Примечание для участников failproofai

`.claude/settings.json` этого репо использует `bun ./bin/failproofai.mjs --hook <EventType>` вместо стандартной команды `npx -y failproofai`. Это потому, что запуск `npx -y failproofai` внутри самого проекта failproofai создаёт конфликт самоссылки.

Для всех остальных репо рекомендуемый подход — `npx -y failproofai`, установленный через:

```bash
failproofai policies --install --scope project
```

## Участие

См. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Лицензия

См. [LICENSE](LICENSE).

---

Разработано и поддерживается компанией **ExosphereHost: Reliability Research Lab for Your Agents**. Мы помогаем предприятиям и стартапам улучшить надёжность своих AI агентов благодаря нашим собственным агентам, программному обеспечению и опыту. Узнайте больше на [exosphere.host](https://exosphere.host).
```
