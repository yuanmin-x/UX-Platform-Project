import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

export type RelationshipEdgeData = {
  label: string;
  editorRequest?: number;
  onSelect: (edgeId: string) => void;
  onContextMenu: (edgeId: string, position: { x: number; y: number }) => void;
  onSaveLabel: (edgeId: string, label: string) => void;
};

export type RelationshipEdge = Edge<RelationshipEdgeData, "researchRelationship">;

export function ResearchRelationshipEdge({
  id,
  data,
  markerEnd,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: EdgeProps<RelationshipEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);
  const label = typeof data?.label === "string" ? data.label : "";

  function startEditing() {
    cancelledRef.current = false;
    setDraft(label);
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!data?.editorRequest) return;
    cancelledRef.current = false;
    setDraft(label);
    setEditing(true);
  }, [data?.editorRequest, label]);
  const save = () => {
    if (cancelledRef.current) return;
    data?.onSaveLabel(id, draft.trim());
    setEditing(false);
  };
  const cancel = () => {
    cancelledRef.current = true;
    setEditing(false);
    setDraft(label);
  };
  const select = (event: React.MouseEvent) => {
    event.stopPropagation();
    data?.onSelect(id);
  };

  return (
    <>
      <BaseEdge
        className={`relationship-edge-path ${selected ? "is-selected" : ""} ${hovered ? "is-hovered" : ""}`}
        interactionWidth={0}
        markerEnd={markerEnd}
        path={path}
      />
      <path
        className="relationship-edge-hit"
        d={path}
        fill="none"
        onClick={select}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          data?.onContextMenu(id, { x: event.clientX, y: event.clientY });
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          data?.onSelect(id);
          startEditing();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        stroke="transparent"
        strokeWidth={14}
      />
      <EdgeLabelRenderer>
        <div
          className="relationship-label-wrapper nodrag nopan"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {editing ? (
            <input
              aria-label="Relationship label"
              className="relationship-label-input"
              onBlur={save}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancel();
                }
              }}
              ref={inputRef}
              value={draft}
            />
          ) : label ? (
            <button
              className={`relationship-label ${selected ? "is-selected" : ""} ${hovered ? "is-hovered" : ""}`}
              onClick={select}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                data?.onContextMenu(id, { x: event.clientX, y: event.clientY });
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                data?.onSelect(id);
                startEditing();
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              title={label}
              type="button"
            >
              {label}
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
