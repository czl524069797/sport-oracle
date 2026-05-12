import { NextRequest, NextResponse } from "next/server";

const NBA_SERVICE_URL = process.env.NBA_SERVICE_URL ?? "http://localhost:8000";

export async function GET(_req: NextRequest) {
  const res = await fetch(`${NBA_SERVICE_URL}/api/auth/nonce`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
