import type { Metadata } from "next";

export const metadata: Metadata = { title: "Document Studio | MediaForge" };

export default function ToolRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
