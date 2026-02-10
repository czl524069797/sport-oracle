import type {
  PolymarketEvent,
  PolymarketEventMarket,
  PolymarketMatch,
  MatchOdds,
} from "@/types";
import { cached } from "@/lib/cache";

const GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";

const FIVE_MINUTES = 5 * 60 * 1000;

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  markets: GammaMarket[];
}

interface GammaMarket {
  id: string;
  question: string;
  outcomePrices: string;
  outcomes: string;
  volume: string;
  active: boolean;
  closed: boolean;
}

/**
 * Polymarket Gamma API tag IDs:
 *
 * tag_id=100350  → Soccer / Football
 * tag_id=64      → Esports
 * tag_id=100639  → Individual match/game bets (single-game, not futures)
 */
const SOCCER_TAG_ID = "100350";
const ESPORTS_TAG_ID = "64";

// Regex to detect "vs" or "vs." in event titles
const VS_PATTERN = /\bvs\.?\b/i;

function parseOutcomePrices(raw: string): number[] {
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

function parseOutcomes(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function transformMarket(m: GammaMarket): PolymarketEventMarket {
  return {
    id: m.id,
    question: m.question,
    outcomePrices: parseOutcomePrices(m.outcomePrices),
    outcomes: parseOutcomes(m.outcomes),
    volume: m.volume,
    active: m.active,
    closed: m.closed,
  };
}

function toPolymarketEvent(
  event: GammaEvent,
  category: "football" | "esports"
): PolymarketEvent | null {
  if (!event.markets || event.markets.length === 0) return null;
  const activeMarkets = event.markets.filter((m) => !m.closed && m.active);
  if (activeMarkets.length === 0) return null;
  if (event.endDate && new Date(event.endDate) < new Date()) return null;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description ?? "",
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    volume: event.volume ?? 0,
    liquidity: event.liquidity ?? 0,
    markets: activeMarkets.map(transformMarket),
    category,
  };
}

/**
 * Fetch raw events from Gamma API by tag_id.
 */
async function fetchRawEvents(tagId: string): Promise<GammaEvent[]> {
  const url = `${GAMMA_URL}/events?tag_id=${tagId}&active=true&closed=false&limit=100&offset=0&order=volume&ascending=false`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error(
        `[polymarket-events] Failed to fetch tag=${tagId}: ${res.status}`
      );
      return [];
    }
    return (await res.json()) as GammaEvent[];
  } catch (err) {
    console.error(`[polymarket-events] Error fetching tag=${tagId}:`, err);
    return [];
  }
}

/**
 * Parse team names from an event title containing "vs" or "vs."
 * e.g. "West Ham United FC vs. Manchester United FC" → ["West Ham United FC", "Manchester United FC"]
 */
function parseTeamsFromTitle(title: string): {
  homeTeam: string;
  awayTeam: string;
} | null {
  // Split on " vs. " or " vs "
  const parts = title.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return null;
  const homeTeam = parts[0].trim();
  const awayTeam = parts[1].trim();
  if (!homeTeam || !awayTeam) return null;
  return { homeTeam, awayTeam };
}

/**
 * Extract match odds from event markets.
 *
 * Football: markets named "Will X win?" give homeWin/awayWin, "Draw" or draw-related gives draw.
 * Esports: primary market with 2 outcomes = homeWin/awayWin.
 * Spread: question containing "spread" (case-insensitive).
 * O/U: question containing "o/u" or "over" or "total" (case-insensitive).
 */
function extractOdds(
  event: PolymarketEvent,
  homeTeam: string,
  awayTeam: string,
  category: "football" | "esports"
): MatchOdds {
  const odds: MatchOdds = { homeWin: 0, awayWin: 0 };

  const homeLower = homeTeam.toLowerCase();
  const awayLower = awayTeam.toLowerCase();

  for (const market of event.markets) {
    const qLower = market.question.toLowerCase();

    // Spread detection
    if (qLower.includes("spread")) {
      if (market.outcomePrices.length >= 1) {
        odds.spread = market.question;
        odds.spreadPrice = market.outcomePrices[0];
      }
      continue;
    }

    // O/U detection
    if (
      qLower.includes("o/u") ||
      (qLower.includes("over") && qLower.includes("under")) ||
      qLower.includes("total points") ||
      qLower.includes("total goals")
    ) {
      // Try to extract the numeric line from the question
      const lineMatch = market.question.match(/(\d+\.?\d*)/);
      if (lineMatch) {
        odds.overUnder = parseFloat(lineMatch[1]);
      }
      if (market.outcomePrices.length >= 2) {
        odds.overPrice = market.outcomePrices[0];
        odds.underPrice = market.outcomePrices[1];
      }
      continue;
    }

    // Draw detection (football)
    if (
      category === "football" &&
      (qLower.includes("draw") || qLower.includes("tie"))
    ) {
      if (market.outcomePrices.length >= 1) {
        odds.draw = market.outcomePrices[0];
      }
      continue;
    }

    // Moneyline / winner detection
    if (market.outcomes.length === 2 && market.outcomePrices.length === 2) {
      const o0 = market.outcomes[0].toLowerCase();
      const o1 = market.outcomes[1].toLowerCase();

      // If outcomes are team names (esports pattern)
      if (
        (o0.includes(homeLower.split(" ")[0]) ||
          homeLower.includes(o0.split(" ")[0])) &&
        (o1.includes(awayLower.split(" ")[0]) ||
          awayLower.includes(o1.split(" ")[0]))
      ) {
        odds.homeWin = market.outcomePrices[0];
        odds.awayWin = market.outcomePrices[1];
        continue;
      }
      if (
        (o1.includes(homeLower.split(" ")[0]) ||
          homeLower.includes(o1.split(" ")[0])) &&
        (o0.includes(awayLower.split(" ")[0]) ||
          awayLower.includes(o0.split(" ")[0]))
      ) {
        odds.homeWin = market.outcomePrices[1];
        odds.awayWin = market.outcomePrices[0];
        continue;
      }

      // If outcomes are Yes/No — check which team the question is about
      if (
        market.outcomes[0].toLowerCase() === "yes" &&
        market.outcomes[1].toLowerCase() === "no"
      ) {
        if (
          qLower.includes(homeLower.split(" ")[0]) &&
          (qLower.includes("win") || qLower.includes("winner"))
        ) {
          odds.homeWin = market.outcomePrices[0];
          continue;
        }
        if (
          qLower.includes(awayLower.split(" ")[0]) &&
          (qLower.includes("win") || qLower.includes("winner"))
        ) {
          odds.awayWin = market.outcomePrices[0];
          continue;
        }
      }
    }

    // Football 3-way: if we see "Will X win?" pattern for individual markets
    if (
      category === "football" &&
      market.outcomes.length === 2 &&
      market.outcomePrices.length >= 1
    ) {
      if (
        market.outcomes[0].toLowerCase() === "yes" &&
        (qLower.includes("win") || qLower.includes("winner"))
      ) {
        if (qLower.includes(homeLower.split(" ")[0]) && odds.homeWin === 0) {
          odds.homeWin = market.outcomePrices[0];
        } else if (
          qLower.includes(awayLower.split(" ")[0]) &&
          odds.awayWin === 0
        ) {
          odds.awayWin = market.outcomePrices[0];
        }
      }
    }
  }

  // Fallback: if no structured odds found, use primary market
  if (odds.homeWin === 0 && odds.awayWin === 0 && event.markets.length > 0) {
    const primary = event.markets[0];
    if (primary.outcomes.length === 2 && primary.outcomePrices.length === 2) {
      odds.homeWin = primary.outcomePrices[0];
      odds.awayWin = primary.outcomePrices[1];
    }
  }

  return odds;
}

/**
 * Convert an event to a PolymarketMatch if it looks like a vs-matchup.
 */
function eventToMatch(
  event: PolymarketEvent,
  category: "football" | "esports"
): PolymarketMatch | null {
  const teams = parseTeamsFromTitle(event.title);
  if (!teams) return null;

  const odds = extractOdds(event, teams.homeTeam, teams.awayTeam, category);

  return {
    event,
    homeTeam: teams.homeTeam,
    awayTeam: teams.awayTeam,
    matchDate: event.startDate || event.endDate,
    odds,
    polymarketUrl: `https://polymarket.com/event/${event.slug}`,
  };
}

/**
 * Fetch matches and events for a given category.
 *
 * Strategy:
 * 1. Fetch category-specific events (football/esports tag)
 * 2. Separate: events with "vs" in title → matches; others → season/futures events
 *
 * Note: We do NOT fetch tag_id=100639 here because it returns ALL sports (~8MB)
 * which is too slow and large. The category tags already contain vs-matches.
 */
async function fetchMatchesAndEvents(
  categoryTagId: string,
  category: "football" | "esports",
  limit: number = 20
): Promise<{ matches: PolymarketMatch[]; events: PolymarketEvent[] }> {
  return cached(`poly:${category}-matches`, async () => {
    const categoryRaw = await fetchRawEvents(categoryTagId);

  const allEventsMap = new Map<string, PolymarketEvent>();
  const matchesMap = new Map<string, PolymarketMatch>();

  // Process category events
  for (const raw of categoryRaw) {
    const event = toPolymarketEvent(raw, category);
    if (!event) continue;

    if (VS_PATTERN.test(event.title)) {
      const match = eventToMatch(event, category);
      if (match) {
        matchesMap.set(event.id, match);
      }
    } else {
      allEventsMap.set(event.id, event);
    }
  }

  // Sort matches by volume desc, take top N
  const matches = Array.from(matchesMap.values())
    .sort((a, b) => b.event.volume - a.event.volume)
    .slice(0, limit);

  // Sort remaining events (futures/season) by volume desc, take top N
  const events = Array.from(allEventsMap.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);

  return { matches, events };
  }, FIVE_MINUTES);
}

export async function getFootballMatchesAndEvents(
  limit = 20
): Promise<{ matches: PolymarketMatch[]; events: PolymarketEvent[] }> {
  return fetchMatchesAndEvents(SOCCER_TAG_ID, "football", limit);
}

export async function getEsportsMatchesAndEvents(
  limit = 20
): Promise<{ matches: PolymarketMatch[]; events: PolymarketEvent[] }> {
  return fetchMatchesAndEvents(ESPORTS_TAG_ID, "esports", limit);
}

// Keep backward-compatible exports
export async function getFootballEvents(
  limit = 10
): Promise<PolymarketEvent[]> {
  const { matches, events } = await getFootballMatchesAndEvents(limit);
  // Merge: convert matches back to events + original events
  return [
    ...matches.map((m) => m.event),
    ...events,
  ].slice(0, limit);
}

export async function getEsportsEvents(
  limit = 10
): Promise<PolymarketEvent[]> {
  const { matches, events } = await getEsportsMatchesAndEvents(limit);
  return [
    ...matches.map((m) => m.event),
    ...events,
  ].slice(0, limit);
}
