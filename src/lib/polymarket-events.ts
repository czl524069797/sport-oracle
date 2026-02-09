import type { PolymarketEvent, PolymarketEventMarket } from "@/types";

const GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";

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
 * Polymarket Gamma API tag IDs (from /sports endpoint):
 *
 * tag_id=100350  → Soccer / Football (EPL, La Liga, Bundesliga, UCL, etc.)
 * tag_id=64      → Esports (LoL, CS2, Dota 2, Valorant, CoD, OW, etc.)
 * tag_id=100639  → Individual match/game bets (as opposed to futures)
 */
const SOCCER_TAG_ID = "100350";
const ESPORTS_TAG_ID = "64";

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

/**
 * Fetch events by tag_id from Gamma API.
 * Uses the official tag_id filtering + closed=false + active=true,
 * sorted by volume descending, and returns up to `limit` events.
 */
async function fetchEventsByTag(
  tagId: string,
  category: "football" | "esports",
  limit: number = 10
): Promise<PolymarketEvent[]> {
  const allEvents = new Map<string, PolymarketEvent>();

  // Paginate: fetch up to 100 events (Gamma max), sorted by volume desc
  const pageSize = 100;
  const url = `${GAMMA_URL}/events?tag_id=${tagId}&active=true&closed=false&limit=${pageSize}&offset=0&order=volume&ascending=false`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[polymarket-events] Failed to fetch tag=${tagId}: ${res.status}`);
      return [];
    }

    const events = (await res.json()) as GammaEvent[];

    for (const event of events) {
      // Skip events with no active markets
      if (!event.markets || event.markets.length === 0) continue;
      const activeMarkets = event.markets.filter((m) => !m.closed && m.active);
      if (activeMarkets.length === 0) continue;

      // Skip events that already ended
      if (event.endDate && new Date(event.endDate) < new Date()) continue;

      allEvents.set(event.id, {
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
      });
    }
  } catch (err) {
    console.error(`[polymarket-events] Error fetching tag=${tagId}:`, err);
  }

  // Sort by volume descending and take top N
  return Array.from(allEvents.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

export async function getFootballEvents(limit = 10): Promise<PolymarketEvent[]> {
  return fetchEventsByTag(SOCCER_TAG_ID, "football", limit);
}

export async function getEsportsEvents(limit = 10): Promise<PolymarketEvent[]> {
  return fetchEventsByTag(ESPORTS_TAG_ID, "esports", limit);
}
