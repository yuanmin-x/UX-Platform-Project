"use client";

import { ResearchObjectNode, type GraphNodeData } from "@/components/graph/research-object-node";
import { ResearchRelationshipEdge, type RelationshipEdge, type RelationshipEdgeData } from "@/components/graph/research-relationship-edge";
import { AppShell } from "@/components/ui/app-shell";
import { formatStatus, objectTypeConfig } from "@/lib/domain/object-types";
import { arrangeGraph } from "@/lib/domain/graph-layout";
import type { ObjectType, ProjectGraph as ProjectGraphData, ResearchObject } from "@/types/domain";
import {
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  type Connection,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ResearchGraphNode = Node<GraphNodeData, "researchObject">;
type ObjectForm = { type: ObjectType; title: string };
type ExistingObjectOption = { id: string; type: ObjectType; title: string; status: string | null; projects: Array<{ id: string; name: string }> };
const minimumNodeWidth = 200;
const minimumNodeHeight = 112;

const initialObjectForm: ObjectForm = {
  type: "research_question",
  title: "",
};

export function ProjectGraph({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <ProjectGraphCanvas projectId={projectId} />
    </ReactFlowProvider>
  );
}

function ProjectGraphCanvas({ projectId }: { projectId: string }) {
  const [graph, setGraph] = useState<ProjectGraphData | null>(null);
  const [nodes, setNodes] = useState<ResearchGraphNode[]>([]);
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ objectId: string; x: number; y: number } | null>(null);
  const [form, setForm] = useState<ObjectForm>(initialObjectForm);
  const [showAddObject, setShowAddObject] = useState(false);
  const [addMode, setAddMode] = useState<"create" | "existing">("create");
  const [existingQuery, setExistingQuery] = useState("");
  const [existingType, setExistingType] = useState<"all" | ObjectType>("all");
  const [existingObjects, setExistingObjects] = useState<ExistingObjectOption[]>([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<ResearchGraphNode, RelationshipEdge> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ researchObject: ResearchObjectNode }), []);
  const edgeTypes = useMemo(() => ({ researchRelationship: ResearchRelationshipEdge }), []);

  const openStatusMenu = useCallback((objectId: string, position: { x: number; y: number }) => {
    setEdgeMenu(null);
    setStatusMenu({ objectId, ...position });
  }, []);

  const closeAddObject = useCallback(() => {
    setForm(initialObjectForm);
    setAddMode("create");
    setExistingQuery("");
    setExistingType("all");
    setExistingObjects([]);
    setShowAddObject(false);
  }, []);

  const saveNodePresentation = useCallback(
    async (objectId: string, x: number, y: number, width?: number, height?: number) => {
      const response = await fetch(`/api/projects/${projectId}/graph-positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ objectId, x, y, ...(width !== undefined ? { width } : {}), ...(height !== undefined ? { height } : {}) }],
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Unable to save graph presentation.");
      }
    },
    [projectId],
  );

  const onNodeResizeEnd = useCallback(
    (objectId: string, width: number, height: number, x: number, y: number) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === objectId ? { ...node, position: { x, y }, style: { ...node.style, width, height } } : node,
        ),
      );
      void saveNodePresentation(objectId, x, y, width, height);
    },
    [saveNodePresentation],
  );

  const selectRelationship = useCallback((relationshipId: string) => {
    setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: edge.id === relationshipId })));
  }, []);

  const openEdgeMenu = useCallback((relationshipId: string, position: { x: number; y: number }) => {
    setStatusMenu(null);
    setEdgeMenu({ edgeId: relationshipId, ...position });
  }, []);

  const openInlineLabelEditor = useCallback((relationshipId: string) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) =>
        edge.id === relationshipId && edge.data
          ? { ...edge, selected: true, data: { ...edge.data, editorRequest: (edge.data.editorRequest ?? 0) + 1 } }
          : edge,
      ),
    );
    setEdgeMenu(null);
  }, []);

  const updateRelationship = useCallback(
    async (relationshipId: string, changes: Record<string, string | null>) => {
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/relationships`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipId, ...changes }),
      });
      const body = (await response.json()) as { error?: string } | ProjectGraphData["relationships"][number];
      if (!response.ok || !("id" in body)) throw new Error("error" in body ? body.error ?? "Unable to update relationship." : "Unable to update relationship.");
      setEdges((currentEdges) =>
        currentEdges.map((edge) => (edge.id === relationshipId && edge.data ? relationshipToEdge(body, edge.data) : edge)),
      );
      setEdgeMenu(null);
    },
    [projectId],
  );

  const edgeActions = useMemo<RelationshipEdgeData>(
    () => ({
      label: "",
      onSelect: selectRelationship,
      onContextMenu: openEdgeMenu,
      onSaveLabel: (relationshipId, label) => void updateRelationship(relationshipId, { label }),
    }),
    [openEdgeMenu, selectRelationship, updateRelationship],
  );

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const body = (await response.json()) as ProjectGraphData | { error: string };
      if (!response.ok || !("project" in body)) throw new Error("error" in body ? body.error : "Unable to load graph.");
      setGraph(body);
      setNodes(
        body.projectObjects.map((projectObject) => ({
          id: projectObject.object_id,
          type: "researchObject",
          position: { x: projectObject.x, y: projectObject.y },
          style: {
            width: Math.max(projectObject.width ?? 220, minimumNodeWidth),
            height: Math.max(projectObject.height ?? minimumNodeHeight, minimumNodeHeight),
          },
          hidden: projectObject.hidden,
          data: {
            object: projectObject.objects,
            customColor: projectObject.custom_color,
            onStatusClick: openStatusMenu,
            onResizeEnd: onNodeResizeEnd,
          },
        })),
      );
      setEdges(
        body.relationships.map((relationship) => relationshipToEdge(relationship, edgeActions)),
      );
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [edgeActions, onNodeResizeEnd, openStatusMenu, projectId]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  const onNodesChange = useCallback((changes: NodeChange<ResearchGraphNode>[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<RelationshipEdge>[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const saveNodePosition: OnNodeDrag<ResearchGraphNode> = useCallback(
    (_event, node) => void saveNodePresentation(node.id, node.position.x, node.position.y),
    [saveNodePresentation],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const response = await fetch(`/api/projects/${projectId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceObjectId: connection.source,
          targetObjectId: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        }),
      });
      const body = (await response.json()) as { error?: string } | ProjectGraphData["relationships"][number];
      if (!response.ok) {
        setError("error" in body ? body.error ?? "Unable to connect objects." : "Unable to connect objects.");
        return;
      }
      if (!("id" in body)) throw new Error("Unable to connect objects.");
      setEdges((currentEdges) => [...currentEdges, relationshipToEdge(body, edgeActions)]);
    },
    [edgeActions, projectId],
  );

  const autoArrange = useCallback(async () => {
    const layout = arrangeGraph(
      nodes.map((node) => ({
        id: node.id,
        type: node.data.object.type,
        title: node.data.object.title,
        position: node.position,
        width: Math.max(Number(node.style?.width) || 220, minimumNodeWidth),
        height: Math.max(Number(node.style?.height) || minimumNodeHeight, minimumNodeHeight),
      })),
      edges.map((edge) => ({ source: edge.source, target: edge.target })),
    );
    const arranged = layout.positions;
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const position = arranged.get(node.id);
        return position ? { ...node, position } : node;
      }),
    );
    try {
      const response = await fetch(`/api/projects/${projectId}/graph-positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: nodes.map((node) => ({ objectId: node.id, ...arranged.get(node.id)! })) }),
      });
      if (!response.ok) throw new Error("Unable to save arranged positions.");
    } catch (caughtError) {
      setError(getMessage(caughtError));
      await loadGraph();
    }
  }, [edges, loadGraph, nodes, projectId]);

  useEffect(() => {
    if (!showAddObject || addMode !== "existing") return;
    let active = true;
    const search = async () => {
      setExistingLoading(true);
      try {
        const params = new URLSearchParams();
        if (existingQuery.trim()) params.set("query", existingQuery.trim());
        if (existingType !== "all") params.set("type", existingType);
        const response = await fetch(`/api/objects?${params.toString()}`);
        const body = (await response.json()) as ExistingObjectOption[] | { error?: string };
        if (!response.ok || !Array.isArray(body)) throw new Error("error" in body ? body.error ?? "Unable to search Objects." : "Unable to search Objects.");
        if (active) setExistingObjects(body);
      } catch (caughtError) {
        if (active) setError(getMessage(caughtError));
      } finally {
        if (active) setExistingLoading(false);
      }
    };
    void search();
    return () => {
      active = false;
    };
  }, [addMode, existingQuery, existingType, showAddObject]);

  const deleteRelationships = useCallback(
    async (relationshipIds: string[]) => {
      if (!relationshipIds.length) return;

      setEdges((currentEdges) => currentEdges.filter((edge) => !relationshipIds.includes(edge.id)));
      setEdgeMenu(null);

      try {
        const responses = await Promise.all(
          relationshipIds.map((relationshipId) =>
            fetch(`/api/projects/${projectId}/relationships`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ relationshipId }),
            }),
          ),
        );
        const failedResponse = responses.find((response) => !response.ok);
        if (failedResponse) {
          const body = (await failedResponse.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to delete relationship.");
        }
      } catch (caughtError) {
        await loadGraph();
        setError(getMessage(caughtError));
      }
    },
    [loadGraph, projectId],
  );

  const statusMenuObject = statusMenu
    ? nodes.find((node) => node.id === statusMenu.objectId)?.data.object
    : null;

  const updateStatus = useCallback(
    async (object: ResearchObject, status: string) => {
      setError(null);
      try {
        const response = await fetch(`/api/objects/${object.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const body = (await response.json()) as ResearchObject | { error?: string };
        if (!response.ok || !("id" in body)) throw new Error("error" in body ? body.error : "Unable to update status.");

        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === object.id
              ? { ...node, data: { ...node.data, object: body } }
              : node,
          ),
        );
        setGraph((currentGraph) =>
          currentGraph
            ? {
                ...currentGraph,
                projectObjects: currentGraph.projectObjects.map((projectObject) =>
                  projectObject.object_id === object.id
                    ? { ...projectObject, objects: body }
                    : projectObject,
                ),
              }
            : currentGraph,
        );
        setStatusMenu(null);
      } catch (caughtError) {
        setError(getMessage(caughtError));
      }
    },
    [],
  );

  async function submitObject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const position = nextObjectPosition(nodes);
      const payload = { type: form.type, title: form.title, ...position };
      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to add object.");
      setForm((currentForm) => ({ ...currentForm, title: "" }));
      await loadGraph();
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  const attachExistingObject = useCallback(
    async (objectId: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const position = nextObjectPosition(nodes);
        const response = await fetch(`/api/projects/${projectId}/objects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objectId, ...position }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to add existing Object.");
        await loadGraph();
      } catch (caughtError) {
        setError(getMessage(caughtError));
      } finally {
        setSubmitting(false);
      }
    },
    [loadGraph, nodes, projectId],
  );

  return (
    <AppShell>
      <section className="graph-page">
        <header className="project-header">
          <div>
            <Link className="back-link" href="/projects">
              ← Projects
            </Link>
            <p className="eyebrow">Project graph</p>
            <h1>{graph?.project.name ?? "Loading project…"}</h1>
            {graph?.project.description && <p className="muted">{graph.project.description}</p>}
          </div>
          <span className="graph-status">Persisted graph</span>
        </header>

        <div className="graph-layout">
          <div
            className="graph-canvas"
            aria-label="Project reasoning graph"
            onClick={() => {
              setEdgeMenu(null);
              setStatusMenu(null);
            }}
          >
            <div className="graph-toolbar" role="toolbar" aria-label="Graph controls">
              <button className="toolbar-action" onClick={() => (showAddObject ? closeAddObject() : setShowAddObject(true))} type="button">Add Object</button>
              <button className="toolbar-action" onClick={() => void autoArrange()} type="button">Auto Arrange</button>
              <button className="toolbar-icon" aria-label="Fit graph to view" onClick={() => reactFlowInstance?.fitView({ padding: 0.16 })} title="Fit View" type="button">⊡</button>
            </div>
            {showAddObject && (
              <aside className="panel graph-add-panel">
                <div className="graph-add-heading">
                  <h2>Add to graph</h2>
                  <button aria-label="Close Add Object" className="panel-close" onClick={closeAddObject} type="button">×</button>
                </div>
                <div className="add-mode-tabs" role="tablist" aria-label="Add Object mode">
                  <button aria-selected={addMode === "create"} onClick={() => setAddMode("create")} role="tab" type="button">Create New</button>
                  <button aria-selected={addMode === "existing"} onClick={() => setAddMode("existing")} role="tab" type="button">Add Existing</button>
                </div>
                {addMode === "create" ? (
                  <form onSubmit={submitObject}>
              <label>
                Object type
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as ObjectType })}
                >
                  {Object.entries(objectTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Name
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder={objectTypeConfig[form.type].namePlaceholder}
                />
              </label>
              <div className="graph-add-actions">
                <button disabled={submitting} type="submit">
                  {submitting ? "Saving…" : "Create Object"}
                </button>
              </div>
                  </form>
                ) : (
                  <div className="existing-object-picker">
                    <label>
                      Search Objects
                      <input autoFocus onChange={(event) => setExistingQuery(event.target.value)} placeholder="Search by name" value={existingQuery} />
                    </label>
                    <label>
                      Object type
                      <select onChange={(event) => setExistingType(event.target.value as "all" | ObjectType)} value={existingType}>
                        <option value="all">All types</option>
                        {Object.entries(objectTypeConfig).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}
                      </select>
                    </label>
                    <div className="existing-object-results" aria-live="polite">
                      {existingLoading ? <p className="muted">Searching…</p> : existingObjects.map((object) => {
                        const alreadyAdded = nodes.some((node) => node.id === object.id);
                        return (
                          <article className="existing-object-result" key={object.id}>
                            <span className="existing-object-type" style={{ color: objectTypeConfig[object.type].color }}>{objectTypeConfig[object.type].label}</span>
                            <strong>{object.title}</strong>
                            <small>{object.projects.length ? object.projects.map((project) => project.name).join(", ") : "Not yet in a Project"}</small>
                            <button disabled={submitting || alreadyAdded} onClick={() => void attachExistingObject(object.id)} type="button">
                              {alreadyAdded ? "Already added" : "Add to Project"}
                            </button>
                          </article>
                        );
                      })}
                      {!existingLoading && !existingObjects.length && <p className="muted">No matching Objects.</p>}
                    </div>
                  </div>
                )}
              </aside>
            )}
            {loading ? (
              <p className="canvas-message">Loading graph…</p>
            ) : (
              <ReactFlow<ResearchGraphNode, RelationshipEdge>
                edges={edges}
                edgeTypes={edgeTypes}
                edgesFocusable
                connectionMode={ConnectionMode.Loose}
                deleteKeyCode={["Backspace", "Delete"]}
                fitView
                minZoom={0.2}
                nodeTypes={nodeTypes}
                nodes={nodes}
                onConnect={onConnect}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={(deletedEdges) => void deleteRelationships(deletedEdges.map((edge) => edge.id))}
                onEdgeContextMenu={(event, edge) => {
                  event.preventDefault();
                  openEdgeMenu(edge.id, { x: event.clientX, y: event.clientY });
                }}
                onNodeClick={() => setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })))}
                onNodeDragStop={saveNodePosition}
                onNodesChange={onNodesChange}
                onPaneClick={() => setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })))}
                onInit={setReactFlowInstance}
              >
                <Background gap={20} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            )}
            {edgeMenu && (
              <div className="edge-menu" role="menu" style={{ left: edgeMenu.x, top: edgeMenu.y }}>
                <button
                  onClick={() => {
                    const edge = edges.find((candidate) => candidate.id === edgeMenu.edgeId);
                    if (!edge) return;
                    void updateRelationship(edge.id, {
                      sourceObjectId: edge.target,
                      targetObjectId: edge.source,
                      sourceHandle: edge.targetHandle ?? null,
                      targetHandle: edge.sourceHandle ?? null,
                    });
                  }}
                  role="menuitem"
                  type="button"
                >
                  Reverse direction
                </button>
                <button
                  onClick={() => {
                    openInlineLabelEditor(edgeMenu.edgeId);
                  }}
                  role="menuitem"
                  type="button"
                >
                  Edit label
                </button>
                <button onClick={() => void deleteRelationships([edgeMenu.edgeId])} role="menuitem" type="button">
                  Delete relationship
                </button>
              </div>
            )}
            {statusMenu && statusMenuObject && (
              <div className="status-menu" role="menu" style={{ left: statusMenu.x, top: statusMenu.y }}>
                <span className="status-menu-label">Status</span>
                {objectTypeConfig[statusMenuObject.type].validStatuses.map((status) => (
                  <button
                    aria-checked={statusMenuObject.status === status}
                    key={status}
                    onClick={() => void updateStatus(statusMenuObject, status)}
                    role="menuitemradio"
                    type="button"
                  >
                    {formatStatus(status, null)}
                  </button>
                ))}
              </div>
            )}
            {error && <p className="error-message canvas-error">{error}</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function relationshipToEdge(
  relationship: ProjectGraphData["relationships"][number],
  actions: RelationshipEdgeData,
): RelationshipEdge {
  return {
    id: relationship.id,
    source: relationship.source_object_id,
    target: relationship.target_object_id,
    sourceHandle: relationship.source_handle ?? undefined,
    targetHandle: relationship.target_handle ?? undefined,
    type: "researchRelationship",
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    data: { ...actions, label: relationship.label ?? "" },
  };
}

function nextObjectPosition(nodes: ResearchGraphNode[]) {
  const index = nodes.length;
  return {
    x: 360 + Math.floor(index / 6) * 280,
    y: 80 + (index % 6) * 140,
  };
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
