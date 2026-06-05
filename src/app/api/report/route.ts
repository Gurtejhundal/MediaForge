import { NextRequest, NextResponse } from "next/server";

const REPORT_TYPES = new Set(["bug", "feature", "tool-request", "privacy", "other"]);
const MAX_MESSAGE_LENGTH = 4000;
const MAX_SHORT_LENGTH = 180;

type ReportRequest = {
  type?: unknown;
  tool?: unknown;
  message?: unknown;
  email?: unknown;
  pageUrl?: unknown;
  browser?: unknown;
  website?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultiline(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function reportSummary(report: {
  id: string;
  type: string;
  tool: string;
  message: string;
  email: string;
  pageUrl: string;
  browser: string;
  createdAt: string;
}) {
  return [
    `MediaForge report ${report.id}`,
    `Type: ${report.type}`,
    `Tool/page: ${report.tool || "Not specified"}`,
    `URL: ${report.pageUrl || "Not provided"}`,
    `Contact: ${report.email || "Not provided"}`,
    `Browser: ${report.browser || "Not provided"}`,
    "",
    report.message,
  ].join("\n");
}

async function sendWebhook(webhookUrl: string, report: ReturnType<typeof buildReport>) {
  const summary = reportSummary(report);
  const url = webhookUrl.toLowerCase();

  const body = url.includes("discord.com/api/webhooks")
    ? {
        content: summary.slice(0, 1900),
      }
    : url.includes("hooks.slack.com")
      ? {
          text: summary,
        }
      : report;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Webhook rejected report with ${response.status}`);
  }
}

function buildReport(body: ReportRequest, request: NextRequest) {
  const type = cleanText(body.type, 40);
  const normalizedType = REPORT_TYPES.has(type) ? type : "other";

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    type: normalizedType,
    tool: cleanText(body.tool, MAX_SHORT_LENGTH),
    message: cleanMultiline(body.message, MAX_MESSAGE_LENGTH),
    email: cleanText(body.email, MAX_SHORT_LENGTH),
    pageUrl: cleanText(body.pageUrl, 500),
    browser: cleanText(body.browser, 500),
    userAgent: request.headers.get("user-agent") || "",
  };
}

export async function POST(request: NextRequest) {
  let body: ReportRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Honeypot field. Real users never see this input.
  if (cleanText(body.website, 200)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const report = buildReport(body, request);

  if (report.message.length < 10) {
    return NextResponse.json({ error: "Report message must be at least 10 characters." }, { status: 400 });
  }

  console.info("mediaforge_report", JSON.stringify(report));

  const webhookUrl = process.env.MEDIAFORGE_REPORT_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        ok: true,
        delivered: false,
        message: "Report logged on the server. Configure MEDIAFORGE_REPORT_WEBHOOK_URL for external delivery.",
      },
      { status: 202 },
    );
  }

  try {
    await sendWebhook(webhookUrl, report);
  } catch (error) {
    console.error("mediaforge_report_webhook_failed", error);
    return NextResponse.json(
      {
        ok: true,
        delivered: false,
        message: "Report logged on the server, but webhook delivery failed.",
      },
      { status: 202 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true, message: "Report sent." });
}
