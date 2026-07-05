# CLAUDE.md

Behavioral guidelines for LLM-assisted development combining coding discipline with agent orchestration principles.

**Tradeoff:** These guidelines bias toward caution and reliability over speed. For trivial tasks, use judgment.

## 0. Developer Profile & Communication Style

**This developer is building their coding skills. Adapt every response accordingly.**

- **Plain language always.** Avoid jargon. When a technical term is unavoidable, define it briefly in plain English.
- **Code comments:** Write short, plain-English comments for any non-obvious logic — explain what it does and why. Skip comments on obvious lines, but when in doubt, err toward more explanation. Never use jargon in comments.
- **Errors and blockers:** Stop, explain the root cause in plain language first (one or two sentences), then fix it. Don't lead with a raw stack trace.
- **Exploratory questions** ("what should we do about X?"): Give one short recommendation with the main tradeoff — two to three sentences. Present it as a direction the user can redirect, not a decided plan. Don't implement until the user agrees.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it but don't delete it.

When your changes create orphans:
- Remove imports, variables, or functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" becomes "Write tests for invalid inputs, then make them pass"
- "Fix the bug" becomes "Write a test that reproduces it, then make it pass"
- "Refactor X" becomes "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] with verification [check]
2. [Step] with verification [check]
3. [Step] with verification [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. WAT Framework (Workflows, Agents, Tools)

**Separate concerns. Let deterministic code handle execution.**

This project uses the WAT architecture:
- **Workflows** (`workflows/`): Markdown SOPs defining objectives, inputs, tools, outputs, and edge cases
- **Agents** (your role): Intelligent coordination — read workflows, run tools in sequence, handle failures, ask clarifying questions
- **Tools** (`tools/`): Python scripts for deterministic execution — API calls, data transforms, file operations

Apply the separation principle:
- **Decision-making** belongs to you (routing, error handling, orchestration)
- **Execution** belongs to tested, deterministic scripts (API calls, data transforms, file operations)
- **Configuration** belongs to `.env` (API keys, credentials — never store secrets anywhere else)

When facing multi-step operations:
- Check `tools/` for existing scripts first — only create new ones when nothing suitable exists
- Don't create or overwrite workflows without asking
- If a tool uses paid API calls or credits, check before running again after errors

## 6. Learn From Failure

**Every error improves the system.**

When something breaks:
- Read the full error message and trace
- Fix the root cause, not symptoms
- Test the fix thoroughly
- Document what you learned (rate limits, timing quirks, unexpected behavior)
- Update relevant workflow or documentation so this never happens again

Example: Hit an API rate limit, discover a batch endpoint exists, refactor to use it, verify it works, document the pattern.

## 7. File Organisation

**Structure reflects intent.**

```
client/           # Frontend application
server/           # Backend application
  api/            # Route handlers
  models/         # Data models
  services/       # Business logic
  schemas/        # Request/response schemas
  connectors/     # Integration connectors (external systems, APIs)
tools/            # Python scripts for deterministic execution
workflows/        # Markdown SOPs defining what to do and how
migrations/       # Database migrations
tests/            # Mirrors server/ structure
.tmp/             # Temporary files (staging, intermediates) — disposable
.env              # API keys and environment variables (gitignored)
docs/             # PRD, architecture decisions, schema documentation
```

Principles:
- **Deliverables** go to cloud services or the database, not local files
- **Temporary files** in `.tmp/` are disposable and regenerated as needed
- **Credentials** in `.env` only (gitignored, never committed)
- If it's critical, it should be easily found. If it's temporary, it should be clearly marked.

---

## 8. Project Context

> **Instructions for Claude at project start:** Replace this entire section with project-specific context before beginning development. Use the subsections below as the required structure. The more precise the context here, the fewer clarifying questions you will need to ask.

**Read `docs/PRD.md` for the full product specification.**
**Read `docs/development-chunks.md` for the phased implementation plan.**

### 8.1 What This Is

<!-- What problem does this project solve? Who uses it? What is the core value proposition?
     Include: the domain, the primary user, the pilot or MVP scope, and any known extensibility requirements. -->

_[PLACEHOLDER: Project description]_

### 8.2 Domain & Data Model

<!-- Describe the key entities and how they relate. If there are multiple layers or tiers to the data model,
     name them and state what must exist before other layers can function.
     Example layers: organisational master data → domain master data → transaction/event data. -->

_[PLACEHOLDER: Key entities, relationships, and data layers]_

### 8.3 Hard Constraints

<!-- Non-negotiable architectural decisions. Do not deviate without explicit approval.
     Examples: identifier formats, graph vs. hierarchy, normalisation rules, staging requirements,
     integration patterns, access control scope. -->

_[PLACEHOLDER: Hard constraints and rationale for each]_

### 8.4 Data Standards

<!-- Which external standards govern data fields in this project?
     Examples: ISO 8601 for timestamps, ISO 3166-1 for countries, domain-specific codes or schemas. -->

_[PLACEHOLDER: Applicable data standards and where they apply]_

### 8.5 Formatting Conventions

<!-- Localisation and output formatting rules.
     Examples: number format, date format, CSV delimiter, currency representation, language register. -->

_[PLACEHOLDER: Formatting and localisation rules]_

### 8.6 Access Control

<!-- Who can do what? Describe the role model, scoping mechanism (e.g. org-unit, tenant),
     and any time-bound or context-bound access patterns. -->

_[PLACEHOLDER: Roles, scopes, and access control rules]_

### 8.7 Key Technical Decisions

<!-- Lock in the technology choices so Claude does not re-evaluate them per task.
     Add a rationale column so the choice can be defended or revisited in context. -->

| Decision | Choice | Rationale |
|----------|--------|-----------|
| _[e.g. Database]_ | _[e.g. PostgreSQL]_ | _[e.g. Strong relational integrity needed]_ |
| _[e.g. Auth]_ | _[e.g. Azure AD]_ | _[e.g. Existing SSO]_ |
| _[e.g. API style]_ | _[e.g. REST + OpenAPI]_ | _[e.g. Standard for ERP integrations]_ |

### 8.8 What Not to Build (Yet)

<!-- Phase 2+ features. List them explicitly so Claude does not implement them speculatively,
     but note that architecture must not prevent them from being added later. -->

_[PLACEHOLDER: Deferred features and why they are deferred]_

### 8.9 Common Pitfalls

<!-- Project-specific mistakes to avoid. Derive these from the data model, integration patterns,
     and access control rules above. Generic pitfalls belong in sections 1–6; this section is for
     domain- or architecture-specific traps. -->

_[PLACEHOLDER: Common pitfalls specific to this project's architecture and domain]_

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, clarifying questions come before implementation rather than after mistakes, the data model and architecture stay true to the decisions in section 8, and the system becomes more reliable over time.
