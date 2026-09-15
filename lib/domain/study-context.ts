import type { ProjectGraph, ResearchObject } from "@/types/domain";

export type StudyBusinessProblemContext = {
  object: ResearchObject;
  direct: boolean;
  viaResearchQuestions: string[];
};

export type StudyResearchContext = {
  researchQuestions: ResearchObject[];
  businessProblems: StudyBusinessProblemContext[];
};

/**
 * Derives only the bounded Project-scoped Study context: direct RQs/BPs plus
 * BPs one hop beyond a direct RQ. It deliberately never walks farther.
 */
export function deriveStudyResearchContext(graph: ProjectGraph, studyId: string): StudyResearchContext {
  const objectsById = new Map(graph.projectObjects.map((projectObject) => [projectObject.object_id, projectObject.objects]));
  const connectedTo = (objectId: string) =>
    graph.relationships.flatMap((relationship) => {
      if (relationship.source_object_id === objectId) return [relationship.target_object_id];
      if (relationship.target_object_id === objectId) return [relationship.source_object_id];
      return [];
    });
  const directObjects = [...new Set(connectedTo(studyId))]
    .map((id) => objectsById.get(id))
    .filter((object): object is ResearchObject => Boolean(object));
  const researchQuestions = directObjects.filter((object) => object.type === "research_question");
  const businessProblems = new Map<string, StudyBusinessProblemContext>();

  for (const object of directObjects.filter((candidate) => candidate.type === "business_problem")) {
    businessProblems.set(object.id, { object, direct: true, viaResearchQuestions: [] });
  }
  for (const researchQuestion of researchQuestions) {
    for (const linkedId of new Set(connectedTo(researchQuestion.id))) {
      const linkedObject = objectsById.get(linkedId);
      if (!linkedObject || linkedObject.type !== "business_problem") continue;
      const existing = businessProblems.get(linkedObject.id);
      if (existing?.direct) continue;
      if (existing) existing.viaResearchQuestions.push(researchQuestion.title);
      else businessProblems.set(linkedObject.id, { object: linkedObject, direct: false, viaResearchQuestions: [researchQuestion.title] });
    }
  }
  return {
    researchQuestions,
    businessProblems: [...businessProblems.values()].map((entry) => ({
      ...entry,
      viaResearchQuestions: [...new Set(entry.viaResearchQuestions)],
    })),
  };
}
