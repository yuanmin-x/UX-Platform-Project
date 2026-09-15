import { createProject, listProjects } from "@/lib/domain/project-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(await listProjects());
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const id = await createProject(await request.json());
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getMessage(error) }, { status: 400 });
  }
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
