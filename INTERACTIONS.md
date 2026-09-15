# INTERACTIONS.md

## 1. Graph interactions

### Single click
- select object
- show lightweight preview / mini-nodes where applicable

### Double click
- open Object Workspace

### Right click
- open object-specific context menu

### Drag
- move object

### Connect
- create relationship
- arrow optional
- user may reverse direction
- optional user label

### Frame
- free-select objects into Research Design Frame
- resize/move frame freely

## 2. Navigation

### Back
Return to previous Workspace in history.

### Breadcrumb
Clickable.
Reflects entry context, not necessarily unique parent hierarchy.

### Esc
Return directly to full Project Graph View.

### Navigator
Shown when Workspace opens.
Default simplified context tree.
Resizable, collapsible, hideable.
Supports pinned objects.

## 3. Pin
Pin is available from:
- context menu
- object header / Inspector

Pinned items remain accessible across Workspace navigation.

## 4. Session / Collection interactions

Collection is for execution/progress, not deep analysis.

Interview / Usability:
- participant/session list
- status
- recording availability
- transcript availability
- duration
- light note/comment
- highlight/bookmark allowed
- no heavy coding requirement in Collection

Survey:
- total responses
- completion rate
- drop-off
- top channel / channels
- simple response-over-time line chart
- question completion overview

A/B:
- variant traffic / sample
- simple metric progress
- collection state

Concept Testing:
- concept exposure
- participant/response completion
- simple rating/preference status

## 5. Analysis selection behavior

Coding happens in Analysis.

Text selection:
- Shift + drag / selection for continuous range
- Ctrl/Cmd for separate selections / multi-select behavior
- selected segments remain visually highlighted until action completes

Right-side Inspector order:

1. Selected text
2. Emotional tags
3. Coding
4. Notes
5. Clip

### Highlight without coding
If text is important but the researcher does not know the code yet:
- select transcript text
- right click
- `Highlight`

Highlighted text remains visible in transcript and can be coded later.

### Coding
User may:
- type code
- search existing code
- select code
- create new code

Transcript segments receive code-specific color highlighting after coding.

A segment may have multiple codes.

### Emotional / research tags
Built-in options include:
- Pain point
- Positive
- Negative
- Confusion
- Need
- Behavior
- Expectation
- Motivation
- Barrier
- Opportunity

Tags are separate from coding and remain lightweight.

### Notes
Attach notes to selected segment(s).

### Clip
Create clip from selected timestamp range.
Clip references recording + timestamp.

## 6. Video + transcript synchronization

For recorded qualitative sessions:
- video/recording and transcript are shown together
- playback position syncs transcript
- clicking transcript seeks video
- coded/highlighted text should correspond to timestamp range when possible

Evidence should prefer recording/timestamp anchoring.

## 7. Synthesize Mode interactions

### Enter
Graph toolbar → Synthesize Mode

### Visual state
- Insights dominate
- Business Problems / Studies / Datasets remain faint contextual anchors
- relationship lines fade
- hover restores relationship emphasis

### Insight card
Collapsed:
- title
- status
- evidence count

Expanded:
- insight text
- evidence chips/tags

Multiple cards can remain expanded.

### Evidence move
Normal drag:
- move reference from one Insight evidence set to another

Alt/Option + drag:
- copy reference, keeping it in original set

Right-click alternatives:
- Move to Insight
- Copy to Insight
- Remove from Insight

### Create Insight
Top-right `+ New Insight`
User may:
- create empty Working Insight
- link to Business Problem
- link to Study
- link to Dataset
- drag/copy evidence into it

### Merge
Select multiple Insights → Merge
Creates a new Working Insight.
Evidence set = union.
Source Insights remain as child Insights by default.

### Similarity
MVP only calculates exact evidence overlap.
No AI semantic merge suggestion.

## 8. Recommendation
Only Final Insight offers `Create Recommendation`.

Recommendation supports:
- linking multiple Final Insights
- implemented checkbox
