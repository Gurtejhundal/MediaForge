import type { Metadata } from "next";

export const metadata: Metadata = { title: "Image Compressor | MediaForge" };

export default function ToolRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
