---
name: fast-implement
description: Execute isolated component implementation with Zero-Manual Mocks, automated test generation, and verification reporting in Cursor Component Factory. Use when implementing an approved specification or when the user says /implement, /fast-implement, or asks to implement a component.
---

# Cursor Component Factory: Implementation & Verification Stage (/implement)

This skill guides the agent through Step 4 of the `Cursor Component Factory` process: implementing component logic in strict isolation, generating mocks automatically from schemas, running mandatory tests, and reporting verified results.

## Core Rules

1. Follow `fast-workflow/CORE_WORKFLOW.md` and `fast-workflow/COMPONENT_REPO_WORKFLOW.md`.
2. Modify **ONLY** allowed paths: `src/`, `mocks/`, `tests/` of the current component repository.
3. External repositories and approved contracts in `contracts/` are **forbidden to change**.
4. **Zero-Manual Mocks:** Never ask the user to write boilerplate mocks. Generate mock servers (Prism/MSW) or fixtures (Faker/Zod, Polyfactory, YAxUnit) directly from `contracts/`.

## Workflow

### 1. Two-Tier Contracts & Zero-Manual Mocks Setup
- Verify Protocol Contract (`contracts/protocol/` or `contracts/front/`) and Domain Contract (`contracts/domain/`).
- Implement or update the in-repo mock suite (`mocks/`) representing domain business capabilities, valid responses, and typed error responses (`failed_parameter`).
- For REST/HTTP: configure or spin up mock servers from OpenAPI (`Prism` / `MSW` / FastAPI Mock Classes).
- For TS/Python: use schema-based factories and Mock suites.
- For 1C: create `YAxUnit` mock/spy definitions for external common modules.

### 2. Implement Business Logic
- Write clean, modular implementation code in `src/` (or `main.py`) matching the approved specification and contracts.
- Ensure strict type validation on all contract boundaries.

### 3. Implement & Run Tests
Write tests in `tests/` covering at least:
1. **Happy Path:** Valid input produces expected output matching contract.
2. **Invalid Input (400 / Validation Error):** Missing/invalid fields rejected cleanly.
3. **Dependency Failure & Rollback:** Upstream errors handled safely with FSM context rollback on `failed_parameter`.
4. **Empty Result (404 / Empty List):** No records found scenario.
5. **1C BDD (if 1C):** `Vanessa-Automation` `.feature` files in `tests/scenarios/`.

Run the test suite and ensure all tests pass.

### 4. Provide Structured Report
Format the response using this exact structure:
1. **Измененные файлы:** (List of modified files).
2. **Использованные контракты и версии:** (e.g. `contracts/api/discount-v1.yaml v1.0.0`).
3. **Результаты тестов:** (Commands run and test output summary).
4. **Сделанные предположения:** (Technical decisions made within scope).
5. **Оставшиеся риски / вопросы:** (Points for reviewer attention).
6. **Готовность:** Request human approval for `Ready` status.

### 5. Finalize Release (Upon Human Approval)
1. Update version and status to `Ready` in `COMPONENT.md`.
2. Update `README.md`:
   - Set current status `Ready` and version.
   - Add concise summary of changes to "Что нового в последней версии".
   - Ensure deployment and test instructions are up-to-date.
3. Create Git commit and release Git Tag.
