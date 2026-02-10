import type { FuturesMarket, FuturesOutcome } from "@/types";
import { cached } from "@/lib/cache";

const GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";

const TEN_MINUTES = 10 * 60 * 1000;

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  volume: number;
  markets: GammaMarket[];
}

interface GammaMarket {
  id: string;
  question: string;
  groupItemTitle?: string;
  outcomePrices: string;
  outcomes: string;
  active: boolean;
  closed: boolean;
}

function parseYesPrice(raw: string): number {
  try {
    const prices: number[] = JSON.parse(raw);
    return prices[0] ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch a single event by slug and extract top N outcomes sorted by price.
 */
async function fetchFuturesBySlug(
  slug: string,
  topN: number = 5
): Promise<FuturesMarket | null> {
  try {
    const res = await fetch(`${GAMMA_URL}/events?slug=${slug}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const events: GammaEvent[] = await res.json();
    const event = events[0];
    if (!event) return null;

    const outcomes: FuturesOutcome[] = (event.markets ?? [])
      .filter((m) => !m.closed && m.active)
      .map((m) => ({
        name: m.groupItemTitle ?? m.question,
        price: parseYesPrice(m.outcomePrices),
        marketId: m.id,
      }))
      .sort((a, b) => b.price - a.price)
      .slice(0, topN);

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      outcomes,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch multiple futures by event ID (for events not findable by slug).
 */
async function fetchFuturesByTagVolume(
  tagId: string,
  minMarkets: number = 10,
  topEvents: number = 4,
  topN: number = 5
): Promise<FuturesMarket[]> {
  try {
    const res = await fetch(
      `${GAMMA_URL}/events?tag_id=${tagId}&active=true&closed=false&limit=50&order=volume&ascending=false`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return [];
    const events: GammaEvent[] = await res.json();

    // Pick events with many markets (futures-like, not single matches)
    const futuresEvents = events
      .filter((e) => (e.markets ?? []).filter((m) => !m.closed).length >= minMarkets)
      .slice(0, topEvents);

    return futuresEvents.map((event) => {
      const outcomes: FuturesOutcome[] = (event.markets ?? [])
        .filter((m) => !m.closed && m.active)
        .map((m) => ({
          name: m.groupItemTitle ?? m.question,
          price: parseYesPrice(m.outcomePrices),
          marketId: m.id,
        }))
        .sort((a, b) => b.price - a.price)
        .slice(0, topN);

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        outcomes,
      };
    });
  } catch {
    return [];
  }
}

// ====== NBA Season Overview ======
const NBA_FUTURES_SLUGS = [
  "2026-nba-champion",
  "nba-mvp-694",
  "nba-eastern-conference-champion-442",
  "nba-western-conference-champion-933",
  "nba-rookie-of-the-year-873",
];

export async function getNBAOverview(): Promise<FuturesMarket[]> {
  return cached("overview:nba", async () => {
    const results = await Promise.all(
      NBA_FUTURES_SLUGS.map((slug) => fetchFuturesBySlug(slug, 5))
    );
    return results.filter((r): r is FuturesMarket => r !== null);
  }, TEN_MINUTES);
}

// ====== Football Season Overview ======
// tag_id=100350 for soccer; we pick events with 15+ markets (futures, not single matches)
export async function getFootballOverview(): Promise<FuturesMarket[]> {
  return cached("overview:football", () => fetchFuturesByTagVolume("100350", 15, 6, 5), TEN_MINUTES);
}

// ====== Esports Season Overview ======
// tag_id=64 for esports; pick events with 10+ markets
export async function getEsportsOverview(): Promise<FuturesMarket[]> {
  return cached("overview:esports", () => fetchFuturesByTagVolume("64", 10, 4, 5), TEN_MINUTES);
}
