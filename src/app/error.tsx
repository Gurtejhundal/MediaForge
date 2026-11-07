"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section role="alert" className="mf-faceplate mx-auto my-16 w-[min(100%-32px,720px)] p-8"><p className="font-mono text-sm text-primary">Signal interrupted</p><h1 className="mf-display mt-4 text-5xl uppercase">The workbench hit a snag.</h1><p className="my-6 text-muted-foreground">Try this view again. Downloads already saved on your device are safe. You may need to select your input file again.</p><div className="flex flex-wrap items-center gap-5"><Button onClick={reset}>Try again</Button><Link className="underline" href="/report">Report the problem</Link></div></section>;
}
