import { ObjectWorkspace } from "@/components/workspaces/object-workspace";
import type { StudySection } from "@/components/workspaces/study-workspace";
import { getProjectGraph } from "@/lib/domain/project-service";
import { notFound } from "next/navigation";

const paths: Record<string, StudySection> = {
  work: "work",
  "work/collection": "collection",
  "work/analysis": "analysis",
  results: "results",
  files: "files",
  activity: "activity",
};

export default async function StudyWorkspaceSectionPage({
  params,
}: {
  params: Promise<{ projectId: string; objectId: string; studyPath: string[] }>;
}) {
  const { projectId, objectId, studyPath } = await params;
  const section = paths[studyPath.join("/")];
  if (!section) notFound();

  try {
    const graph = await getProjectGraph(projectId);
    const membership = graph.projectObjects.find((projectObject) => projectObject.object_id === objectId);
    if (!membership || membership.objects.type !== "study") notFound();
    return <ObjectWorkspace graph={graph} objectId={objectId} studySection={section} />;
  } catch {
    notFound();
  }
}
