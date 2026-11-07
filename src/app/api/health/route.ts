import manifest from "../../../../package.json";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ app: "MediaForge", version: manifest.version, instance: process.env.MEDIAFORGE_DESKTOP_INSTANCE ?? null }, { headers: { "Cache-Control": "no-store" } });
}
