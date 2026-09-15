import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UX Research Graph Workspace",
  description: "Organize UX research around business problems.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
