import type { BetRequest, AnalysisWithEdge, StrategyConfig } from "@/types";
import { prisma } from "./db";

const NBA_SERVICE_URL =
  process.env.NBA_SERVICE_URL ?? "http://localhost:8000";

export async function placeBet(
  userId: string,
  request: BetRequest,
  authToken?: string
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

    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) headers["Authorization"] = authToken

    const res = await fetch(`${NBA_SERVICE_URL}/api/trading/place`, {
      method: "POST",
      headers,
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

/**
 * Decide whether to place a bet based on analysis and strategy thresholds.
 */
export function shouldBet(
  analysis: AnalysisWithEdge,
  strategy: StrategyConfig
): boolean {
  if (!strategy.isActive) return false;
  if (analysis.recommendedSide === "none") return false;
  if (analysis.confidence < strategy.minConfidence) return false;
  if (analysis.edgePercent < 0.03) return false; // 3% minimum edge
  return true;
}

/**
 * Kelly Criterion bet sizing.
 *
 * True Kelly formula: f = (bp - q) / b
 *   b = decimal odds payout ratio (decimal odds - 1)
 *   p = estimated win probability
 *   q = 1 - p
 *
 * We apply "quarter-Kelly" (×0.25) to reduce variance, which is standard
 * in professional sports betting. Then weight by AI confidence.
 *
 * Market price on Polymarket represents implied probability (0-1 scale).
 * Decimal odds = 1 / marketPrice.
 * Example: marketPrice 0.55 → decimal odds 1.818 → b = 0.818
 */
export function calculateBetAmount(
  analysis: AnalysisWithEdge,
  strategy: StrategyConfig,
  dailySpent: number
): number {
  const remainingBudget = strategy.dailyBudget - dailySpent;
  if (remainingBudget <= 0) return 0;

  // Determine win probability and market price based on recommended side
  const winProb = analysis.recommendedSide === "home"
    ? analysis.homeWinProbability
    : analysis.awayWinProbability;

  const marketImplied = analysis.marketPrice;
  if (marketImplied <= 0 || marketImplied >= 1) {
    // Invalid market price, can't calculate Kelly
    return 0;
  }

  // Convert Polymarket price to decimal odds
  const decimalOdds = 1 / marketImplied;
  const b = decimalOdds - 1; // Payout ratio (net profit per unit wagered)

  if (b <= 0) return 0;

  const p = winProb;
  const q = 1 - p;

  // True Kelly fraction
  const trueKelly = ((b * p) - q) / b;

  if (trueKelly <= 0) return 0; // No edge → don't bet

  // Quarter-Kelly × confidence for safety
  const KELLY_FRACTION = 0.25;
  const adjustedKelly = trueKelly * KELLY_FRACTION * analysis.confidence;

  // Cap at 10% of daily budget per single bet
  const maxFraction = 0.10;
  const kellyAmount = strategy.dailyBudget * Math.min(adjustedKelly, maxFraction);

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

  return bets.reduce((sum: number, bet: { amount: number }) => sum + bet.amount, 0);
}
