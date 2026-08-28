import { NextResponse } from "next/server";
import { personaOf, summary, SANDBOX_HEADERS } from "@/lib/pika/sandbox";

// Same shape as /api/pika/v1/student/summary, with fixture data and no token.
// See lib/pika/sandbox.ts. Touches no database.

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SANDBOX_HEADERS });
}

export function GET(req: Request) {
  return NextResponse.json(summary(personaOf(new URL(req.url))), { headers: SANDBOX_HEADERS });
}
