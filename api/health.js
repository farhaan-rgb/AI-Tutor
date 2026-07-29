// Mirrors server/src/index.js's /health route, as a Vercel serverless
// function — see server/README (or CONTENT_RULEBOOK.md's deploy note) for
// why this duplicates rather than imports from /server: Vercel functions
// bundle from the project root, and /server is a separate Node app meant
// for local dev / self-hosting, not shared code with this directory.
export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
