import { NextResponse } from "next/server";
import { PERSONAS, SANDBOX_HEADERS } from "@/lib/pika/sandbox";

// The index — so someone handed the base URL can find the rest without asking.

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SANDBOX_HEADERS });
}

export function GET(req: Request) {
  const base = new URL(req.url).origin + "/api/pika/v1/sandbox";
  return NextResponse.json(
    {
      what: "Fixture versions of the Pika endpoints. No token, no database, open CORS.",
      personas: PERSONAS,
      endpoints: {
        summary: `${base}/summary?student=partway`,
        results: `${base}/results?student=partway`,
      },
      live: {
        summary: "/api/pika/v1/student/summary",
        results: "/api/pika/v1/student/results",
        note: "Same response shape. The live pair needs a Pika bearer token and an allowlisted origin.",
      },
      iframe: "/lessons/6.1?embed=pika",
    },
    { headers: SANDBOX_HEADERS },
  );
}
