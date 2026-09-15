import { formatStatus, isCompletionStatus, objectTypeConfig } from "@/lib/domain/object-types";
import type { ResearchObject } from "@/types/domain";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type GraphNodeData = {
  object: ResearchObject;
  customColor: string | null;
  onStatusClick: (objectId: string, position: { x: number; y: number }) => void;
};

export function ResearchObjectNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData;
  const { object, customColor } = nodeData;
  const config = objectTypeConfig[object.type];
  const color = customColor ?? config.color;

  const status = object.status ?? config.defaultStatus;
  const statusClass = status === "off" ? "is-off" : status === "archived" ? "is-archived" : "";

  return (
    <article className={`research-node ${selected ? "is-selected" : ""} ${statusClass}`} style={{ "--object-color": color } as React.CSSProperties}>
      <Handle position={Position.Left} type="target" />
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
      <Handle position={Position.Right} type="source" />
    </article>
  );
}
