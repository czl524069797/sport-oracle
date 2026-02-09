import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      hasPrivateKey: !!process.env.POLYMARKET_PRIVATE_KEY,
    },
  });
}
