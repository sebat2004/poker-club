import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { auth } from "@/app/lib/auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/* ---------------------------------------------------------------------------
 * POST /api/profiles/avatar
 *
 * Accepts a multipart FormData upload with a single "file" field.
 * Validates type + size, uploads to Vercel Blob under the `avatars/` prefix,
 * and returns the public URL. The client then saves that URL via
 * POST /api/profiles/me.
 *
 * Requires BLOB_READ_WRITE_TOKEN in environment (set in Vercel dashboard or
 * .env.local for local dev — get it from Storage → your blob store → Connect).
 * ------------------------------------------------------------------------- */
export async function POST(request: Request) {
  /* Auth check — any signed-in user may upload their own avatar. */
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Image must be under 5 MB." },
      { status: 400 },
    );
  }

  try {
    /* Use the user's email (sanitised) + timestamp in the key so old uploads
       don't pile up indefinitely but the current one is always findable. */
    const safeEmail = email.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const ext = file.type === "image/jpeg" ? "jpg"
              : file.type === "image/png"  ? "png"
              : file.type === "image/webp" ? "webp"
              : "gif";
    const pathname = `avatars/${safeEmail}-${Date.now()}.${ext}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Avatar upload failed:", message);
    return Response.json(
      { error: "Upload failed. Make sure BLOB_READ_WRITE_TOKEN is set." },
      { status: 500 },
    );
  }
}
