import { objectTypeConfig } from "@/lib/domain/object-types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  ObjectType,
  Project,
  ProjectGraph,
  ProjectObject,
  Relationship,
  ResearchObject,
} from "@/types/domain";

function assertTitle(value: unknown, fieldName = "Title") {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function assertObjectType(value: unknown): asserts value is ObjectType {
  if (typeof value !== "string" || !(value in objectTypeConfig)) {
    throw new Error("A valid object type is required.");
  }
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function createProject(input: {
  name: unknown;
  description?: unknown;
  initialBusinessProblemTitle: unknown;
}) {
  const name = assertTitle(input.name, "Project name");
  const problemTitle = assertTitle(
    input.initialBusinessProblemTitle,
    "Initial Business Problem",
  );
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const { data, error } = await getSupabaseAdmin().rpc(
    "create_project_with_initial_problem",
    {
      project_name: name,
      problem_title: problemTitle,
      project_description: description,
    },
  );

  if (error) throw error;
  return data as string;
}

export async function getProjectGraph(projectId: string): Promise<ProjectGraph> {
  const supabase = getSupabaseAdmin();
  const [{ data: project, error: projectError }, { data: projectObjects, error: objectsError }, { data: relationships, error: relationshipsError }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("project_objects")
        .select("project_id, object_id, x, y, width, height, hidden, custom_color, objects(*)")
        .eq("project_id", projectId),
      supabase.from("relationships").select("*").eq("project_id", projectId),
    ]);

  if (projectError) throw projectError;
  if (objectsError) throw objectsError;
  if (relationshipsError) throw relationshipsError;

  return {
    project: project as Project,
    projectObjects: projectObjects as unknown as ProjectObject[],
    relationships: relationships as Relationship[],
  };
}

export async function createOrAttachObject(
  projectId: string,
  input: {
    objectId?: unknown;
    type?: unknown;
    title?: unknown;
    description?: unknown;
    x?: unknown;
    y?: unknown;
  },
) {
  const supabase = getSupabaseAdmin();
  const x = typeof input.x === "number" && Number.isFinite(input.x) ? input.x : 160;
  const y = typeof input.y === "number" && Number.isFinite(input.y) ? input.y : 160;

  if (typeof input.objectId === "string") {
    const { error } = await supabase.from("project_objects").insert({
      project_id: projectId,
      object_id: input.objectId,
      x,
      y,
    });
    if (error) throw error;
    return input.objectId;
  }

  assertObjectType(input.type);
  const title = assertTitle(input.title);
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const { data: object, error: objectError } = await supabase
    .from("objects")
    .insert({
      type: input.type,
      title,
      description,
      status: objectTypeConfig[input.type].defaultStatus,
    })
    .select("id")
    .single();

  if (objectError) throw objectError;

  const { error: attachmentError } = await supabase.from("project_objects").insert({
    project_id: projectId,
    object_id: object.id,
    x,
    y,
  });

  if (attachmentError) {
    await supabase.from("objects").delete().eq("id", object.id);
    throw attachmentError;
  }

  return object.id as string;
}

export async function createRelationship(
  projectId: string,
  input: { sourceObjectId: unknown; targetObjectId: unknown; label?: unknown },
) {
  if (typeof input.sourceObjectId !== "string" || typeof input.targetObjectId !== "string") {
    throw new Error("Both relationship endpoints are required.");
  }

  const label = typeof input.label === "string" && input.label.trim() ? input.label.trim() : null;
  const { data, error } = await getSupabaseAdmin()
    .from("relationships")
    .insert({
      project_id: projectId,
      source_object_id: input.sourceObjectId,
      target_object_id: input.targetObjectId,
      label,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Relationship;
}

export async function deleteRelationship(projectId: string, relationshipId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("relationships")
    .delete()
    .eq("project_id", projectId)
    .eq("id", relationshipId)
    .select("id");

  if (error) throw error;
  if (!data?.length) throw new Error("Relationship not found in this Project.");
}

export async function updateObjectStatus(objectId: string, status: unknown) {
  if (typeof status !== "string") throw new Error("A status is required.");

  const supabase = getSupabaseAdmin();
  const { data: object, error: objectError } = await supabase
    .from("objects")
    .select("type")
    .eq("id", objectId)
    .single();

  if (objectError) throw objectError;
  const type = object.type as ObjectType;
  if (!objectTypeConfig[type].validStatuses.includes(status)) {
    throw new Error("This status is not valid for the selected object type.");
  }

  const { data, error } = await supabase
    .from("objects")
    .update({ status })
    .eq("id", objectId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ResearchObject;
}

export async function savePositions(
  projectId: string,
  positions: Array<{ objectId: string; x: number; y: number }>,
) {
  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    positions.map(({ objectId, x, y }) =>
      supabase
        .from("project_objects")
        .update({ x, y })
        .eq("project_id", projectId)
        .eq("object_id", objectId),
    ),
  );

  const failed = results.find(({ error }) => error);
  if (failed?.error) throw failed.error;
}

export function isResearchObject(value: unknown): value is ResearchObject {
  return Boolean(value && typeof value === "object" && "id" in value && "type" in value);
}
