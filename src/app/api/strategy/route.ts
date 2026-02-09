import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const strategySchema = z.object({
  walletAddress: z.string().min(1),
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  minConfidence: z.number().min(0).max(1).default(0.65),
  maxBetAmount: z.number().positive().max(1000).default(10),
  dailyBudget: z.number().positive().max(10000).default(50),
  autoExecute: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = strategySchema.parse(body);

    let user = await prisma.user.findUnique({
      where: { walletAddress: validated.walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: validated.walletAddress },
      });
    }

    const strategy = await prisma.strategy.create({
      data: {
        userId: user.id,
        name: validated.name,
        isActive: validated.isActive,
        minConfidence: validated.minConfidence,
        maxBetAmount: validated.maxBetAmount,
        dailyBudget: validated.dailyBudget,
        autoExecute: validated.autoExecute,
      },
    });

    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Strategy creation failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "wallet address required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const strategies = await prisma.strategy.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: strategies });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch strategies",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Strategy ID required" },
        { status: 400 }
      );
    }

    const strategy = await prisma.strategy.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, data: strategy });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Strategy update failed",
      },
      { status: 500 }
    );
  }
}
