import type {
  PolymarketMarket,
  NBAGame,
  TeamMarketOdds,
  GameWithOdds,
} from "@/types";

const GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";
const CLOB_URL =
  process.env.POLYMARKET_API_URL ?? "https://clob.polymarket.com";

// NBA team name variants for matching market groupItemTitle → team name
const TEAM_NAME_MAP: Record<string, string[]> = {
  "Atlanta Hawks": ["hawks", "atlanta"],
  "Boston Celtics": ["celtics", "boston"],
  "Brooklyn Nets": ["nets", "brooklyn"],
  "Charlotte Hornets": ["hornets", "charlotte"],
  "Chicago Bulls": ["bulls", "chicago"],
  "Cleveland Cavaliers": ["cavaliers", "cleveland", "cavs"],
  "Dallas Mavericks": ["mavericks", "dallas", "mavs"],
  "Denver Nuggets": ["nuggets", "denver"],
  "Detroit Pistons": ["pistons", "detroit"],
  "Golden State Warriors": ["warriors", "golden state"],
  "Houston Rockets": ["rockets", "houston"],
  "Indiana Pacers": ["pacers", "indiana"],
  "LA Clippers": ["clippers", "la clippers"],
  "Los Angeles Lakers": ["lakers", "los angeles lakers", "la lakers"],
  "Memphis Grizzlies": ["grizzlies", "memphis"],
  "Miami Heat": ["heat", "miami"],
  "Milwaukee Bucks": ["bucks", "milwaukee"],
  "Minnesota Timberwolves": ["timberwolves", "minnesota", "wolves"],
  "New Orleans Pelicans": ["pelicans", "new orleans"],
  "New York Knicks": ["knicks", "new york", "ny knicks"],
  "Oklahoma City Thunder": ["thunder", "oklahoma city", "okc"],
  "Orlando Magic": ["magic", "orlando"],
  "Philadelphia 76ers": ["76ers", "philadelphia", "sixers", "philly"],
  "Phoenix Suns": ["suns", "phoenix"],
  "Portland Trail Blazers": ["trail blazers", "portland", "blazers"],
  "Sacramento Kings": ["kings", "sacramento"],
  "San Antonio Spurs": ["spurs", "san antonio"],
  "Toronto Raptors": ["raptors", "toronto"],
  "Utah Jazz": ["jazz", "utah"],
  "Washington Wizards": ["wizards", "washington"],
};

// Conference mapping for all 30 NBA teams
const TEAM_CONFERENCE: Record<string, "eastern" | "western"> = {
  "Atlanta Hawks": "eastern",
  "Boston Celtics": "eastern",
  "Brooklyn Nets": "eastern",
  "Charlotte Hornets": "eastern",
  "Chicago Bulls": "eastern",
  "Cleveland Cavaliers": "eastern",
  "Detroit Pistons": "eastern",
  "Indiana Pacers": "eastern",
  "Miami Heat": "eastern",
  "Milwaukee Bucks": "eastern",
  "New York Knicks": "eastern",
  "Orlando Magic": "eastern",
  "Philadelphia 76ers": "eastern",
  "Toronto Raptors": "eastern",
  "Washington Wizards": "eastern",
  "Dallas Mavericks": "western",
  "Denver Nuggets": "western",
  "Golden State Warriors": "western",
  "Houston Rockets": "western",
  "LA Clippers": "western",
  "Los Angeles Lakers": "western",
  "Memphis Grizzlies": "western",
  "Minnesota Timberwolves": "western",
  "New Orleans Pelicans": "western",
  "Oklahoma City Thunder": "western",
  "Phoenix Suns": "western",
  "Portland Trail Blazers": "western",
  "Sacramento Kings": "western",
  "San Antonio Spurs": "western",
  "Utah Jazz": "western",
};

// Gamma event slugs for NBA season markets
const NBA_EVENT_SLUGS = {
  championship: "2026-nba-champion",
  eastern: "nba-eastern-conference-champion-442",
  western: "nba-western-conference-champion-933",
};

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  markets: GammaMarket[];
}

interface GammaMarket {
  id: string;
  conditionId: string;
  question: string;
  groupItemTitle?: string;
  outcomePrices: string;
  outcomes: string;
  active: boolean;
  closed: boolean;
}

const EMPTY_ODDS: TeamMarketOdds = {
  championshipPrice: 0,
  championshipMarketId: "",
  conferencePrice: 0,
  conferenceMarketId: "",
};

/**
 * Fetch NBA season events (championship + conference) from Gamma API.
 * Returns maps of championship and conference markets.
 */
export async function getNBASeasonMarkets(): Promise<{
  championship: GammaMarket[];
  eastern: GammaMarket[];
  western: GammaMarket[];
}> {
  const fetchEvent = async (slug: string): Promise<GammaMarket[]> => {
    try {
      const res = await fetch(`${GAMMA_URL}/events?slug=${slug}`, {
        next: { revalidate: 600 },
      });
      if (!res.ok) return [];
      const events: GammaEvent[] = await res.json();
      return events[0]?.markets ?? [];
    } catch {
      return [];
    }
  };

  const [championship, eastern, western] = await Promise.all([
    fetchEvent(NBA_EVENT_SLUGS.championship),
    fetchEvent(NBA_EVENT_SLUGS.eastern),
    fetchEvent(NBA_EVENT_SLUGS.western),
  ]);

  return { championship, eastern, western };
}

/**
 * Match a market's groupItemTitle (or question) to a canonical team name.
 */
function matchMarketToTeam(market: GammaMarket): string | null {
  const title = (market.groupItemTitle ?? market.question).toLowerCase();

  for (const [teamName, aliases] of Object.entries(TEAM_NAME_MAP)) {
    if (title.includes(teamName.toLowerCase())) return teamName;
    if (aliases.some((alias) => title.includes(alias))) return teamName;
  }
  return null;
}

/**
 * Extract "Yes" price from a Gamma market (first outcome price).
 */
function getYesPrice(market: GammaMarket): number {
  try {
    const prices: number[] = JSON.parse(market.outcomePrices);
    return prices[0] ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Build a map from team name → TeamMarketOdds using season markets.
 */
export function buildTeamOddsMap(seasonMarkets: {
  championship: GammaMarket[];
  eastern: GammaMarket[];
  western: GammaMarket[];
}): Map<string, TeamMarketOdds> {
  const map = new Map<string, TeamMarketOdds>();

  // Initialize all teams with empty odds
  for (const teamName of Object.keys(TEAM_NAME_MAP)) {
    map.set(teamName, { ...EMPTY_ODDS });
  }

  // Fill championship prices
  for (const market of seasonMarkets.championship) {
    const team = matchMarketToTeam(market);
    if (!team) continue;
    const odds = map.get(team);
    if (odds) {
      odds.championshipPrice = getYesPrice(market);
      odds.championshipMarketId = market.id;
    }
  }

  // Fill conference prices
  const fillConference = (
    markets: GammaMarket[],
    conference: "eastern" | "western"
  ) => {
    for (const market of markets) {
      const team = matchMarketToTeam(market);
      if (!team) continue;
      // Verify team belongs to this conference
      if (TEAM_CONFERENCE[team] !== conference) continue;
      const odds = map.get(team);
      if (odds) {
        odds.conferencePrice = getYesPrice(market);
        odds.conferenceMarketId = market.id;
      }
    }
  };

  fillConference(seasonMarkets.eastern, "eastern");
  fillConference(seasonMarkets.western, "western");

  return map;
}

/**
 * Enrich games with season market odds for both teams.
 */
export function enrichGamesWithOdds(
  games: NBAGame[],
  oddsMap: Map<string, TeamMarketOdds>
): GameWithOdds[] {
  return games.map((game) => ({
    game,
    homeOdds: oddsMap.get(game.homeTeam.teamName) ?? { ...EMPTY_ODDS },
    awayOdds: oddsMap.get(game.awayTeam.teamName) ?? { ...EMPTY_ODDS },
  }));
}

// --- Existing utilities (kept for other features) ---

export async function getMarketById(
  conditionId: string
): Promise<PolymarketMarket | null> {
  const res = await fetch(`${GAMMA_URL}/markets?condition_id=${conditionId}`);
  if (!res.ok) return null;
  const markets: PolymarketMarket[] = await res.json();
  return markets[0] ?? null;
}

export async function getOrderBook(tokenId: string) {
  const res = await fetch(`${CLOB_URL}/book?token_id=${tokenId}`);
  if (!res.ok) {
    throw new Error(`CLOB API error: ${res.status}`);
  }
  return res.json();
}

export async function getMarketPrice(tokenId: string): Promise<number> {
  const res = await fetch(`${CLOB_URL}/price?token_id=${tokenId}&side=buy`);
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.price ?? 0);
}
