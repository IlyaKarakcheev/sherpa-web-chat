---
name: fast-integrate
description: Integrate published component Ready versions, update dependency manifests, and verify edge contracts in Cursor Component Factory. Use when updating component dependencies, testing integration edges, or when the user says /integrate, /fast-integrate.
---

# Cursor Component Factory: Integration & Edge Verification Stage (/integrate)

This skill guides the agent through integration iterations in `Cursor Component Factory`: updating exactly one published dependency to a verified `Ready` version, testing the edge contract, and recording `Integrated` status.

## Core Rules

1. Follow `fast-workflow/CORE_WORKFLOW.md` and `fast-workflow/INTEGRATION_REPO_WORKFLOW.md`.
2. Update exactly **one** dependency per task.
3. Component source code is **read-only**. Never edit component code inside the integration repo.
4. Do **NOT** record `Integrated` without explicit human approval.

## Workflow

### 1. Verify Prerequisites
- Confirm that provider version has `Ready` status and published release/tag.
- Verify contract schema exists in `contracts/`.

### 2. Update Dependency Manifest
- Update the version of the target provider in `package.json`, `requirements.txt`, `go.mod`, or project manifest.
- Update lock-file if applicable.

### 3. Execute Integration Tests
Run integration tests in `tests/integration/` verifying:
1. **Successful Communication:** Consumer sends valid payload → Provider handles correctly → Consumer processes response.
2. **Expected Failure:** Invalid payload → Provider responds with error code → Consumer handles gracefully.
3. **Regression:** Ensure neighboring integration edges are unaffected.
4. **1C (if applicable):** Test `.cfe` extension compatibility with target configuration using `Vanessa-Automation`.

### 4. Handle Discrepancies (if any)
If tests fail:
- **Stop immediately.** Do not hot-patch components locally.
- Report exact mismatch (expected vs actual), affected consumers, and repo that owns the fix.

### 5. Report & Request Approval
Show test evidence and ask:
> *"Интеграционные тесты связи <consumer> -> <provider> <version> успешно пройдены. Разрешаете записать статус Integrated в реестр?"*

Upon human approval:
1. Add the entry to `integrations/status.*`.
2. Update `README.md` (status, confirmed integration edges, instructions for launching the environment and running E2E tests).
3. Create the integration Git commit.
