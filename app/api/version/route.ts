import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * What is actually running.
 *
 * WHY: three separate times a fix looked broken and the real question was
 * whether the deploy had landed at all. Guessing at that from CSS hashes and
 * chunk contents wasted more effort than the fixes did. Vercel sets these on
 * every build; this endpoint just reports them, and needs no auth because it
 * says nothing a visitor could not learn from the public repo.
 */
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    builtAt: process.env.VERCEL_DEPLOYMENT_ID ? undefined : "dev",
    now: new Date().toISOString(),
  });
}
