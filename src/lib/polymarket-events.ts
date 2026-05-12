import type {
  EsportsGameKey,
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
  tags?: GammaTag[];
}

interface GammaMarket {
  id: string;
  question: string;
  outcomePrices: string | null;
  outcomes: string | null;
  volume: string;
  active: boolean;
  closed: boolean;
}

interface GammaTag {
  id: string;
  label: string;
  slug: string;
}

/**
 * Polymarket Gamma API tag IDs:
 *
 * tag_id=100350  → Soccer / Football
 * tag_id=64      → Esports
 * tag_id=65      → League of Legends
 * tag_id=100780  → Counter-Strike 2
 * tag_id=101672  → Valorant
 * tag_id=100639  → Individual match/game bets (single-game, not futures)
 */
const SOCCER_TAG_ID = "100350";
const ESPORTS_TAG_ID = "64";
const ESPORTS_GAME_TAG_IDS: Record<EsportsGameKey, string> = {
  lol: "65",
  cs2: "100780",
  valorant: "101672",
};

// Regex to detect "vs" or "vs." in event titles
const VS_PATTERN = /\bvs\.?\b/i;

// Only treat matches within this many days as "recent matches"
const MAX_MATCH_DAYS_AHEAD = 14;
const RAW_EVENT_PAGE_SIZE = 100;
const RAW_EVENT_MAX_PAGES = 5;

function parseOutcomePrices(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<number | string>;
    return parsed.map(Number).filter((price) => Number.isFinite(price));
  } catch {
    return [];
  }
}

function parseOutcomes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(String);
  } catch {
    return [];
  }
}

function normalizeEntity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(fc|cf|afc|sc|ssc|ac|as|rc|rcd|cd|ud|sk|ec|club)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesEntity(text: string, entity: string): boolean {
  const normalizedText = normalizeEntity(text);
  const normalizedEntity = normalizeEntity(entity);
  if (!normalizedEntity) return false;
  if (normalizedText.includes(normalizedEntity)) return true;

  const tokens = normalizedEntity.split(" ").filter((token) => token.length > 2);
  return tokens.length >= 2 && tokens.every((token) => normalizedText.includes(token));
}

function isSupplementalMarketEvent(title: string): boolean {
  return /\bmore markets\b/i.test(title);
}

function cleanMatchSide(value: string, side: "home" | "away"): string {
  let cleaned = value.trim();
  if (side === "home") {
    cleaned = cleaned.replace(/^[a-z0-9 ]+:\s+/i, "");
  }
  return cleaned
    .replace(/\s+-\s+more markets\s*$/i, "")
    .replace(/\s+-\s+.*$/i, "")
    .replace(/\s+\([^)]*\).*$/i, "")
    .trim();
}

function getEventMatchDate(event: Pick<PolymarketEvent, "startDate" | "endDate">): string {
  return event.endDate || event.startDate;
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
  const events: GammaEvent[] = [];

  for (let page = 0; page < RAW_EVENT_MAX_PAGES; page += 1) {
    const offset = page * RAW_EVENT_PAGE_SIZE;
    const url = `${GAMMA_URL}/events?tag_id=${tagId}&active=true&closed=false&limit=${RAW_EVENT_PAGE_SIZE}&offset=${offset}&order=volume&ascending=false`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        console.error(
          `[polymarket-events] Failed to fetch tag=${tagId}: ${res.status}`
        );
        break;
      }

      const pageEvents = (await res.json()) as GammaEvent[];
      events.push(...pageEvents);
      if (pageEvents.length < RAW_EVENT_PAGE_SIZE) break;
    } catch (err) {
      console.error(`[polymarket-events] Error fetching tag=${tagId}:`, err);
      break;
    }
  }

  return events;
}

/**
 * Parse team names from an event title containing "vs" or "vs."
 * e.g. "West Ham United FC vs. Manchester United FC" → ["West Ham United FC", "Manchester United FC"]
 */
function parseTeamsFromTitle(title: string): {
  homeTeam: string;
  awayTeam: string;
} | null {
  if (isSupplementalMarketEvent(title)) return null;

  // Split on " vs. " or " vs "
  const parts = title.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return null;
  const homeTeam = cleanMatchSide(parts[0], "home");
  const awayTeam = cleanMatchSide(parts.slice(1).join(" vs "), "away");
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
        includesEntity(o0, homeTeam) &&
        includesEntity(o1, awayTeam)
      ) {
        odds.homeWin = market.outcomePrices[0];
        odds.awayWin = market.outcomePrices[1];
        continue;
      }
      if (
        includesEntity(o1, homeTeam) &&
        includesEntity(o0, awayTeam)
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
          includesEntity(qLower, homeTeam) &&
          (qLower.includes("win") || qLower.includes("winner"))
        ) {
          odds.homeWin = market.outcomePrices[0];
          continue;
        }
        if (
          includesEntity(qLower, awayTeam) &&
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
        if (includesEntity(qLower, homeTeam) && odds.homeWin === 0) {
          odds.homeWin = market.outcomePrices[0];
        } else if (includesEntity(qLower, awayTeam) && odds.awayWin === 0) {
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
    matchDate: getEventMatchDate(event),
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
  return cached(`poly:${category}:${categoryTagId}-matches`, async () => {
    const categoryRaw = await fetchRawEvents(categoryTagId);
    const allEventsMap = new Map<string, PolymarketEvent>();
    const matchesMap = new Map<string, PolymarketMatch>();

    const now = new Date();
    const maxAheadMs = MAX_MATCH_DAYS_AHEAD * 24 * 60 * 60 * 1000;

    // Process category events
    for (const raw of categoryRaw) {
      const event = toPolymarketEvent(raw, category);
      if (!event) continue;

      if (VS_PATTERN.test(event.title)) {
        const match = eventToMatch(event, category);
        if (match) {
          const rawDate = match.matchDate;
          const matchDate = rawDate ? new Date(rawDate) : null;

          if (matchDate && !Number.isNaN(matchDate.getTime())) {
            const diff = matchDate.getTime() - now.getTime();
            if (diff >= 0 && diff <= maxAheadMs) {
              matchesMap.set(event.id, match);
            } else {
              allEventsMap.set(event.id, event);
            }
          } else {
            allEventsMap.set(event.id, event);
          }
        } else {
          allEventsMap.set(event.id, event);
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
  limit = 20,
  game?: EsportsGameKey
): Promise<{ matches: PolymarketMatch[]; events: PolymarketEvent[] }> {
  return fetchMatchesAndEvents(game ? ESPORTS_GAME_TAG_IDS[game] : ESPORTS_TAG_ID, "esports", limit);
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
