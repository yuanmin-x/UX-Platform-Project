import { getProjectGraph } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function GET(_: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    return NextResponse.json(await getProjectGraph(projectId));
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 404 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Project not found.";
}
