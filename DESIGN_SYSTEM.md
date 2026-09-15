# DESIGN_SYSTEM.md — v0.1

## 1. Visual direction

Professional tool aesthetic.

Reference mix:
- Linear
- Figma
- Cursor
- restrained amount of FigJam

Principles:
- low saturation
- minimal shadow
- mostly 1px borders
- dense but calm information layout
- progressive disclosure
- avoid playful whiteboard styling

## 2. Object colors

**Object Type defines visual identity; Status defines lifecycle state.**

Never use lifecycle status to replace an Object's type color. This rule applies consistently across Graph cards, Navigator, Workspace headers, lists, search results, and future Synthesize Mode.

Default:
- Business Problem: white / neutral border
- Research Question: neutral gray-white
- Dataset: purple
- Study: blue
- Result: orange
- Insight: green
- Recommendation: brown

Users may customize object colors.

Status should not introduce a competing color system.

Status is represented with secondary signals: a small text label, a subtle completion check where applicable, and opacity only for muted states. Completed, Solved, Answered, and Final retain their Object type color. `Off` reduces opacity to approximately 50% while retaining recognizable type identity. Archived objects are hidden from Graph by default in a future iteration; when shown, they are strongly muted rather than recolored.

`ongoing` / active work: normal opacity.

`off`: grayscale / opacity ~50%.

`archived`: hidden by default; if shown, strongly muted.

## 3. Graph cards

Default:
- width ~220px
- min height ~72px
- max default height ~112px
- radius 8px
- padding 12px
- 1px border

Structure:
- object icon + type
- title
- short metadata / status

Compact zoomed-out state:
- ~220 × 48px
- title + icon + status only

Selected:
- 2px object-color border
- optional 3–5% tint

Hover:
- stronger border
- connection handles appear

## 4. Graph layout

Default direction: left → right

Soft reasoning structure:
Business Problem → RQ → Study/Dataset → Result → Insight → Recommendation

Spacing:
- horizontal 80–120px
- vertical 40–64px

Users may freely reposition.

Provide:
- Auto arrange
- alignment assistance
- optional reset to reasoning layout

## 5. Connections

Default:
- neutral gray
- 1.5px
- arrow optional

User may:
- reverse
- remove arrow
- add label

Selected:
- 2px stronger line

Synthesize:
- irrelevant/contextual lines fade to ~10–20%
- hover restores emphasis

## 6. Research Design Frame

Figma-like:
- 1px dashed neutral border
- transparent background
- title top-left
- resize/move
- selection handles only when selected

## 7. Workspace layout

Four zones:

1. Header
2. Toolbar
3. Main Area
4. Inspector

When Workspace opens:
- Graph contracts into Navigator on left

Navigator default width:
- ~240px
- adjustable 180–420px
- collapsible/hideable

Inspector:
- ~300–340px
- collapsible

## 8. Typography

Use:
Inter, system-ui, -apple-system, Segoe UI, sans-serif

Recommended:
- Project title: 18px / 600
- Workspace title: 20px / 600
- Graph card title: 14px / 600
- Body: 13–14px / 400
- Metadata: 12px / 400
- Object type label: 10–11px / 600
- Tag: 11–12px / 500

## 9. Built-in tags

Built-in research tags:
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

Users may also create custom tags.

Keep tag colors muted.

## 10. Analysis coding colors

Codes may have distinct user-defined colors.

Coded transcript text receives a subtle underline/background tint corresponding to code color.

If multiple codes apply:
- avoid aggressive multi-color fill
- prefer stacked markers / edge indicators / subtle layered highlights

## 11. Context menus

Width:
- ~200–240px

No more than ~8–10 top-level items.
Use nested `More >` if needed.

Menus are object-specific.

## 12. Synthesize Mode

Insight cards:
- width ~280px
- collapsed min height ~88px
- expanded auto height
- max visible height ~420px before internal scroll

Top:
- Insight text / status

Bottom:
- Evidence chips

Multiple Insight cards may stay expanded simultaneously.

Inspector shows full Evidence details.

## 13. Professional-tool constraints

Avoid:
- gradients
- heavy shadows
- excessive pill shapes
- emoji as formal icons
- large saturated surfaces
- modal-heavy flows
- huge page titles
- inconsistent object-card structures

Prefer:
- Inspector editing
- inline actions
- compact cards
- keyboard shortcuts
- predictable layouts
