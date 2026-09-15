# MVP.md — v0.1

## Goal

Build the smallest usable version that proves:

1. Users can organize research around Business Problems using a Graph.
2. Users can move from Graph to Object Workspace without losing context.
3. Users can execute research inside Study/Dataset Workspaces.
4. Users can create Results, build Insights from Evidence, and recombine Evidence in Synthesize Mode.

## Core end-to-end scenario

1. Create Project.
2. Create initial Business Problem.
3. Add RQs.
4. Create a Study and associate RQs.
5. Optionally import a Dataset.
6. Track collection progress.
7. Analyze study/dataset content.
8. Create/import Results.
9. Create Insights and attach Evidence.
10. Enter Synthesize Mode.
11. Recompose Evidence across Insights.
12. Finalize an Insight.
13. Create a Recommendation.

## MVP phases

### Phase 0 — Foundation
- Next.js
- React
- TypeScript
- Tailwind
- Supabase/PostgreSQL
- XYFlow / React Flow
- authentication
- project routing
- persistence

### Phase 1 — Project + Graph
Must support:
- create Project
- initial Business Problem
- create all core object types
- drag nodes
- connect nodes
- reverse edge direction
- optional edge label
- auto-save positions
- reload persistence
- auto-arrange

### Phase 2 — Workspace navigation
Must support:
- double-click object → Workspace
- Graph contracts into Navigator
- Back
- breadcrumb
- Esc → full Graph
- resizable/collapsible/hideable Navigator
- pinned objects

### Phase 3 — Study + Dataset
Study types:
- Generic
- Usability Test
- Interview
- Survey
- A/B Test
- Concept Testing

Dataset import:
- CSV
- XLSX

Study/Dataset must support lightweight Analysis and export.

### Phase 4 — Results + Insights
- create Result from internal analysis
- manually import external Result
- Result types: theme, chart, descriptive statistic, t-test, ANOVA, regression, other
- create Insight
- attach Evidence
- open Evidence source
- Insight lifecycle

### Phase 5 — Synthesize Mode
- Insight-focused canvas
- multiple Insight cards expanded simultaneously
- evidence drag move
- Alt/Option drag copy
- right-click move/copy/remove
- create empty Insight
- merge Insights into new Insight
- keep source Insights as children
- exact Evidence overlap count
- Result preview in right Inspector

### Phase 6 — Recommendation + utility
- create Recommendation only from Final Insight(s)
- implemented checkbox
- lightweight Datasets page
- Calendar
- Deliverables
- Activity
- Team roles

## Explicitly out of scope

Do not implement for MVP:
- advanced AI synthesis
- AI merge recommendations
- semantic similarity
- AI-generated Insights
- advanced statistics
- live interview recording infrastructure
- automated transcription service
- participant recruitment marketplace
- incentive payments
- production A/B testing infrastructure
- feature flags
- traffic routing
- Jira replacement
- roadmap system
- decision tracking
- automatic recommendation impact tracking
- deep third-party integrations
- full report generation
- graph database infrastructure
- complex role/permission system

## MVP success test

After leaving a Project for one week, can a researcher return and understand within one minute:

- what problem they were solving
- what they decided to research
- how they researched it
- what the data showed
- what they concluded
- what they recommended

If yes, the MVP has proven the product concept.
