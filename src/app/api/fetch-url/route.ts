// This legacy proxy has no active UI callers. Local tools accept files directly.
export async function POST() {
  return Response.json({ error: "URL imports are disabled. Choose a local file instead." }, { status: 410 });
}
