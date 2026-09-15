# OBJECT_MODEL.md

## 1. Core objects

### Business Problem
Purpose: why the work exists.

Fields:
- id
- title
- description
- status: draft | active | off | solved | archived
- priority
- parentBusinessProblemId
- hierarchyLevel: 1 | 2 | 3
- ownerId
- createdBy
- timestamps

Rules:
- multiple Business Problems per Project
- child Business Problems allowed
- recommended max depth 3
- soft sibling guideline ~5
- may connect to multiple Studies, Datasets, RQs, Insights

### Research Question
Purpose: what we need to learn.

Fields:
- id
- title
- learningGoal
- status: open | answered | archived
- businessProblemIds
- timestamps

Rules:
- appears as a section in Business Problem Workspace
- also exists as a Graph object
- Study defines which RQs it addresses

### Study
Purpose: how we learn.

Study types:
- generic
- usability_test
- interview
- survey
- ab_test
- concept_testing

Status:
- planned
- running
- analysis
- completed

Fields:
- businessProblemIds
- researchQuestionIds
- startDate / endDate
- ownerId
- workingMemberIds
- participantTarget
- participantCount

Study internal content includes:
- participants
- collection/session records
- recordings
- transcripts
- questions/tasks
- notes/comments
- highlights
- tags/codes
- clips
- lightweight analysis

### Dataset
Purpose: existing imported data.

Status:
- imported
- in_use
- archived

Sources:
- csv
- xlsx
- text
- manual
- integration (future)

Dataset is distinct from study-generated data.

### Result
Purpose: what the data shows.

Possible types:
- theme
- chart
- descriptive_stat
- t_test
- anova
- regression
- heatmap
- journey_map
- other

Fields:
- sourceStudyIds
- sourceDatasetIds
- summary
- attachment references
- optional statistical fields
- createdBy
- workingMember / reviewer references where appropriate

### Insight
Purpose: what the findings mean for the business.

Status:
- working
- validated
- final
- archived

Fields:
- text
- relatedBusinessProblemIds
- relatedStudyIds
- relatedDatasetIds
- relatedResultIds
- parentInsightId
- childInsightIds
- createdBy
- validatedBy
- finalizedBy

Insight owns / references an Evidence Set.

### Recommendation
Purpose: what should be done.

Rules:
- only created from Final Insight(s)
- may connect to multiple Final Insights

Fields:
- insightIds
- implemented boolean
- ownerId
- dueDate
- title
- description

## 2. Non-object entities

### Participant
Not shown as a Graph object.

Participant may be referenced across studies.

Fields may include:
- id
- displayName / participant code
- metadata
- segment
- notes
- study references
- session references

### Working Member
Project team entity.

May link to:
- Project ownership
- Study ownership
- Session assignment
- Coding assignment
- Result creation
- Insight validation/finalization
- Recommendation ownership

### Research Design Frame
Visual grouping only.
Not globally searchable.

### Evidence
Not a top-level object.
Belongs to one or more Insight evidence sets by reference.

## 3. Evidence types

- quote
- highlight
- tag
- code
- clip
- chart_reference
- result_reference
- observation

Evidence should preserve source references.

For video/transcript evidence, prefer source anchoring to:
- session
- recording
- timestamp range

Transcript text is a display/preview layer, not the only anchor.
