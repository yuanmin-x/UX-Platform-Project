# BUILD_PLAN.md — v0.1

## Goal

Implement the MVP incrementally so that every milestone is usable.

Do not build the entire spec at once.

## Milestone 0 — Repository setup

Create:
- Next.js app
- TypeScript
- Tailwind
- Supabase client
- XYFlow / React Flow
- linting / formatting
- basic app shell

Deliver:
- `/projects`
- `/projects/[projectId]`

## Milestone 1 — Persistence and core objects

Create migrations for:
- projects
- objects
- project_objects
- relationships
- project_members

Implement:
- create project
- create initial Business Problem
- create object
- attach object to project
- create relationship
- save graph position

Acceptance:
reload preserves project and graph.

## Milestone 2 — Graph UI

Implement:
- object card base component
- per-type icon/color config
- create node
- drag
- connect
- reverse edge
- optional edge label
- delete edge
- right-click menus
- auto-arrange
- fit view

Acceptance:
core reasoning graph can be built without Workspace.

## Milestone 3 — Workspace shell + navigation

Implement:
- Project persistent header
- breadcrumb
- Back
- Esc to Graph
- Navigator
- resizable/collapsible/hideable Navigator
- pin/unpin

Acceptance:
double-click node → Workspace → Back/breadcrumb/Esc all work reliably.

## Milestone 4 — Business Problem / RQ / Study shells

Implement Workspaces:
- Business Problem
- Research Question
- Study

Implement:
- Business Problem hierarchy
- RQ section
- Study creation
- studyType config
- RQ selection inside Study scope

Acceptance:
Study can connect to multiple RQs and Business Problems.

## Milestone 5 — Study Collection layer

Add tables:
- participants
- study_participants
- study_sessions
- recordings
- transcripts

Implement Collection views:

Interview / Usability:
- participant/session list
- status
- duration
- recording placeholder/upload reference
- transcript availability
- light note/comment

Survey:
- response totals
- completion rate
- drop-off
- channel
- simple line chart

A/B / Concept / Generic:
- minimal type-appropriate collection summary

Acceptance:
Collection clearly answers “what has been collected and how far are we?”

## Milestone 6 — Analysis coding workflow

Add:
- transcript_segments
- codes
- segment_codes
- tags
- segment_tags
- notes
- clips

Implement:
- video + transcript side by side
- timestamp sync
- text selection
- multi-selection
- highlight without code
- emotional tags
- coding search/create/select
- notes
- clip creation
- code-colored transcript markers
- Inspector order: text → tags → coding → notes → clip

Acceptance:
researcher can code a recorded session without leaving Analysis.

## Milestone 7 — Dataset

Implement:
- CSV/XLSX import
- Data table
- filter/sort/group
- simple descriptive summaries
- basic charts
- export

Acceptance:
imported data can be linked to Business Problem and analyzed lightly.

## Milestone 8 — Result

Implement:
- Result object
- create Result from internal analysis
- manual external Result import
- types: theme/chart/descriptive/t-test/ANOVA/regression/other
- Result Workspace
- compressed Graph preview

Acceptance:
external statistical Result can be stored without raw data.

## Milestone 9 — Insight + Evidence

Implement:
- Insight object
- evidence_items
- Add to Insight
- Create new / Existing Insight
- Evidence source navigation
- Insight statuses
- Lead/Owner finalization permission

Acceptance:
Insight can be built from evidence across Study/Dataset/Results.

## Milestone 10 — Synthesize Mode

Implement:
- Insight-focused view
- faint contextual relationships
- multiple Insight cards expanded
- Evidence chips
- drag move
- Alt/Option drag copy
- right-click move/copy/remove
- new empty Insight
- merge
- child Insight preservation
- exact evidence overlap
- Result preview in Inspector

Acceptance:
user can “tear down and rebuild” Insight evidence sets.

## Milestone 11 — Recommendation

Implement:
- Final Insight → Create Recommendation
- multiple Insight links
- implemented checkbox

## Milestone 12 — Project utility

Implement lightweight:
- Datasets page
- Calendar
- Deliverables
- Activity
- Team

## Development rule

At every milestone:
1. keep data model simple
2. write manual acceptance scenario
3. test navigation
4. test persistence
5. do not add future features “because they are easy”

If the product model becomes unclear, update specs before coding.
