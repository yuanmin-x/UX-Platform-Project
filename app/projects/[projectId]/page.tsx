import { ProjectGraph } from "@/components/graph/project-graph";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectGraph projectId={projectId} />;
}
