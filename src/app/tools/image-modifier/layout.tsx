import type { Metadata } from "next";

export const metadata: Metadata = { title: "Image Modifier | MediaForge" };

export default function ToolRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
