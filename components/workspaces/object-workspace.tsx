"use client";

import { NavigatorObjectNode, type NavigatorNodeData } from "@/components/graph/navigator-object-node";
import { AppShell } from "@/components/ui/app-shell";
import { StudyWorkspace, type StudySection } from "@/components/workspaces/study-workspace";
import { formatStatus, isCompletionStatus, objectTypeConfig } from "@/lib/domain/object-types";
import type { ProjectGraph, ResearchObject } from "@/types/domain";
import { Background, type Edge, type Node, ReactFlow, ReactFlowProvider, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type NavigatorNode = Node<NavigatorNodeData, "navigatorObject">;

const navigatorNodeWidth = 180;
const navigatorNodeHeight = 72;
const navigatorCoordinateScale = 0.58;

export function ObjectWorkspace({ graph, objectId, studySection = "overview" }: { graph: ProjectGraph; objectId: string; studySection?: StudySection }) {
  return (
    <ReactFlowProvider>
      <ObjectWorkspaceCanvas graph={graph} objectId={objectId} studySection={studySection} />
    </ReactFlowProvider>
  );
}

function ObjectWorkspaceCanvas({ graph: initialGraph, objectId, studySection }: { graph: ProjectGraph; objectId: string; studySection: StudySection }) {
  const router = useRouter();
  const [graph, setGraph] = useState(initialGraph);
  const [navigatorWidth, setNavigatorWidth] = useState(300);
  const [navigatorHidden, setNavigatorHidden] = useState(false);
  const [resizingNavigator, setResizingNavigator] = useState(false);
  const [pinnedObjectId, setPinnedObjectId] = useState<string | null>(null);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [navigatorInstance, setNavigatorInstance] = useState<ReactFlowInstance<NavigatorNode, Edge> | null>(null);

  useEffect(() => setGraph(initialGraph), [initialGraph]);

  const applyIntrinsicObjectUpdate = useCallback((updatedObject: ResearchObject) => {
    setGraph((currentGraph) => ({
      ...currentGraph,
      projectObjects: currentGraph.projectObjects.map((projectObject) =>
        projectObject.object_id === updatedObject.id
          ? { ...projectObject, objects: updatedObject }
          : projectObject,
      ),
    }));
  }, []);

  const currentObject = graph.projectObjects.find((projectObject) => projectObject.object_id === objectId)?.objects;
  const config = currentObject ? objectTypeConfig[currentObject.type] : null;

  const nodeTypes = useMemo(() => ({ navigatorObject: NavigatorObjectNode }), []);
  const nodes = useMemo<NavigatorNode[]>(
    () =>
      graph.projectObjects.map((projectObject) => ({
        id: projectObject.object_id,
        type: "navigatorObject",
        position: compactNavigatorPosition(projectObject.x, projectObject.y),
        selectable: false,
        draggable: false,
        style: { width: navigatorNodeWidth, height: navigatorNodeHeight },
        data: { object: projectObject.objects, current: projectObject.object_id === objectId },
      })),
    [graph.projectObjects, objectId],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.relationships.map((relationship) => ({
        id: relationship.id,
        source: relationship.source_object_id,
        target: relationship.target_object_id,
        type: "smoothstep",
        label: relationship.label ?? undefined,
        labelBgPadding: [3, 2],
        labelBgBorderRadius: 3,
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.92 },
        labelStyle: { fill: "#64748b", fontSize: 10, fontWeight: 500 },
        style: { stroke: "#cbd5e1", strokeWidth: 1.25 },
      })),
    [graph.relationships],
  );

  useEffect(() => {
    const key = `research-graph:pins:${graph.project.id}`;
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(key) ?? "null") as unknown;
      // Keep the first pin from the brief early-M3 multi-pin implementation.
      if (typeof stored === "string") setPinnedObjectId(stored);
      else if (Array.isArray(stored) && typeof stored[0] === "string") setPinnedObjectId(stored[0]);
    } catch {
      // Pins are a convenience-only M3 navigation preference.
    } finally {
      setPinsLoaded(true);
    }
  }, [graph.project.id]);

  useEffect(() => {
    if (!pinsLoaded) return;
    window.sessionStorage.setItem(`research-graph:pins:${graph.project.id}`, JSON.stringify(pinnedObjectId));
  }, [graph.project.id, pinnedObjectId, pinsLoaded]);

  useEffect(() => {
    if (!resizingNavigator) return;
    const resize = (event: PointerEvent) => setNavigatorWidth(Math.max(180, Math.min(420, event.clientX)));
    const stop = () => setResizingNavigator(false);
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stop);
    };
  }, [resizingNavigator]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='menu'], [role='dialog']")) return;
      event.preventDefault();
      router.push(`/projects/${graph.project.id}`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [graph.project.id, router]);

  const openObject = useCallback(
    (_event: React.MouseEvent, node: NavigatorNode) => router.push(`/projects/${graph.project.id}/objects/${node.id}`),
    [graph.project.id, router],
  );
  const togglePin = useCallback((id: string) => {
    setPinnedObjectId((current) => (current === id ? null : id));
  }, []);
  const neighborhoodIds = useMemo(() => {
    const ids = new Set([objectId]);
    for (const relationship of graph.relationships) {
      if (relationship.source_object_id === objectId) ids.add(relationship.target_object_id);
      if (relationship.target_object_id === objectId) ids.add(relationship.source_object_id);
    }
    return ids;
  }, [graph.relationships, objectId]);
  const focusCurrent = useCallback(
    (instance = navigatorInstance) => {
      if (!instance) return;
      const localNodes = nodes.filter((node) => neighborhoodIds.has(node.id));
      instance.fitView({ duration: 160, maxZoom: 1, minZoom: 0.7, nodes: localNodes, padding: 0.22 });
    },
    [navigatorInstance, neighborhoodIds, nodes],
  );
  const fitGraph = useCallback(() => {
    navigatorInstance?.fitView({ duration: 160, maxZoom: 0.9, padding: 0.16 });
  }, [navigatorInstance]);

  if (!currentObject || !config) return null;
  const status = currentObject.status ?? config.defaultStatus;
  const pinnedObject = graph.projectObjects.find((projectObject) => projectObject.object_id === pinnedObjectId) ?? null;
  const isCurrentPinned = pinnedObjectId === objectId;

  return (
    <AppShell>
      <section className={`workspace-page ${navigatorHidden ? "navigator-is-hidden" : ""}`}>
        <header className="workspace-header">
          <div className="workspace-breadcrumb" aria-label="Workspace navigation">
            <Link href={`/projects/${graph.project.id}`}>{graph.project.name}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{currentObject.title}</span>
          </div>
          <div className="workspace-header-actions">
            <button className="workspace-back" onClick={() => router.back()} type="button">← Back</button>
            <button className="workspace-back" onClick={() => togglePin(objectId)} type="button">
              {isCurrentPinned ? "Unpin" : "Pin"}
            </button>
            {navigatorHidden && (
              <button className="workspace-back" onClick={() => setNavigatorHidden(false)} type="button">Show Navigator</button>
            )}
          </div>
        </header>

        <div
          className="workspace-layout"
          style={navigatorHidden ? undefined : { gridTemplateColumns: `${navigatorWidth}px 1fr` }}
        >
          {!navigatorHidden && (
            <aside className="workspace-navigator" aria-label="Project Graph Navigator">
              <div className="navigator-heading">
                <div>
                  <span className="eyebrow">Graph navigator</span>
                  <strong>{graph.project.name}</strong>
                </div>
                <button aria-label="Hide Navigator" className="navigator-control" onClick={() => setNavigatorHidden(true)} title="Hide Navigator" type="button">‹</button>
              </div>
              {pinnedObject && (
                <div className="navigator-pins" aria-label="Pinned Object">
                  <span>Pinned</span>
                  <div className={`navigator-pin-card ${pinnedObject.object_id === objectId ? "is-current" : ""}`} style={{ "--pin-color": objectTypeConfig[pinnedObject.objects.type].color } as React.CSSProperties}>
                    <button onClick={() => router.push(`/projects/${graph.project.id}/objects/${pinnedObject.object_id}`)} type="button">
                      <span>{objectTypeConfig[pinnedObject.objects.type].label}</span>
                      <strong>{pinnedObject.objects.title}</strong>
                    </button>
                    <button aria-label={`Unpin ${pinnedObject.objects.title}`} className="unpin-object" onClick={() => setPinnedObjectId(null)} title="Unpin" type="button">×</button>
                  </div>
                </div>
              )}
              <div className="navigator-canvas">
                <div className="navigator-toolbar" role="toolbar" aria-label="Navigator controls">
                  <button aria-label="Zoom in" onClick={() => navigatorInstance?.zoomIn({ duration: 120 })} title="Zoom in" type="button">+</button>
                  <button aria-label="Zoom out" onClick={() => navigatorInstance?.zoomOut({ duration: 120 })} title="Zoom out" type="button">−</button>
                  <button aria-label="Focus current Object" onClick={() => focusCurrent()} title="Focus current" type="button">◎</button>
                  <button aria-label="Fit entire Graph" onClick={fitGraph} title="Fit Graph" type="button">⊡</button>
                </div>
                <ReactFlow<NavigatorNode, Edge>
                  edges={edges}
                  minZoom={0.25}
                  nodeTypes={nodeTypes}
                  nodes={nodes}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  onInit={(instance) => {
                    setNavigatorInstance(instance);
                    window.requestAnimationFrame(() => focusCurrent(instance));
                  }}
                  onNodeClick={openObject}
                  panOnDrag
                  proOptions={{ hideAttribution: true }}
                  zoomOnDoubleClick={false}
                >
                  <Background color="#e2e8f0" gap={18} size={1} />
                </ReactFlow>
              </div>
              <div
                aria-label="Resize Navigator"
                className="navigator-divider"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setResizingNavigator(true);
                }}
                role="separator"
              />
            </aside>
          )}

          <main className="workspace-main">
            {currentObject.type === "study" ? (
              <StudyWorkspace graph={graph} onObjectUpdated={applyIntrinsicObjectUpdate} section={studySection} study={currentObject} />
            ) : (
              <>
                <div className="workspace-object-header" style={{ "--object-color": config.color, "--object-surface": config.surface } as React.CSSProperties}>
                  <span className="workspace-object-type">{config.label}</span>
                  <h1>{currentObject.title}</h1>
                  <span className="workspace-status">
                    {isCompletionStatus(status) && <span aria-hidden="true">✓ </span>}
                    {formatStatus(status, config.defaultStatus)}
                  </span>
                </div>
                <section className="workspace-placeholder" aria-label={`${config.label} workspace`}>
                  <p className="eyebrow">Workspace shell</p>
                  <h2>{config.label} workspace</h2>
                  <p>Detailed work for this Object will appear here in a later milestone. The Navigator keeps the Project reasoning context available while you work.</p>
                </section>
              </>
            )}
          </main>
        </div>
      </section>
    </AppShell>
  );
}

// Navigator-only coordinates retain the Full Graph's relative spatial memory
// while reducing whitespace for compact, readable cards. They are never saved.
function compactNavigatorPosition(x: number, y: number) {
  return { x: x * navigatorCoordinateScale, y: y * navigatorCoordinateScale };
}
