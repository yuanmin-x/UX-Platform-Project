import type { ObjectType } from "@/types/domain";

export const objectTypeConfig: Record<
  ObjectType,
  { label: string; color: string; validStatuses: readonly string[]; defaultStatus: string | null }
> = {
  business_problem: {
    label: "Business Problem",
    color: "#64748b",
    validStatuses: ["draft", "active", "off", "solved", "archived"],
    defaultStatus: "draft",
  },
  research_question: {
    label: "Research Question",
    color: "#6b7280",
    validStatuses: ["open", "answered", "archived"],
    defaultStatus: "open",
  },
  study: {
    label: "Study",
    color: "#2563eb",
    validStatuses: ["planned", "running", "analysis", "completed"],
    defaultStatus: "planned",
  },
  dataset: {
    label: "Dataset",
    color: "#7c3aed",
    validStatuses: ["imported", "in_use", "archived"],
    defaultStatus: "imported",
  },
  result: { label: "Result", color: "#ea580c", validStatuses: [], defaultStatus: null },
  insight: {
    label: "Insight",
    color: "#16a34a",
    validStatuses: ["working", "validated", "final", "archived"],
    defaultStatus: "working",
  },
  recommendation: { label: "Recommendation", color: "#92400e", validStatuses: [], defaultStatus: null },
};

export function formatStatus(status: string | null, fallback: string | null) {
  const value = status ?? fallback;
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "No status";
}

export function isCompletionStatus(status: string | null) {
  return status === "answered" || status === "solved" || status === "completed" || status === "final";
}
