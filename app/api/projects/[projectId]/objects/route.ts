import { createOrAttachObject, removeObjectFromProject } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const id = await createOrAttachObject(projectId, await request.json());
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const { objectId } = (await request.json()) as { objectId?: unknown };
    await removeObjectFromProject(projectId, objectId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to create or attach object.";
}
