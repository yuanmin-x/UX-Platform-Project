# WORKSPACES.md

## 1. Shared Workspace layout

Top to bottom:
1. Persistent Project header
2. Breadcrumb / Back / Object header
3. Toolbar row
4. Main content area
5. Right-side Inspector
6. Left Navigator when Workspace is open

Project name stays visible.

Graph does not zoom into the object. It contracts into Navigator.

## 2. Business Problem Workspace

Tabs:
- Overview
- Research Questions
- Related Objects
- Activity

RQ section is lightweight.
Do not make RQ a study-management surface.

## 3. Research Question Workspace

Tabs:
- Overview
- Related Studies
- Activity

Related Studies is primarily navigational.

## 4. Study Workspace

Recommended top-level structure:
- Overview
- Work
- Results
- Files
- Activity

Inside `Work`:
- Collection
- Analysis

This reduces top-tab overload while preserving distinct Collection vs Analysis roles.

## 5. Collection

Purpose: execution status and raw research collection.

### Interview
Show:
- participants
- session status
- dates
- duration
- recording
- transcript availability
- light notes/comments
- bookmarks/highlights

### Usability Test
Show:
- participants
- session progress
- tasks completed
- task success summary
- recording
- transcript
- duration
- notes/comments

### Survey
Show:
- total responses
- completion rate
- drop-off
- median completion time
- channel distribution
- responses over time
- question-level completion

### A/B Test
Show:
- variants
- participant / traffic count
- basic metric collection state
- status

Do not implement experiment-serving infrastructure.

### Concept Testing
Show:
- concepts
- participants/responses
- exposure status
- ratings/preference collection progress

### Generic Study
Configurable lightweight collection table.

## 6. Analysis Workspace

Purpose: coding and lightweight analysis.

For recorded qualitative sessions, main view should show:
- session selector
- video/recording
- synchronized transcript
- transcript selection
- code color highlighting
- right Inspector

Inspector order:
1. selected text
2. emotional tags
3. coding
4. notes
5. clip

Allow:
- highlight without coding
- add/remove codes later
- multiple codes per segment
- multi-selection
- clip creation
- notes
- basic code/tag filtering

For quantitative / survey data:
- table
- filter
- sort
- group
- frequency
- percentage
- mean
- simple charts
- open-text tagging/coding where relevant

Analysis may export:
- transcript
- data sheet
- CSV

Analysis may create Result from:
- coded theme
- saved chart
- descriptive summary

Do not implement advanced inferential statistics.

## 7. Results Workspace

Result list may be filtered by:
- type
- source
- participant/session where relevant
- creator

Result details:
- title
- result type
- summary
- source Study/Dataset
- attachments
- statistics fields if relevant
- related Insights

Graph preview remains compact:
- Themes (15)
- Charts (5)
- ANOVA (1)

## 8. Dataset Workspace

Tabs:
- Overview
- Data
- Analysis
- Results
- Files

Imported dataset is itself a Graph object.

## 9. Insight Workspace

Tabs:
- Overview
- Evidence
- Related Results
- History
- Comments

Evidence view:
- type
- preview
- source
- open source
- remove
- copy/move to another Insight

Insight Workspace is for single-Insight maintenance.

Synthesize Mode is for multi-Insight recomposition.

## 10. Recommendation Workspace

Tabs:
- Overview
- Related Insights
- Notes

Fields:
- description
- owner
- due date
- implemented checkbox
