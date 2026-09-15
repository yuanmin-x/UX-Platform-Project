"use client";

import { ResearchObjectNode, type GraphNodeData } from "@/components/graph/research-object-node";
import { AppShell } from "@/components/ui/app-shell";
import { formatStatus, objectTypeConfig } from "@/lib/domain/object-types";
import type { ObjectType, ProjectGraph as ProjectGraphData, ResearchObject } from "@/types/domain";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ResearchGraphNode = Node<GraphNodeData, "researchObject">;
type ObjectForm = { type: ObjectType; title: string; existingObjectId: string };

const initialObjectForm: ObjectForm = {
  type: "research_question",
  title: "",
  existingObjectId: "",
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
  const [edges, setEdges] = useState<Edge[]>([]);
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ objectId: string; x: number; y: number } | null>(null);
  const [form, setForm] = useState<ObjectForm>(initialObjectForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ researchObject: ResearchObjectNode }), []);

  const openStatusMenu = useCallback((objectId: string, position: { x: number; y: number }) => {
    setEdgeMenu(null);
    setStatusMenu({ objectId, ...position });
  }, []);

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
          hidden: projectObject.hidden,
          data: {
            object: projectObject.objects,
            customColor: projectObject.custom_color,
            onStatusClick: openStatusMenu,
          },
        })),
      );
      setEdges(
        body.relationships.map((relationship) => ({
          id: relationship.id,
          source: relationship.source_object_id,
          target: relationship.target_object_id,
          label: relationship.label ?? undefined,
          type: "smoothstep",
        })),
      );
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [openStatusMenu, projectId]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  const onNodesChange = useCallback((changes: NodeChange<ResearchGraphNode>[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const saveNodePosition: OnNodeDrag<ResearchGraphNode> = useCallback(
    async (_event, node) => {
      const response = await fetch(`/api/projects/${projectId}/graph-positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ objectId: node.id, x: node.position.x, y: node.position.y }],
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Unable to save node position.");
      }
    },
    [projectId],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((currentEdges) => addEdge({ ...connection, type: "smoothstep" }, currentEdges));
      const response = await fetch(`/api/projects/${projectId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceObjectId: connection.source, targetObjectId: connection.target }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Unable to connect objects.");
        await loadGraph();
      }
    },
    [loadGraph, projectId],
  );

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
      const payload = form.existingObjectId.trim()
        ? { objectId: form.existingObjectId.trim() }
        : { type: form.type, title: form.title };
      const response = await fetch(`/api/projects/${projectId}/objects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to add object.");
      setForm(initialObjectForm);
      await loadGraph();
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

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
          <aside className="panel graph-sidebar">
            <h2>Add to graph</h2>
            <p className="muted">Create a core object, or attach a known object ID from another Project.</p>
            <form onSubmit={submitObject}>
              <label>
                Object type
                <select
                  disabled={Boolean(form.existingObjectId.trim())}
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
                Title
                <input
                  disabled={Boolean(form.existingObjectId.trim())}
                  required={!form.existingObjectId.trim()}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="What do we need to learn?"
                />
              </label>
              <label>
                Existing object ID <span className="muted">(optional)</span>
                <input
                  value={form.existingObjectId}
                  onChange={(event) => setForm({ ...form, existingObjectId: event.target.value })}
                  placeholder="UUID for cross-project reuse"
                />
              </label>
              <button disabled={submitting} type="submit">
                {submitting ? "Saving…" : form.existingObjectId.trim() ? "Attach object" : "Create object"}
              </button>
            </form>
            <div className="legend">
              {Object.entries(objectTypeConfig).map(([type, config]) => (
                <span key={type}>
                  <i style={{ background: config.color }} /> {config.label}
                </span>
              ))}
            </div>
          </aside>
          <div
            className="graph-canvas"
            aria-label="Project reasoning graph"
            onClick={() => {
              setEdgeMenu(null);
              setStatusMenu(null);
            }}
          >
            {loading ? (
              <p className="canvas-message">Loading graph…</p>
            ) : (
              <ReactFlow
                edges={edges}
                edgesFocusable
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
                  setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
                }}
                onNodeDragStop={saveNodePosition}
                onNodesChange={onNodesChange}
              >
                <Background gap={20} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            )}
            {edgeMenu && (
              <div className="edge-menu" role="menu" style={{ left: edgeMenu.x, top: edgeMenu.y }}>
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

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
