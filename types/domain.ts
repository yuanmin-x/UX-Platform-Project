export const objectTypes = [
  "business_problem",
  "research_question",
  "study",
  "dataset",
  "result",
  "insight",
  "recommendation",
] as const;

export type ObjectType = (typeof objectTypes)[number];

export type ResearchObject = {
  id: string;
  type: ObjectType;
  title: string;
  description: string;
  status: string | null;
  metadata: Record<string, unknown>;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  initial_business_problem_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectObject = {
  project_id: string;
  object_id: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  hidden: boolean;
  custom_color: string | null;
  objects: ResearchObject;
};

export type Relationship = {
  id: string;
  project_id: string;
  source_object_id: string;
  target_object_id: string;
  label: string | null;
};

export type ProjectGraph = {
  project: Project;
  projectObjects: ProjectObject[];
  relationships: Relationship[];
};
