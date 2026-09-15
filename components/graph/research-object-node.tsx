import { formatStatus, isCompletionStatus, objectTypeConfig } from "@/lib/domain/object-types";
import type { ResearchObject } from "@/types/domain";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

export type GraphNodeData = {
  object: ResearchObject;
  customColor: string | null;
  onStatusClick: (objectId: string, position: { x: number; y: number }) => void;
  onResizeEnd: (objectId: string, width: number, height: number, x: number, y: number) => void;
};

const handles = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

export function ResearchObjectNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData;
  const { object, customColor } = nodeData;
  const config = objectTypeConfig[object.type];
  const color = customColor ?? config.color;

  const status = object.status ?? config.defaultStatus;
  const statusClass = status === "off" ? "is-off" : status === "archived" ? "is-archived" : "";

  return (
    <article className={`research-node ${selected ? "is-selected" : ""} ${statusClass}`} style={{ "--object-color": color, "--object-surface": config.surface } as React.CSSProperties}>
      <NodeResizer
        isVisible={selected}
        lineClassName="node-resize-line"
        maxHeight={420}
        maxWidth={440}
        minHeight={112}
        minWidth={200}
        onResizeEnd={(_event, params) => nodeData.onResizeEnd(object.id, params.width, params.height, params.x, params.y)}
        handleClassName="node-resize-handle"
      />
      {handles.map((handle) => (
        <Handle id={handle.id} key={handle.id} position={handle.position} type="source" />
      ))}
      <div className="node-type">{config.label}</div>
      <strong>{object.title}</strong>
      {selected && config.validStatuses.length > 0 ? (
        <button
          className="node-status"
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            nodeData.onStatusClick(object.id, { x: rect.left, y: rect.bottom + 4 });
          }}
          type="button"
        >
          {isCompletionStatus(status) && <span aria-hidden="true">✓ </span>}
          {formatStatus(status, config.defaultStatus)}
        </button>
      ) : (
        <span className="node-status">
          {isCompletionStatus(status) && <span aria-hidden="true">✓ </span>}
          {formatStatus(status, config.defaultStatus)}
        </span>
      )}
    </article>
  );
}
