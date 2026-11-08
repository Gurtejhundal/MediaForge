"use client";
import { ToolLayout } from "@/components/tool-layout";
import { ImageCleanup } from "@/components/image-cleanup";

export default function ImageCleanupPage() {
  return <ToolLayout title="Visible watermark cropper" description="Trim a visible edge or corner mark from your own image, preview the result and save a PNG locally. Invisible SynthID removal is unverified.">
    <ImageCleanup />
  </ToolLayout>;
}
