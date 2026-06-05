"use client";

import { FormEvent, useMemo, useState } from "react";
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
    <main className="mx-auto w-[min(100%-24px,1040px)] flex-1 px-0 py-8 md:w-[min(100%-48px,1040px)] md:py-12">
      <section className="mb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusPill tone="server">Network feedback</StatusPill>
          <StatusPill tone="warning">No file attachments</StatusPill>
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Report a problem or request a tool
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Tell me what broke, what confused you, or what tool you want next. This form sends text feedback only; your media files are not uploaded.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)] md:p-6">
          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Report type</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {REPORT_TYPES.map((item) => {
                  const Icon = item.icon;
                  const selected = type === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setType(item.value)}
                      className={`flex items-center rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "border-purple-300 bg-purple-50 text-purple-800"
                          : "border-border bg-white text-muted-foreground hover:border-purple-200 hover:text-foreground"
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="tool" className="mb-2 block">Tool or page</Label>
              <select
                id="tool"
                value={tool}
                onChange={(event) => setTool(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {TOOL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="message" className="mb-2 block">What should I know?</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Example: Video upscaler export stops at 40%, or please add batch image conversion."
                className="min-h-40 bg-white"
                maxLength={4000}
                required
              />
              <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>Include the browser, file type, and steps if it is a bug. Do not paste private data.</span>
                <span className="font-mono">{message.length}/4000</span>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">Email or handle (optional)</Label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Only if you want a reply"
                className="bg-white"
                maxLength={180}
              />
            </div>

            {submitState.status === "success" && (
              <div className="flex items-start rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
                <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4" />
                {submitState.message}
              </div>
            )}

            {submitState.status === "error" && (
              <div className="flex items-start rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4" />
                {submitState.message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={submitState.status === "submitting"}>
                <Send className="mr-2 h-4 w-4" />
                {submitState.status === "submitting" ? "Sending" : "Send report"}
              </Button>
              <Link href={githubIssueUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open GitHub issue
              </Link>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-sm font-semibold text-foreground">What gets sent</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Report type, selected tool, and your message.</li>
              <li>Optional contact field if you fill it.</li>
              <li>Current page URL and browser user agent for debugging.</li>
              <li>No media files, documents, or generated exports.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5">
            <h2 className="text-sm font-semibold text-purple-950">For reliable delivery</h2>
            <p className="mt-3 text-sm leading-6 text-purple-800">
              Set <span className="font-mono">MEDIAFORGE_REPORT_WEBHOOK_URL</span> in deployment settings. Discord, Slack, and generic JSON webhooks are supported.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
