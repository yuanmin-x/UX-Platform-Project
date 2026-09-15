import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="brand" href="/projects">
          Research Graph
        </Link>
        <span className="header-context">UX research workspace</span>
      </header>
      {children}
    </main>
  );
}
