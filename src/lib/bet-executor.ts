import type { BetRequest, AnalysisWithEdge, StrategyConfig } from "@/types";
import { prisma } from "./db";

const NBA_SERVICE_URL =
  process.env.NBA_SERVICE_URL ?? "http://localhost:8000";

export async function placeBet(
  userId: string,
  request: BetRequest
): Promise<{ orderId: string; status: string }> {
  // Create bet record in pending status
  const bet = await prisma.bet.create({
    data: {
      userId,
      analysisId: request.analysisId,
      tokenId: request.tokenId,
      side: request.side,
      outcome: request.outcome,
      amount: request.amount,
      price: request.price,
      status: "pending",
    },
  });

  try {
    // Call Python trading service (uses py-clob-client with private key)
    const size = request.amount / request.price;

    const res = await fetch(`${NBA_SERVICE_URL}/api/trading/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_id: request.tokenId,
        price: request.price,
        size,
        side: request.side,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(`Order failed: ${errorData.detail ?? res.statusText}`);
    }

    const orderResult = await res.json();
    const orderId = orderResult.order_id ?? "unknown";

    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        orderId,
        status: "placed",
      },
    });

    return { orderId, status: "placed" };
  } catch (error) {
    await prisma.bet.update({
      where: { id: bet.id },
      data: { status: "failed" },
    });
    throw error;
  }
}

export function shouldBet(
  analysis: AnalysisWithEdge,
  strategy: StrategyConfig
): boolean {
  if (!strategy.isActive) return false;
  if (analysis.recommendedSide === "none") return false;
  if (analysis.confidence < strategy.minConfidence) return false;
  if (analysis.edgePercent < 0.05) return false;
  return true;
}

export function calculateBetAmount(
  analysis: AnalysisWithEdge,
  strategy: StrategyConfig,
  dailySpent: number
): number {
  const remainingBudget = strategy.dailyBudget - dailySpent;
  if (remainingBudget <= 0) return 0;

  // Simplified Kelly Criterion: edge * bankroll_fraction
  const edge = analysis.edgePercent;
  const kellyFraction = Math.min(edge * 2, 0.25);
  const kellyAmount = strategy.maxBetAmount * kellyFraction;

  return Math.min(kellyAmount, strategy.maxBetAmount, remainingBudget);
}

export async function getDailySpent(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bets = await prisma.bet.findMany({
    where: {
      userId,
      createdAt: { gte: today },
      status: { in: ["placed", "filled"] },
    },
  });

  return bets.reduce((sum, bet) => sum + bet.amount, 0);
}
