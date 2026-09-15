# CODEX_INSTRUCTIONS.md

Read this file before every substantial change.

## 1. Source of truth

Before implementing a feature, read:

- `SPEC.md`
- `MVP.md`
- the relevant object/workspace file
- `DESIGN_SYSTEM.md` for UI work

Do not invent new product concepts when an existing concept already covers the need.

If implementation reveals an unresolved product question, stop and update the spec first.

## 2. Product rules that must not drift

- Project is a **collection / working boundary**, not a research object.
- Graph is the primary **reasoning and navigation view**.
- Workspace is where execution happens.
- Core objects:
  - Business Problem
  - Research Question
  - Study
  - Dataset
  - Result
  - Insight
  - Recommendation
- Research Design is a **frame**, not an object.
- Evidence is **attached to Insight**, not a top-level object.
- Study-generated transcripts, recordings, sessions, responses, etc. are internal Study content and do not automatically become Dataset objects.
- `Result = What the data shows.`
- `Insight = What it means for the business.`
- Recommendation can only be created from Final Insight(s).
- The same object can be referenced in multiple Projects.
- Relationship semantics are not encoded as strict types. Store only source, target, direction, and optional user label.
- AI is optional and not part of the MVP core logic.

## 3. Navigation rules

- Project name remains visible while inside the Project.
- Double-click an object to open its Workspace.
- In Workspace View, Graph contracts into a minimal left-side Navigator.
- `Back` returns to the previous Workspace.
- Breadcrumb items are clickable and reflect entry context.
- `Esc` returns directly to full Project Graph View.
- Navigator can be resized, collapsed, hidden, and may show pinned objects.

## 4. Coding rules

Prefer:
- simple relational models
- shared object components
- configuration-driven variants
- progressive disclosure
- references instead of duplication

Avoid:
- creating separate architecture for each study type
- implementing a graph database for MVP
- building advanced statistics
- implementing full recruitment, live recording infrastructure, or experiment-serving systems
- adding feature flags or workflow types not defined in the specs

## 5. UI rules

- Professional tool aesthetic, not playful whiteboard.
- Low saturation, light neutral background, minimal shadow.
- Consistent object card structure.
- Inspector is preferred over modal dialogs.
- Graph nodes should stay compact.
- Session/Collection is for execution and progress.
- Analysis is where coding/highlighting/tagging happens.
- Synthesize Mode is where Insight evidence sets are reorganized.

## 6. Before merging a change

Check:

1. Is the feature in `MVP.md`?
2. Does it preserve Graph ↔ Workspace navigation?
3. Is the concept an Object, internal workspace content, Evidence, or a View?
4. Are we duplicating data that should be referenced?
5. Does it preserve cross-Project reuse?
6. Does it violate `Result` vs `Insight` boundaries?
7. Does it introduce AI where deterministic behavior is sufficient?
