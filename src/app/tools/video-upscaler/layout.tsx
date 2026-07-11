import type { Metadata } from "next";

export const metadata: Metadata = { title: "Video Detail Upscaler | MediaForge" };

export default function ToolRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
