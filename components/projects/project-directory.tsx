"use client";

import { AppShell } from "@/components/ui/app-shell";
import type { Project } from "@/types/domain";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type ProjectForm = { name: string; description: string; initialBusinessProblemTitle: string };

const emptyForm: ProjectForm = { name: "", description: "", initialBusinessProblemTitle: "" };

export function ProjectDirectory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const response = await fetch("/api/projects");
      const body = (await response.json()) as Project[] | { error: string };
      if (!response.ok || !Array.isArray(body)) throw new Error("error" in body ? body.error : "Unable to load projects.");
      setProjects(body);
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error ?? "Unable to create project.");
      window.location.assign(`/projects/${body.id}`);
    } catch (caughtError) {
      setError(getMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="directory-layout">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Your research work</h1>
          <p className="muted">Projects are working boundaries. The graph inside each project organizes reasoning.</p>
        </div>
        <form className="panel create-project" onSubmit={submit}>
          <h2>New project</h2>
          <label>
            Project name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Improve onboarding"
            />
          </label>
          <label>
            Initial Business Problem
            <input
              required
              value={form.initialBusinessProblemTitle}
              onChange={(event) => setForm({ ...form, initialBusinessProblemTitle: event.target.value })}
              placeholder="Why are new users not activating?"
            />
          </label>
          <label>
            Description <span className="muted">(optional)</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="A short working brief"
              rows={3}
            />
          </label>
          {error && <p className="error-message">{error}</p>}
          <button disabled={submitting} type="submit">
            {submitting ? "Creating…" : "Create project"}
          </button>
        </form>
        <section className="project-list" aria-label="Existing projects">
          <h2>Recent projects</h2>
          {loading && <p className="muted">Loading projects…</p>}
          {!loading && projects.length === 0 && <p className="muted">No projects yet.</p>}
          {projects.map((project) => (
            <Link className="project-row" href={`/projects/${project.id}`} key={project.id}>
              <span>
                <strong>{project.name}</strong>
                <small>{project.description || "No description"}</small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </section>
      </section>
    </AppShell>
  );
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
