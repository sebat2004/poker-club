import { getPublicProfiles } from "@/app/lib/profiles";

export const runtime = "nodejs";

/* Public — no auth required. Only returns profiles where is_public = true
   and completed_at IS NOT NULL. Active vs. history split is computed
   server-side against the live ALLOWED_MEMBER_EMAILS env var. */
export async function GET() {
  try {
    const data = await getPublicProfiles();
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
