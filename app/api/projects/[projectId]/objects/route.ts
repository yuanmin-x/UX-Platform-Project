import { createOrAttachObject } from "@/lib/domain/project-service";
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

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to create or attach object.";
}
