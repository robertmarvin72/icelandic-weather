import { handleUpload } from "@vercel/blob/client";
import { isAdminEmail } from "./_lib/admin.js";
import { getMeFromRequest } from "./_lib/getMe.js";

const ALLOWED_MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;
const BLOG_MEDIA_PATHNAME_PREFIX = "blog-media/";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Diagnostic only — does not change response behavior. handleUpload()'s own
  // token resolution (getReadWriteBlobTokenFromOptionsOrEnv) runs before
  // onBeforeGenerateToken and throws its own error either way; this just
  // makes the actionable cause visible in server logs, since Node does not
  // hot-reload .env files into an already-running process — a dev server
  // started before BLOB_READ_WRITE_TOKEN was added/pulled will not see it
  // until restarted.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "[blog-upload] BLOB_READ_WRITE_TOKEN is not set in this process. " +
        "If you just added or pulled Blob environment variables, restart the dev server."
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Browser trust boundary — this callback only runs for the
        // "blob.generate-client-token" event, which originates from the
        // admin's own authenticated (cookied) browser request. requireAdmin()
        // itself writes directly to `res`, which would conflict with
        // handleUpload()'s own response handling here — so we call the same
        // two primitives requireAdmin is built from instead, and let the
        // outer catch block below produce the single canonical response.
        const me = await getMeFromRequest(req);
        const email = me?.user?.email;
        if (!email || !isAdminEmail(email)) {
          throw new Error("Forbidden");
        }

        if (!pathname.startsWith(BLOG_MEDIA_PATHNAME_PREFIX)) {
          throw new Error("Invalid upload pathname");
        }

        return {
          allowedContentTypes: ALLOWED_MEDIA_MIME_TYPES,
          maximumSizeInBytes: MAX_MEDIA_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Vercel infrastructure trust boundary — deliberately omitted. Per the
      // confirmed v1 design, blog_media is never persisted from this
      // server-to-server callback (no admin session is present on it). The
      // browser persists metadata itself via the already-authenticated
      // /api/admin "createBlogMedia" action once upload() resolves.
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err?.message || "Failed to process upload request";
    const status = message === "Forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, error: message });
  }
}
