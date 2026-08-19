---
name: fast-spec
description: Formulate task specifications, COMPONENT.md passports, and machine-readable contract schemas (OpenAPI 3.1, Zod, AsyncAPI, 1C) for Cursor Component Factory. Use when starting a new component task or when the user says /spec, /fast-spec, or asks to specify/document a feature.
---

# Cursor Component Factory: Specification & Contract Stage (/spec)

This skill guides the agent through Steps 1 & 2 of the `Cursor Component Factory` process: turning user business intent into structured specifications, component passports, and machine-readable contract schemas without inventing business rules.

## Core Rules

1. Follow `fast-workflow/CORE_WORKFLOW.md` and `fast-workflow/COMPONENT_REPO_WORKFLOW.md`.
2. Do **NOT** write application code (`src/`) in this stage.
3. Do **NOT** invent business logic or guess edge-case behaviors. If something is ambiguous, record it under "Открытые вопросы" and ask the user directly.

## Workflow

### 1. Identify Component & Scope
- If `COMPONENT.md` does not exist, create it following the template from `fast-workflow/CORE_WORKFLOW.md`.
- Confirm component scope within current component repository.

### 2. Choose Two-Tier Contract Standard
Select and generate machine-readable standards for both contract tiers:
- **Tier 1 (Universal Protocol Contract):** `contracts/protocol/<protocol>-v1.yaml` (or `contracts/front/` for UI clients) specifying execution envelopes, capabilities manifests, and error rollback models (`failed_parameter`).
- **Tier 2 (Domain Capability Contract):** `contracts/domain/<service>-v1.yaml` (or `.py` / `.ts`) specifying domain methods, payloads, and business validation.
- **Async Events / Brokers:** `contracts/events/<topic>.json` (`AsyncAPI` / `JSON Schema`).
- **1C:Enterprise:** `contracts/protocol/` + `contracts/domain/` (OpenAPI / YAxUnit schema).

### 3. Generate Artifacts
1. **Feature Specification:** `product/features/<feature-name>.md` (user story, input/output, positive and negative scenarios).
2. **Two-Tier Contract Schemas:** Create schemas in `contracts/protocol/` and `contracts/domain/`.
3. **Draft In-Repo Mock Suite:** Prepare skeleton for paired mock suite in `mocks/` (Zero-Manual Mocks).
4. **Update COMPONENT.md:** List the new feature, associated contract versions, and set status to `Prototype`.

### 4. Ask Clarifying Questions
If business constraints (limits, permissions, timeouts, error codes) are unspecified:
- Present 1–3 precise questions to the user.
- Wait for human approval before proceeding to implementation.
