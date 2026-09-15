import { savePositions } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const body = (await request.json()) as { positions?: unknown };
    if (!Array.isArray(body.positions)) throw new Error("Positions must be an array.");

    const positions = body.positions.map((position) => {
      if (
        !position ||
        typeof position !== "object" ||
        !("objectId" in position) ||
        !("x" in position) ||
        !("y" in position) ||
        typeof position.objectId !== "string" ||
        typeof position.x !== "number" ||
        typeof position.y !== "number"
      ) {
        throw new Error("Every position must contain objectId, x, and y.");
      }
      return position;
    });

    await savePositions(projectId, positions);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save graph positions.";
}
