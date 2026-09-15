import { formatStatus, isCompletionStatus, objectTypeConfig } from "@/lib/domain/object-types";
import type { ResearchObject } from "@/types/domain";
import type { NodeProps } from "@xyflow/react";

export type NavigatorNodeData = {
  object: ResearchObject;
  current: boolean;
};

/** Compact, read-only Graph Object card used only inside the Workspace Navigator. */
export function NavigatorObjectNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NavigatorNodeData;
  const { object } = nodeData;
  const config = objectTypeConfig[object.type];
  const status = object.status ?? config.defaultStatus;
  const muted = status === "off" ? "is-off" : status === "archived" ? "is-archived" : "";

  return (
    <article
      className={`navigator-node ${nodeData.current || selected ? "is-current" : ""} ${muted}`}
      style={{ "--object-color": config.color, "--object-surface": config.surface } as React.CSSProperties}
    >
      <span className="navigator-node-type">{config.label}</span>
      <strong title={object.title}>{object.title}</strong>
      <span className="navigator-node-status">
        {isCompletionStatus(status) && <span aria-hidden="true">✓ </span>}
        {formatStatus(status, config.defaultStatus)}
      </span>
    </article>
  );
}
