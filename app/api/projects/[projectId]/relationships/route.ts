import { createRelationship, deleteRelationship } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const relationship = await createRelationship(projectId, await request.json());
    return NextResponse.json(relationship, { status: 201 });
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
    const { relationshipId } = (await request.json()) as { relationshipId?: unknown };
    if (typeof relationshipId !== "string") throw new Error("A relationship ID is required.");

    await deleteRelationship(projectId, relationshipId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to connect objects.";
}
