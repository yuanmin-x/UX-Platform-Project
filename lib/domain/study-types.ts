import type { ResearchObject } from "@/types/domain";

export const studyTypes = ["generic", "usability_test", "interview", "survey", "ab_test", "concept_test"] as const;

export type StudyType = (typeof studyTypes)[number];

export const studyTypeConfig: Record<StudyType, { label: string }> = {
  generic: { label: "Generic Study" },
  usability_test: { label: "Usability Test" },
  interview: { label: "Interview" },
  survey: { label: "Survey" },
  ab_test: { label: "A/B Test" },
  concept_test: { label: "Concept Testing" },
};

export function isStudyType(value: unknown): value is StudyType {
  return typeof value === "string" && studyTypes.includes(value as StudyType);
}

export function getStudyType(metadata: ResearchObject["metadata"]): StudyType {
  return isStudyType(metadata.studyType) ? metadata.studyType : "generic";
}
