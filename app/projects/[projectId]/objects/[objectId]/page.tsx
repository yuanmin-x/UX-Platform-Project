import { ObjectWorkspace } from "@/components/workspaces/object-workspace";
import { getProjectGraph } from "@/lib/domain/project-service";
import { notFound } from "next/navigation";

export default async function ObjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string; objectId: string }>;
}) {
  const { projectId, objectId } = await params;

  try {
    const graph = await getProjectGraph(projectId);
    const membership = graph.projectObjects.find((projectObject) => projectObject.object_id === objectId);
    if (!membership) notFound();
    return <ObjectWorkspace graph={graph} objectId={objectId} />;
  } catch {
    notFound();
  }
}
