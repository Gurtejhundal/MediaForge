import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
export default function NotFound() {
  return <section className="mf-faceplate mx-auto my-16 w-[min(100%-32px,720px)] p-8 md:p-12"><p className="font-mono text-sm text-primary">404 / No signal</p><h1 className="mf-display mt-4 text-5xl uppercase">That bench is empty.</h1><p className="my-6 text-muted-foreground">This address does not match a MediaForge tool. Choose an operation from the workbench.</p><Link className={buttonVariants()} href="/">Back to workbench</Link></section>;
}
