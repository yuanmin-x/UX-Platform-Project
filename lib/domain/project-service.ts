import { objectTypeConfig } from "@/lib/domain/object-types";
import { isStudyType } from "@/lib/domain/study-types";
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

function assertObjectId(value: unknown) {
  if (typeof value !== "string") throw new Error("A valid Object ID is required.");
  const objectId = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(objectId)) {
    throw new Error("A valid Object ID is required.");
  }
  return objectId;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export type ExistingObjectSearchResult = Pick<ResearchObject, "id" | "type" | "title" | "status"> & {
  projects: Array<{ id: string; name: string }>;
};

export async function searchExistingObjects(input: { query?: string; type?: string }) {
  const supabase = getSupabaseAdmin();
  const query = input.query?.trim() ?? "";
  let request = supabase
    .from("objects")
    .select("id, type, title, status, project_objects(project_id, projects(name))")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (query) request = request.ilike("title", `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  if (input.type) {
    assertObjectType(input.type);
    request = request.eq("type", input.type);
  }

  const { data, error } = await request;
  if (error) throw error;

  const records = (data ?? []) as unknown as Array<{
    id: string;
    type: ObjectType;
    title: string;
    status: string | null;
    project_objects: Array<{ project_id: string; projects: { name: string } | null }>;
  }>;
  return records.map((record) => ({
    id: record.id,
    type: record.type,
    title: record.title,
    status: record.status,
    projects: (record.project_objects ?? []).map((membership) => ({
      id: membership.project_id,
      name: membership.projects?.name ?? "Unnamed Project",
    })),
  })) satisfies ExistingObjectSearchResult[];
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
    studyType?: unknown;
    x?: unknown;
    y?: unknown;
  },
) {
  const supabase = getSupabaseAdmin();
  const x = typeof input.x === "number" && Number.isFinite(input.x) ? input.x : 160;
  const y = typeof input.y === "number" && Number.isFinite(input.y) ? input.y : 160;

  if (typeof input.objectId === "string" && input.objectId.trim()) {
    const objectId = assertObjectId(input.objectId);
    const { data: existingObject, error: objectError } = await supabase
      .from("objects")
      .select("id")
      .eq("id", objectId)
      .maybeSingle();
    if (objectError) throw objectError;
    if (!existingObject) throw new Error("No Object exists with this Object ID.");

    const { data: existingMembership, error: membershipError } = await supabase
      .from("project_objects")
      .select("object_id")
      .eq("project_id", projectId)
      .eq("object_id", objectId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (existingMembership) throw new Error("This Object is already attached to this Project.");

    const { error } = await supabase.from("project_objects").insert({
      project_id: projectId,
      object_id: objectId,
      x,
      y,
    });
    if (error) throw error;
    return objectId;
  }

  assertObjectType(input.type);
  const title = assertTitle(input.title);
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (input.type === "study" && input.studyType !== undefined && !isStudyType(input.studyType)) {
    throw new Error("A valid Study Type is required.");
  }
  const { data: object, error: objectError } = await supabase
    .from("objects")
    .insert({
      type: input.type,
      title,
      description,
      status: objectTypeConfig[input.type].defaultStatus,
      metadata: input.type === "study" ? { studyType: input.studyType ?? "generic" } : {},
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

/**
 * Removes only the current Project's membership and relationships. Object
 * identity and memberships/relationships in other Projects remain intact.
 */
export async function removeObjectFromProject(projectId: string, objectId: unknown) {
  const normalizedObjectId = assertObjectId(objectId);
  const supabase = getSupabaseAdmin();
  const { data: membership, error: membershipError } = await supabase
    .from("project_objects")
    .select("object_id")
    .eq("project_id", projectId)
    .eq("object_id", normalizedObjectId)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error("This Object is not attached to this Project.");

  const { error: relationshipError } = await supabase
    .from("relationships")
    .delete()
    .eq("project_id", projectId)
    .or(`source_object_id.eq.${normalizedObjectId},target_object_id.eq.${normalizedObjectId}`);
  if (relationshipError) throw relationshipError;

  const { data, error: removalError } = await supabase
    .from("project_objects")
    .delete()
    .eq("project_id", projectId)
    .eq("object_id", normalizedObjectId)
    .select("object_id");
  if (removalError) throw removalError;
  if (!data?.length) throw new Error("Unable to remove this Object from the Project.");
}

export async function createRelationship(
  projectId: string,
  input: {
    sourceObjectId: unknown;
    targetObjectId: unknown;
    label?: unknown;
    sourceHandle?: unknown;
    targetHandle?: unknown;
  },
) {
  if (typeof input.sourceObjectId !== "string" || typeof input.targetObjectId !== "string") {
    throw new Error("Both relationship endpoints are required.");
  }

  const label = typeof input.label === "string" && input.label.trim() ? input.label.trim() : null;
  const sourceHandle = typeof input.sourceHandle === "string" && input.sourceHandle.trim() ? input.sourceHandle.trim() : null;
  const targetHandle = typeof input.targetHandle === "string" && input.targetHandle.trim() ? input.targetHandle.trim() : null;
  const { data, error } = await getSupabaseAdmin()
    .from("relationships")
    .insert({
      project_id: projectId,
      source_object_id: input.sourceObjectId,
      target_object_id: input.targetObjectId,
      label,
      source_handle: sourceHandle,
      target_handle: targetHandle,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Relationship;
}

export async function updateRelationship(
  projectId: string,
  relationshipId: string,
  input: { sourceObjectId?: unknown; targetObjectId?: unknown; label?: unknown; sourceHandle?: unknown; targetHandle?: unknown },
) {
  const update: Record<string, string | null> = {};

  if ("sourceObjectId" in input) {
    if (typeof input.sourceObjectId !== "string") throw new Error("A valid source object is required.");
    update.source_object_id = input.sourceObjectId;
  }
  if ("targetObjectId" in input) {
    if (typeof input.targetObjectId !== "string") throw new Error("A valid target object is required.");
    update.target_object_id = input.targetObjectId;
  }
  if ("label" in input) update.label = typeof input.label === "string" && input.label.trim() ? input.label.trim() : null;
  if ("sourceHandle" in input) update.source_handle = typeof input.sourceHandle === "string" && input.sourceHandle.trim() ? input.sourceHandle.trim() : null;
  if ("targetHandle" in input) update.target_handle = typeof input.targetHandle === "string" && input.targetHandle.trim() ? input.targetHandle.trim() : null;
  if (!Object.keys(update).length) throw new Error("No relationship changes were provided.");

  const { data, error } = await getSupabaseAdmin()
    .from("relationships")
    .update(update)
    .eq("project_id", projectId)
    .eq("id", relationshipId)
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

export async function updateStudyDetails(
  objectId: string,
  input: {
    title?: unknown;
    status?: unknown;
    description?: unknown;
    studyType?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    methodNotes?: unknown;
  },
) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("objects")
    .select("*")
    .eq("id", objectId)
    .single();
  if (existingError) throw existingError;
  if (existing.type !== "study") throw new Error("Only Study Objects can use Study details.");

  const update: Record<string, unknown> = {};
  if ("title" in input) update.title = assertTitle(input.title, "Study name");
  if ("status" in input) {
    if (typeof input.status !== "string" || !objectTypeConfig.study.validStatuses.includes(input.status)) {
      throw new Error("This status is not valid for a Study.");
    }
    update.status = input.status;
  }
  if ("description" in input) {
    if (typeof input.description !== "string") throw new Error("Description must be text.");
    update.description = input.description.trim();
  }

  const existingMetadata = (existing.metadata ?? {}) as Record<string, unknown>;
  const metadata = { ...existingMetadata };
  let metadataChanged = false;
  if ("studyType" in input) {
    if (!isStudyType(input.studyType)) throw new Error("A valid Study Type is required.");
    metadata.studyType = input.studyType;
    metadataChanged = true;
  }
  for (const [key, value] of [["startDate", input.startDate], ["endDate", input.endDate], ["methodNotes", input.methodNotes]] as const) {
    if (key in input) {
      if (typeof value !== "string") throw new Error(`${key} must be text.`);
      if ((key === "startDate" || key === "endDate") && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`${key} must be a valid date.`);
      }
      metadata[key] = value.trim() || null;
      metadataChanged = true;
    }
  }
  if (metadataChanged) update.metadata = metadata;
  if (!Object.keys(update).length) throw new Error("No Study changes were provided.");

  const { data, error } = await supabase
    .from("objects")
    .update(update)
    .eq("id", objectId)
    .select("*")
    .single();
  if (error) throw error;
  return data as ResearchObject;
}

export async function savePositions(
  projectId: string,
  positions: Array<{ objectId: string; x: number; y: number; width?: number; height?: number }>,
) {
  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    positions.map(({ objectId, x, y, width, height }) =>
      supabase
        .from("project_objects")
        .update({
          x,
          y,
          ...(typeof width === "number" ? { width: Math.max(width, 200) } : {}),
          ...(typeof height === "number" ? { height: Math.max(height, 112) } : {}),
        })
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
