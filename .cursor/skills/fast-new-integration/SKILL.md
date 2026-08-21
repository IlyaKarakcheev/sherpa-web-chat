---
name: fast-new-integration
description: Scaffold a standalone integration context repository according to Cursor Component Factory standards. Use when creating an integration repository, API gateway, or system assembly repo, or when the user says /new-integration or asks to create an integration repository.
---

# Cursor Component Factory: Integration Repository Initialization (/new-integration)

This skill guides the agent through bootstrapping a new, standalone integration repository according to `Cursor Component Factory` standards (`Integrated` verification lifecycle).

## Core Rules

1. Follow `fast-workflow/CORE_WORKFLOW.md` and `fast-workflow/INTEGRATION_REPO_WORKFLOW.md`.
2. The integration repository is **NOT for developing component business logic**. It stores dependency manifests, contract schemas, integration tests, and the `Integrated` status registry.
3. Component source code is read-only or consumed as published artifacts/packages.
4. Always initialize Git (branch `main`) and create the initial commit.

## Workflow

### 1. Gather Parameters

Identify or confirm from user prompt:
- **Integration Repo Name:** in `kebab-case` (e.g., `ecommerce-platform`, `api-gateway-integration`).
- **Purpose & Scope:** brief statement of the integrated system / gateway role.
- **Target Location:** target directory path (e.g., `d:\__ai-factory\projects\<name>` or `../<name>`).

### 2. Create Directory Structure

Create the required directories in the target integration folder:
- `contracts/api/`, `contracts/events/`, `contracts/domain/`
- `dependencies/` (stores manifests, e.g. `manifest.json`, `package.json`, `requirements.txt`)
- `integrations/` (stores status registry)
- `scenarios/` (end-to-end integration scenario definitions)
- `product/features/` (cross-system business scenarios)
- `tests/integration/` (integration test suites for component edges)

### 3. Generate Integration Registry (`integrations/status.yaml`)

Create `integrations/status.yaml`:

```yaml
# Реестр подтвержденных статусов Integrated
# Статус фиксируется только после явного одобрения человеком
# и успешного прогона позитивного и негативного сценариев.
#
# Пример записи:
# - consumer: "order-service v1.0.0"
#   provider: "billing-service v1.0.0"
#   contract: "contracts/api/discount-v1.yaml v1.0.0"
#   scenario: "scenarios/apply-discount.md"
#   checks:
#     success: "Test calculateDiscount_Success passed (200 OK)"
#     expectedFailure: "Test calculateDiscount_InvalidPromo passed (404 Not Found)"
#   status: "Integrated"
#   approvedByHuman: "Илья 2026-08-16"

integrations: []
```

### 4. Generate Starter Dependency Manifest

Create `dependencies/manifest.json`:

```json
{
  "name": "<integration-repo-name>",
  "version": "0.1.0",
  "description": "<purpose>",
  "dependencies": {}
}
```

### 5. Generate Starter README.md

Create `README.md`:

```markdown
# <integration-repo-name>

## Назначение
<Краткое описание назначения интеграционного контура / API Gateway / платформы>

## Статус интеграции и версия
- **Версия контура:** 0.1.0
- **Статус:** Prototype
- **Подтвержденные связи:** Нет

## Что нового в последней версии
- Начальная инициализация интеграционного контура.

## Инструкция по развертыванию окружения
<Команды развертывания локального стенда / Docker Compose / сервисов>

## Инструкция по запуску интеграционных тестов
<Команды запуска E2E и контрактных проверок>
```

### 6. Copy Cursor Rules & Fast-Workflow Guidelines

Copy into the integration repository root:
1. `.cursor/rules/` (`component-workflow.mdc`, `component-repo-workflow.mdc`, `integration-repo-workflow.mdc`).
2. `.cursor/skills/` (`fast-new-component`, `fast-new-integration`, `fast-spec`, `fast-implement`, `fast-integrate`).
3. `fast-workflow/` core documentation files.
4. `.gitignore`:

```text
**/node_modules/**
**/dist/**
**/build/**
**/coverage/**
*.log
**/*.secret
**/*.env*
```

### 7. Initialize Git & Make Initial Commit

1. Run `git init -b main` in the integration directory.
2. Run `git add .`
3. Run `git commit -m "Initial commit: scaffold <integration-repo-name> integration repository"`

### 8. Report to User

Provide a structured summary:
1. **Путь к созданному репозиторию:** (Full path).
2. **Структура:** `README.md`, `dependencies/`, `contracts/`, `integrations/status.yaml`, `scenarios/`, `tests/integration/`.
3. **Следующий шаг:**
   - Открыть репозиторий в Cursor: `cursor "<путь>"`.
   - Запустить первую интеграцию зависимости: `/integrate <consumer> <provider> <version>`.
