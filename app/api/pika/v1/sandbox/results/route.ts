import { NextResponse } from "next/server";
import { personaOf, results, SANDBOX_HEADERS } from "@/lib/pika/sandbox";

// Same shape as /api/pika/v1/student/results, with fixture data and no token.
// See lib/pika/sandbox.ts. Touches no database.

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SANDBOX_HEADERS });
}

export function GET(req: Request) {
  return NextResponse.json(results(personaOf(new URL(req.url))), { headers: SANDBOX_HEADERS });
}
