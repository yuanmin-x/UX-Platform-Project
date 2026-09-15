"use client";

import { formatStatus, objectTypeConfig } from "@/lib/domain/object-types";
import { deriveStudyResearchContext } from "@/lib/domain/study-context";
import { getStudyType, studyTypeConfig, type StudyType } from "@/lib/domain/study-types";
import type { ProjectGraph, ResearchObject } from "@/types/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useState } from "react";

export type StudySection = "overview" | "work" | "collection" | "analysis" | "results" | "files" | "activity";

type StudyForm = {
  title: string;
  status: string;
  description: string;
  studyType: StudyType;
  startDate: string;
  endDate: string;
  methodNotes: string;
};

export function StudyWorkspace({ graph, study, section, onObjectUpdated }: { graph: ProjectGraph; study: ResearchObject; section: StudySection; onObjectUpdated: (object: ResearchObject) => void }) {
  const router = useRouter();
  const [form, setForm] = useState(() => formFromStudy(study));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const basePath = `/projects/${graph.project.id}/objects/${study.id}`;
  const studyType = getStudyType(study.metadata);

  useEffect(() => setForm(formFromStudy(study)), [study]);

  const researchContext = useMemo(() => deriveStudyResearchContext(graph, study.id), [graph, study.id]);

  async function saveOverview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/objects/${study.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as ResearchObject | { error?: string };
      if (!response.ok || !("id" in body)) throw new Error("error" in body ? body.error ?? "Unable to save Study." : "Unable to save Study.");
      setForm(formFromStudy(body));
      onObjectUpdated(body);
      setSaveState("saved");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save Study.");
      setSaveState("error");
    }
  }

  return (
    <section className="study-workspace">
      <header className="study-workspace-header">
        <span className="study-header-type">STUDY · {studyTypeConfig[studyType].label.toUpperCase()}</span>
        <h1>{study.title}</h1>
        <span className="workspace-status">{formatStatus(study.status, objectTypeConfig.study.defaultStatus)}</span>
      </header>

      <nav className="study-tabs" aria-label="Study Workspace sections">
        <StudyTab href={basePath} label="Overview" selected={section === "overview"} />
        <StudyTab href={`${basePath}/work`} label="Work" selected={section === "work" || section === "collection" || section === "analysis"} />
        <StudyTab href={`${basePath}/results`} label="Results" selected={section === "results"} />
        <StudyTab href={`${basePath}/files`} label="Files" selected={section === "files"} />
        <StudyTab href={`${basePath}/activity`} label="Activity" selected={section === "activity"} />
      </nav>

      {(section === "work" || section === "collection" || section === "analysis") && (
        <nav className="study-subtabs" aria-label="Study Work sections">
          <StudyTab href={`${basePath}/work/collection`} label="Collection" selected={section === "collection"} />
          <StudyTab href={`${basePath}/work/analysis`} label="Analysis" selected={section === "analysis"} />
        </nav>
      )}

      {section === "overview" && (
        <form className="study-overview" onSubmit={saveOverview}>
          <section className="study-section">
            <div className="study-section-heading"><h2>Objective</h2><span>What this Study is intended to learn</span></div>
            <textarea onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the objective of this Study" rows={4} value={form.description} />
          </section>

          <section className="study-section">
            <div className="study-section-heading"><h2>Research Context</h2><span>Direct context and Business Problems via directly connected Research Questions</span></div>
            <BusinessProblemList basePath={basePath} entries={researchContext.businessProblems} />
            <RelationshipList basePath={basePath} empty="No directly connected Research Questions." objects={researchContext.researchQuestions} title="Related Research Questions" />
          </section>

          <section className="study-section">
            <div className="study-section-heading"><h2>Study Details</h2><span>Intrinsic Study properties shared wherever this Study is reused</span></div>
            <div className="study-field-grid">
              <label>Study Name<input onChange={(event) => setForm({ ...form, title: event.target.value })} value={form.title} /></label>
              <label>Study Type<select onChange={(event) => setForm({ ...form, studyType: event.target.value as StudyType })} value={form.studyType}>{Object.entries(studyTypeConfig).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select></label>
              <label>Status<select onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>{objectTypeConfig.study.validStatuses.map((status) => <option key={status} value={status}>{formatStatus(status, null)}</option>)}</select></label>
              <label>Start Date<input onChange={(event) => setForm({ ...form, startDate: event.target.value })} type="date" value={form.startDate} /></label>
              <label>End Date<input onChange={(event) => setForm({ ...form, endDate: event.target.value })} type="date" value={form.endDate} /></label>
            </div>
          </section>

          <section className="study-section">
            <div className="study-section-heading"><h2>Method</h2><span>Lightweight configuration for {studyTypeConfig[form.studyType].label}</span></div>
            <textarea onChange={(event) => setForm({ ...form, methodNotes: event.target.value })} placeholder="Add method notes" rows={4} value={form.methodNotes} />
          </section>

          <div className="study-save-row">
            <button disabled={saveState === "saving"} type="submit">{saveState === "saving" ? "Saving…" : "Save changes"}</button>
            {saveState === "saved" && <span className="save-state">Saved</span>}
            {error && <span className="error-message">{error}</span>}
          </div>
        </form>
      )}

      {section === "work" && <Placeholder title="Work"><p>Choose Collection or Analysis to enter the future execution and analysis surfaces for this Study.</p></Placeholder>}
      {section === "collection" && <Placeholder title="Collection"><p>Collection tools for this Study type will be implemented in Milestone 5.</p></Placeholder>}
      {section === "analysis" && <Placeholder title="Analysis"><p>Analysis tools will be implemented in Milestone 6.</p></Placeholder>}
      {section === "results" && <Placeholder title="Results"><p>Results promoted from Study analysis will appear here.</p></Placeholder>}
      {section === "files" && <Placeholder title="Files"><p>Study files will appear here in a later milestone.</p></Placeholder>}
      {section === "activity" && <Placeholder title="Activity"><p>Study activity will appear here in a later milestone.</p></Placeholder>}
    </section>
  );
}

function StudyTab({ href, label, selected }: { href: string; label: string; selected: boolean }) {
  return <Link aria-current={selected ? "page" : undefined} className={selected ? "is-active" : ""} href={href as Route}>{label}</Link>;
}

function RelationshipList({ basePath, empty, objects, title }: { basePath: string; empty: string; objects: ResearchObject[]; title: string }) {
  return (
    <div className="study-relationship-list">
      <h3>{title}</h3>
      {objects.length ? objects.map((object) => <Link href={`${basePath.split("/objects/")[0]}/objects/${object.id}` as Route} key={object.id}>{object.title}</Link>) : <p>{empty}</p>}
    </div>
  );
}

function BusinessProblemList({ basePath, entries }: { basePath: string; entries: Array<{ object: ResearchObject; direct: boolean; viaResearchQuestions: string[] }> }) {
  return (
    <div className="study-relationship-list">
      <h3>Related Business Problems</h3>
      {entries.length ? entries.map(({ object, direct, viaResearchQuestions }) => (
        <div className="study-context-object" key={object.id}>
          <Link href={`${basePath.split("/objects/")[0]}/objects/${object.id}` as Route}>{object.title}</Link>
          <span>{direct ? "Direct" : `via ${[...new Set(viaResearchQuestions)].join(", ")}`}</span>
        </div>
      )) : <p>No related Business Problems in this Project context.</p>}
    </div>
  );
}

function Placeholder({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="study-placeholder"><h2>{title}</h2>{children}</section>;
}

function formFromStudy(study: ResearchObject): StudyForm {
  return {
    title: study.title,
    status: study.status ?? "planned",
    description: study.description ?? "",
    studyType: getStudyType(study.metadata),
    startDate: typeof study.metadata.startDate === "string" ? study.metadata.startDate : "",
    endDate: typeof study.metadata.endDate === "string" ? study.metadata.endDate : "",
    methodNotes: typeof study.metadata.methodNotes === "string" ? study.metadata.methodNotes : "",
  };
}
