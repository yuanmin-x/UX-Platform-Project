import { searchExistingObjects } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(
      await searchExistingObjects({
        query: searchParams.get("query") ?? undefined,
        type: searchParams.get("type") ?? undefined,
      }),
    );
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to search existing Objects.";
}
