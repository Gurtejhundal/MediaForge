"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bug, CheckCircle2, ExternalLink, Lightbulb, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/workspace-components";

const REPORT_TYPES = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "feature", label: "Feature idea", icon: Lightbulb },
  { value: "tool-request", label: "Tool request", icon: MessageSquareText },
  { value: "privacy", label: "Privacy concern", icon: ShieldCheck },
  { value: "other", label: "Other", icon: AlertCircle },
];

const TOOL_OPTIONS = [
  "Homepage",
  "Image Modifier",
  "Image Detailer",
  "Background Remover",
  "Favicon Builder",
  "Image Converter",
  "Image Resizer",
  "Image Compressor",
  "Audio Studio",
  "Video to Audio",
  "Video Converter",
  "Video Upscaler",
  "Frame Extractor",
  "Watermark Remover",
  "PDF Organizer",
  "Universal File Converter",
  "QR Generator",
  "Video Downloader",
  "Other",
];

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ReportPage() {
  const [type, setType] = useState("bug");
  const [tool, setTool] = useState("Homepage");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    window.document.title = "Report a problem | MediaForge";
  }, []);

  const githubIssueUrl = useMemo(() => {
    const title = `[${type}] ${tool}`;
    const body = [
      "## What happened or what should be added?",
      message || "(Write the issue here.)",
      "",
      "## Tool/page",
      tool,
      "",
      "## Report type",
      type,
    ].join("\n");

    return `https://github.com/Gurtejhundal/MediaForge/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }, [message, tool, type]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (message.trim().length < 10) {
      setSubmitState({ status: "error", message: "Write at least 10 characters so the report is useful." });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          tool,
          message,
          email,
          website,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Report could not be submitted.");
      }

      setSubmitState({
        status: "success",
        message: result.message || "Report submitted.",
      });
      setMessage("");
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Report could not be submitted.",
      });
    }
  }

  return (
    <main className="mx-auto w-[min(100%-24px,1120px)] flex-1 py-8 md:w-[min(100%-48px,1120px)] md:py-12">
      <section className="mb-8 border-y border-border bg-card px-4 py-6 md:px-6 md:py-8">
        <div className="mb-5 flex flex-wrap gap-2">
          <StatusPill tone="server">Network feedback</StatusPill>
          <StatusPill tone="warning">No file attachments</StatusPill>
        </div>
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Feedback ticket / 01</p>
        <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-foreground md:text-5xl">
          Report a problem or request a tool
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
          Tell me what broke, what confused you, or what tool you want next. This form sends text feedback only; your media files are not uploaded.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} className="border border-border bg-card p-4 md:p-6">
          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">01 / Report type</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {REPORT_TYPES.map((item) => {
                  const Icon = item.icon;
                  const selected = type === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(item.value)}
                      className={`flex min-h-11 items-center rounded-sm border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="border-t border-border pt-6">
              <Label htmlFor="tool" className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">02 / Tool or page</Label>
              <select
                id="tool"
                value={tool}
                onChange={(event) => setTool(event.target.value)}
                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45"
              >
                {TOOL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-border pt-6">
              <Label htmlFor="message" className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">03 / What should I know?</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Example: Video upscaler export stops at 40%, or please add batch image conversion."
                className="min-h-44 resize-y rounded-sm bg-background p-3 leading-6"
                maxLength={4000}
                required
              />
              <div className="mt-2 flex flex-col gap-1 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between sm:gap-4">
                <span>Include the browser, file type, and steps if it is a bug. Do not paste private data.</span>
                <span className="shrink-0 font-mono tabular-nums">{message.length}/4000</span>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <Label htmlFor="email" className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">04 / Email or handle (optional)</Label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Only if you want a reply"
                className="h-11 rounded-sm bg-background"
                maxLength={180}
              />
            </div>

            {submitState.status === "success" && (
              <div role="status" aria-live="polite" className="flex items-start border-l-2 border-[var(--success)] bg-muted/40 p-3 text-sm text-foreground">
                <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                {submitState.message}
              </div>
            )}

            {submitState.status === "error" && (
              <div role="alert" className="flex items-start border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
                {submitState.message}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
              <Button type="submit" size="lg" disabled={submitState.status === "submitting"} className="h-11 rounded-sm px-5">
                <Send className="mr-2 h-4 w-4" />
                {submitState.status === "submitting" ? "Sending" : "Send report"}
              </Button>
              <Link href={githubIssueUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 rounded-sm px-5" })}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open GitHub issue
              </Link>
            </div>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="border-t-2 border-foreground bg-card px-1 py-5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Transmission record</p>
            <h2 className="mt-2 text-base font-semibold text-foreground">What gets sent</h2>
            <ul className="mt-4 border-y border-border text-sm leading-6 text-muted-foreground">
              <li className="border-b border-border py-3">Report type, selected tool, and your message.</li>
              <li className="border-b border-border py-3">Optional contact field if you fill it.</li>
              <li className="border-b border-border py-3">Current page URL and browser user agent for debugging.</li>
              <li className="py-3">No media files, documents, or generated exports.</li>
            </ul>
          </section>

          <section className="border-l-2 border-primary bg-primary/5 p-5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Delivery setup</p>
            <h2 className="mt-2 text-sm font-semibold text-foreground">For reliable delivery</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Set <span className="break-all font-mono text-foreground">MEDIAFORGE_REPORT_WEBHOOK_URL</span> in deployment settings. Discord, Slack, and generic JSON webhooks are supported.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
