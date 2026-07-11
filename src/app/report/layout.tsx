import type { Metadata } from "next";

export const metadata: Metadata = { title: "Report a problem | MediaForge" };

export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
