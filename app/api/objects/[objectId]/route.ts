import { updateStudyDetails } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ objectId: string }> },
) {
  try {
    const { objectId } = await context.params;
    return NextResponse.json(await updateStudyDetails(objectId, await request.json()));
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to update Study details.";
}
