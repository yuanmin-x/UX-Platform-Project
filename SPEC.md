# SPEC.md — UX Research Graph Workspace v0.1

## 1. Product definition

This product is a **graph-native UX research workspace**.

It organizes research around **business problems** rather than files, folders, isolated studies, or repositories.

Typical reasoning path:

`Business Problem → Research Question → Study / Dataset → Result → Insight → Recommendation`

This is not a mandatory pipeline. Direct links are allowed where they make sense.

Examples:
- Business Problem → Study
- Business Problem → Dataset
- Study → Insight
- Dataset → Result
- Multiple Studies / Datasets → one Insight
- Multiple Final Insights → one Recommendation

## 2. Core product principles

### Projects organize work
A Project is a collection and working boundary. It provides:
- Graph
- Datasets
- Calendar
- Deliverables
- Activity
- Team / permissions

A Project is not itself a research object.

### Graphs organize reasoning
The Graph is the default Project view. It visualizes objects and their relationships.

The Graph is used for:
- orientation
- organization
- navigation
- linking
- status scanning
- synthesis

Detailed research execution happens elsewhere.

### Workspaces execute work
Double-clicking an Object opens its Workspace.

Detailed actions such as:
- managing sessions
- reviewing recordings
- coding transcripts
- importing external results
- editing evidence
- writing recommendations

happen in Workspaces.

### Objects are persistent; views are temporary
Graph, Navigator, Focus Mode, Synthesize Mode, Calendar, and List View are all different views of the same underlying objects.

## 3. Project creation

Creating a Project requires:
- Project name
- one initial Business Problem

The Business Problem may be broad or provisional, e.g.:
- `Chatbot`
- `Improve onboarding`
- `Weekly NPS`
- `Business problem TBD`

After creation, the user enters the Project Graph.

## 4. Project-level navigation

Project Home contains:
- Graph
- Datasets
- Calendar
- Deliverables
- Activity
- Team

Project name remains visible at the top while the user is inside that Project.

## 5. Core object types

- Business Problem
- Research Question
- Study
- Dataset
- Result
- Insight
- Recommendation

Not top-level objects:
- Evidence
- Research Design
- Participant
- Recording
- Transcript
- Session
- Task
- Chart
- Code / Tag

## 6. Relationship model

Relationships are intentionally lightweight.

Store:
- source object
- target object
- direction
- optional user label

Do not require semantic relationship types such as `supports`, `answers`, `validates`, etc.

Users may name an edge for their own understanding.

## 7. Business Problem

Purpose: **Why are we doing this work?**

A Project may contain multiple Business Problems.

Business Problems may have children.

Recommended hierarchy:
- maximum 3 abstraction levels
- soft guideline of about 5 siblings per branch

A Study may connect to multiple Business Problems.

Lifecycle:
- Draft
- Active
- Off
- Solved
- Archived

`Off` appears visually muted.

## 8. Research Question

Purpose: **What do we need to learn?**

RQ exists so that every research concern does not become a Business Problem.

RQ is:
- a section inside Business Problem Workspace
- also a Graph object

A Study contains its RQ scope.

Do not make RQ the place where Studies are managed.

## 9. Study

Purpose: **How are we going to learn this?**

MVP study types:
- Generic Study
- Usability Test
- Interview
- Survey
- A/B Test
- Concept Testing

Lifecycle:
- Planned
- Running
- Analysis
- Completed

A Study may:
- address multiple RQs
- connect to multiple Business Problems
- link to participants
- assign working members
- produce internal study data
- produce Results

## 10. Dataset

Purpose: **What existing data do we have?**

Dataset is for externally imported or separately managed data.

Examples:
- NPS CSV
- support tickets
- historical survey export
- product analytics export
- customer reviews

Study-generated data does not automatically become a Dataset object.

Lifecycle:
- Imported
- In Use
- Archived

## 11. Analysis

Analysis exists inside Study or Dataset Workspaces.

Analysis is lightweight and should not try to replace SPSS, R, Python, NVivo, or Tableau.

Supported direction:
- transcript/video review
- highlight
- emotional tags
- coding
- notes
- clip creation
- filtering
- grouping
- simple descriptive summaries
- simple charts
- export

Advanced inferential statistics are done externally and imported as Results.

## 12. Result

Purpose: **What does the data show?**

Examples:
- Theme: 9/12 participants could not predict chatbot capability.
- NPS for new users declined from 41 to 29.
- `F(1,254)=7.212, p=.008`
- imported multi-series chart
- t-test output
- regression output

A Result may come from:
1. internal lightweight analysis
2. imported external analysis

Results should not contain raw external datasets.

Graph preview is compressed, e.g.:
- Themes (15)
- Charts (5)
- t-tests (1)
- ANOVA (2)

## 13. Insight

Purpose: **What does this mean for the business?**

Insight contains an Evidence Set.

Evidence is not a top-level object.

Lifecycle:
- Working
- Validated
- Final
- Archived

Maturity is a human decision.

Project permissions may restrict who can set an Insight to Final.

## 14. Recommendation

Purpose: **What should we do?**

Recommendation can only be created from Final Insight(s).

One Recommendation may link to multiple Final Insights.

MVP only needs:
- title
- description
- linked insights
- owner (optional)
- due date (optional)
- `Implemented` checkbox

Decision / implementation tracking is deferred.

## 15. Research Design Frame

Research Design is a Figma-like frame, not a searchable object.

It may group:
- Business Problems
- RQs
- Studies
- Datasets
- Results
- Insights

It may contain:
- context
- learning goals
- tasks
- limitations
- method
- participants
- notes

It supports future reporting / research brief generation.

## 16. Global Search and cross-Project reuse

Searchable:
- Business Problems
- RQs
- Studies
- Datasets
- Results
- Insights
- Recommendations

Not searchable as top-level global entities:
- Research Design Frames
- Evidence

Objects may be reused across Projects by reference rather than duplicated.

## 17. Core conceptual distinctions

| Concept | Question |
|---|---|
| Business Problem | Why are we researching this? |
| Research Question | What do we need to learn? |
| Study | How will we learn it? |
| Dataset | What existing data do we have? |
| Analysis | How do we inspect and organize data? |
| Result | What does the data show? |
| Insight | What does it mean for the business? |
| Recommendation | What should we do? |

## 18. Product principle

**Projects organize work. Graphs organize reasoning. Workspaces execute work.**

The core product must remain useful without AI.
