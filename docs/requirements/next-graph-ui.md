# Next Graph UI milestone requirements

These requirements were identified during Milestone 1 manual testing and are intentionally deferred from the relationship deletion fix.

## Resizable Object cards

- A selected node should expose resize handles.
- Enforce sensible minimum dimensions.
- Persist `width` and `height` as Project-specific view state in `project_objects`, never in `objects`.
- Restore the saved card size after a reload.

## Four-direction connection handles

- Provide top, right, bottom, and left source/target handles on object cards.
- Keep handles hidden until hover or node selection.
- Permit relationship creation from any side.
- Persist source and target handle IDs so routing remains stable after reload.
