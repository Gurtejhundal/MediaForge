import type { Metadata } from "next";

export const metadata: Metadata = { title: "Video Frame Extractor | MediaForge" };

export default function ToolRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
