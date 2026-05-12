import { NextRequest, NextResponse } from "next/server";

const NBA_SERVICE_URL = process.env.NBA_SERVICE_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || undefined;
  const res = await fetch(`${NBA_SERVICE_URL}/api/auth/me`, {
    headers: auth ? { Authorization: auth } : undefined,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
