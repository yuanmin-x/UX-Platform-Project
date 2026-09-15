import type { ObjectType } from "@/types/domain";

export const objectTypeConfig: Record<
  ObjectType,
  { label: string; color: string; surface: string; namePlaceholder: string; validStatuses: readonly string[]; defaultStatus: string | null }
> = {
  business_problem: {
    label: "Business Problem",
    color: "#475569",
    surface: "#f8fafc",
    namePlaceholder: "What problem are we trying to solve?",
    validStatuses: ["draft", "active", "off", "solved", "archived"],
    defaultStatus: "draft",
  },
  research_question: {
    label: "Research Question",
    color: "#d6a63b",
    surface: "#fffaf0",
    namePlaceholder: "What do we need to learn?",
    validStatuses: ["open", "answered", "archived"],
    defaultStatus: "open",
  },
  study: {
    label: "Study",
    color: "#3b82f6",
    surface: "#eff6ff",
    namePlaceholder: "Name this study",
    validStatuses: ["planned", "running", "analysis", "completed"],
    defaultStatus: "planned",
  },
  dataset: {
    label: "Dataset",
    color: "#8b5cf6",
    surface: "#f5f3ff",
    namePlaceholder: "Name this dataset",
    validStatuses: ["imported", "in_use", "archived"],
    defaultStatus: "imported",
  },
  result: { label: "Result", color: "#f59e0b", surface: "#fff7ed", namePlaceholder: "What did the data show?", validStatuses: [], defaultStatus: null },
  insight: {
    label: "Insight",
    color: "#22c55e",
    surface: "#f0fdf4",
    namePlaceholder: "What does this mean?",
    validStatuses: ["working", "validated", "final", "archived"],
    defaultStatus: "working",
  },
  recommendation: { label: "Recommendation", color: "#8b5e3c", surface: "#faf7f3", namePlaceholder: "What should we do?", validStatuses: [], defaultStatus: null },
};

export function formatStatus(status: string | null, fallback: string | null) {
  const value = status ?? fallback;
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "No status";
}

export function isCompletionStatus(status: string | null) {
  return status === "answered" || status === "solved" || status === "completed" || status === "final";
}
