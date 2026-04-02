# AGENTS.md

## Mission
This repository builds a Vietnam Legal AI product with one non-negotiable rule:
- Every legal answer must keep source traceability from final answer -> retrieved chunk -> law section -> raw source document.

## Source of truth
- Product source of truth: `legal_ai_6month_build_blueprint.md`.
- If implementation detail conflicts with the blueprint, open an ADR before changing behavior.

## Team assumptions
- Small startup team (1-2 engineers, 1 legal reviewer part-time, 1 content operator part-time).
- Scope discipline is mandatory: prefer corpus quality and answer safety over UI polish.

## Coding conventions
- Use TypeScript for app and services.
- Keep modules small and composable; avoid god services.
- Validate all external input at boundaries.
- Return structured errors with machine-readable codes.
- Add comments only when logic is non-obvious.
- No dead code, no commented-out blocks in production branches.

## Folder conventions
- `apps/web`: Next.js app (UI + API routes for lightweight endpoints).
- `apps/worker`: background ingestion and parsing jobs.
- `packages/db`: schema, migrations, query helpers.
- `packages/legal-core`: normalization, parsing, citation, retrieval utilities.
- `packages/ai`: prompt templates, answer assembly, guardrails.
- `docs`: architecture, corpus plans, ADRs.
- `infra`: deployment, cron/job config, environment templates.

## Migration rules
- All schema changes must be forward-only migrations.
- Never edit an already-applied migration.
- Each migration must include rollback notes in the migration description.
- Any legal corpus schema migration must preserve citation link fields.
- Add seed scripts only for deterministic local/dev fixtures.

## Testing rules
- Minimum required before merge:
  - Unit tests for parser/normalizer/chunker/citation mapper.
  - Integration tests for retrieval and answer assembly.
  - Schema tests for migration compatibility.
- Any change touching legal answer output must include:
  - Regression tests on a fixed legal QA set.
  - At least one test for low-confidence fallback behavior.
- Block release if citation traceability test fails.

## Quality and safety rules
- Do not fabricate legal references.
- If retrieval confidence is low, answer with uncertainty and next steps.
- High-risk topics must trigger safer response mode and escalation suggestion.
- Preserve effective-date awareness when selecting legal sources.

## No fake implementations
- No placeholder business logic in production code.
- If a temporary stub is unavoidable, it must:
  - Be marked with `TODO(<owner>, <date>, <tracking-id>)`.
  - Return explicit `NOT_IMPLEMENTED` behavior.
  - Be linked to an issue in `TASKS.md`.

## PR rules
- Keep PRs small and scoped to one domain.
- Include "what changed", "why", "risk", and "tests" in PR description.
- Any corpus model changes require reviewer from engineering + legal reviewer acknowledgment.

## Definition of done for legal answer features
- Retrieval logs stored.
- Citation IDs rendered and clickable.
- Source chain can be audited end-to-end.
- Guardrail behavior tested.
- Analytics event emitted for answer quality feedback.
