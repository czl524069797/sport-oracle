import type {
  PolymarketMarket,
  NBAGame,
  TeamMarketOdds,
  GameWithOdds,
  NBAGameOdds,
} from "@/types";
import { cached } from "@/lib/cache";

const GAMMA_URL =
  process.env.POLYMARKET_GAMMA_URL ?? "https://gamma-api.polymarket.com";
const CLOB_URL =
  process.env.POLYMARKET_API_URL ?? "https://clob.polymarket.com";

const TEN_MINUTES = 10 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const RAW_EVENT_PAGE_SIZE = 100;
const RAW_EVENT_MAX_PAGES = 4;

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

const TEAM_METADATA: Record<string, { id: number; abbreviation: string }> = {
  "Atlanta Hawks": { id: 1610612737, abbreviation: "ATL" },
  "Boston Celtics": { id: 1610612738, abbreviation: "BOS" },
  "Brooklyn Nets": { id: 1610612751, abbreviation: "BKN" },
  "Charlotte Hornets": { id: 1610612766, abbreviation: "CHA" },
  "Chicago Bulls": { id: 1610612741, abbreviation: "CHI" },
  "Cleveland Cavaliers": { id: 1610612739, abbreviation: "CLE" },
  "Dallas Mavericks": { id: 1610612742, abbreviation: "DAL" },
  "Denver Nuggets": { id: 1610612743, abbreviation: "DEN" },
  "Detroit Pistons": { id: 1610612765, abbreviation: "DET" },
  "Golden State Warriors": { id: 1610612744, abbreviation: "GSW" },
  "Houston Rockets": { id: 1610612745, abbreviation: "HOU" },
  "Indiana Pacers": { id: 1610612754, abbreviation: "IND" },
  "LA Clippers": { id: 1610612746, abbreviation: "LAC" },
  "Los Angeles Lakers": { id: 1610612747, abbreviation: "LAL" },
  "Memphis Grizzlies": { id: 1610612763, abbreviation: "MEM" },
  "Miami Heat": { id: 1610612748, abbreviation: "MIA" },
  "Milwaukee Bucks": { id: 1610612749, abbreviation: "MIL" },
  "Minnesota Timberwolves": { id: 1610612750, abbreviation: "MIN" },
  "New Orleans Pelicans": { id: 1610612740, abbreviation: "NOP" },
  "New York Knicks": { id: 1610612752, abbreviation: "NYK" },
  "Oklahoma City Thunder": { id: 1610612760, abbreviation: "OKC" },
  "Orlando Magic": { id: 1610612753, abbreviation: "ORL" },
  "Philadelphia 76ers": { id: 1610612755, abbreviation: "PHI" },
  "Phoenix Suns": { id: 1610612756, abbreviation: "PHX" },
  "Portland Trail Blazers": { id: 1610612757, abbreviation: "POR" },
  "Sacramento Kings": { id: 1610612758, abbreviation: "SAC" },
  "San Antonio Spurs": { id: 1610612759, abbreviation: "SAS" },
  "Toronto Raptors": { id: 1610612761, abbreviation: "TOR" },
  "Utah Jazz": { id: 1610612762, abbreviation: "UTA" },
  "Washington Wizards": { id: 1610612764, abbreviation: "WAS" },
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
  return cached("poly:nba-season", async () => {
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
  }, TEN_MINUTES);
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

// ============= NBA Single-Game Markets from Polymarket =============

const NBA_TAG_ID = "745";

interface GammaMatchEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  markets: GammaMarket[];
  tags?: Array<{ id: string; label?: string; slug?: string }>;
}

// NBA-related keywords to filter match-tag events
const NBA_KEYWORDS = [
  "nba",
  ...Object.keys(TEAM_NAME_MAP).map((t) => t.toLowerCase()),
  ...Object.values(TEAM_NAME_MAP)
    .flat()
    .map((a) => a.toLowerCase()),
];

function parseGammaOutcomePrices(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<number | string>;
    return parsed.map(Number).filter((price) => Number.isFinite(price));
  } catch {
    return [];
  }
}

function parseGammaOutcomes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(String);
  } catch {
    return [];
  }
}

/**
 * Parse team names from "Team A vs. Team B" or "Team A vs Team B" title format.
 */
function parseNBATeamsFromTitle(title: string): {
  team1: string;
  team2: string;
} | null {
  const parts = title.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return null;
  return {
    team1: parts[0].trim(),
    team2: parts.slice(1).join(" vs ").replace(/\s+-\s+.*$/i, "").trim(),
  };
}

/**
 * Match a Polymarket title team name to a canonical NBA team name.
 */
function matchToNBATeam(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [teamName, aliases] of Object.entries(TEAM_NAME_MAP)) {
    if (lower.includes(teamName.toLowerCase())) return teamName;
    if (aliases.some((alias) => lower.includes(alias))) return teamName;
  }
  return null;
}

function buildTeamInfo(teamName: string) {
  const metadata = TEAM_METADATA[teamName] ?? { id: 0, abbreviation: teamName.slice(0, 3).toUpperCase() };
  return {
    teamId: metadata.id,
    teamName,
    teamAbbreviation: metadata.abbreviation,
    record: "0-0",
  };
}

function hasTag(event: GammaMatchEvent, tagId: string): boolean {
  return (event.tags ?? []).some((tag) => String(tag.id) === tagId);
}

function extractNBAGameOdds(event: GammaMatchEvent, homeTeam: string, awayTeam: string): NBAGameOdds {
  const odds: NBAGameOdds = {
    moneylineHome: 0,
    moneylineAway: 0,
    polymarketUrl: `https://polymarket.com/event/${event.slug}`,
  };

  for (const market of event.markets ?? []) {
    if (market.closed || !market.active) continue;

    const qLower = market.question.toLowerCase();
    const outcomes = parseGammaOutcomes(market.outcomes);
    const prices = parseGammaOutcomePrices(market.outcomePrices);

    if (qLower.includes("spread")) {
      odds.spread = market.question;
      if (prices.length >= 1) odds.spreadPrice = prices[0];
      continue;
    }

    const isGameTotal =
      outcomes[0]?.toLowerCase() === "over" &&
      outcomes[1]?.toLowerCase() === "under";
    if (
      isGameTotal &&
      odds.overUnder === undefined &&
      (qLower.includes("o/u") ||
        (qLower.includes("over") && qLower.includes("under")) ||
        qLower.includes("total points"))
    ) {
      const lineMatch = market.question.match(/(\d+\.?\d*)/);
      if (lineMatch) odds.overUnder = parseFloat(lineMatch[1]);
      if (prices.length >= 2) {
        odds.overPrice = prices[0];
        odds.underPrice = prices[1];
      }
      continue;
    }

    if (outcomes.length === 2 && prices.length === 2) {
      const t0 = matchToNBATeam(outcomes[0]);
      const t1 = matchToNBATeam(outcomes[1]);

      if (t0 === homeTeam && t1 === awayTeam) {
        odds.moneylineHome = prices[0];
        odds.moneylineAway = prices[1];
      } else if (t1 === homeTeam && t0 === awayTeam) {
        odds.moneylineHome = prices[1];
        odds.moneylineAway = prices[0];
      }
    }

    if (
      outcomes.length === 2 &&
      outcomes[0]?.toLowerCase() === "yes" &&
      prices.length >= 1 &&
      (qLower.includes("win") || qLower.includes("winner"))
    ) {
      const homeLower = homeTeam.toLowerCase();
      const awayLower = awayTeam.toLowerCase();
      if (
        TEAM_NAME_MAP[homeTeam]?.some((a) => qLower.includes(a)) ||
        qLower.includes(homeLower)
      ) {
        odds.moneylineHome = prices[0];
      } else if (
        TEAM_NAME_MAP[awayTeam]?.some((a) => qLower.includes(a)) ||
        qLower.includes(awayLower)
      ) {
        odds.moneylineAway = prices[0];
      }
    }
  }

  return odds;
}

async function fetchRawNBAEvents(): Promise<GammaMatchEvent[]> {
  const events: GammaMatchEvent[] = [];

  for (let page = 0; page < RAW_EVENT_MAX_PAGES; page += 1) {
    const offset = page * RAW_EVENT_PAGE_SIZE;
    const url = `${GAMMA_URL}/events?tag_id=${NBA_TAG_ID}&active=true&closed=false&limit=${RAW_EVENT_PAGE_SIZE}&offset=${offset}&order=volume&ascending=false`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;

    const pageEvents = (await res.json()) as GammaMatchEvent[];
    events.push(...pageEvents);
    if (pageEvents.length < RAW_EVENT_PAGE_SIZE) break;
  }

  return events;
}

export async function getUpcomingNBAGamesWithOdds(): Promise<{
  games: NBAGame[];
  oddsMap: Map<string, NBAGameOdds>;
}> {
  return cached("poly:nba-upcoming-games", async () => {
    try {
      const rawEvents = await fetchRawNBAEvents();
      const now = Date.now();
      const gamesMap = new Map<string, NBAGame>();
      const oddsMap = new Map<string, NBAGameOdds>();

      for (const event of rawEvents) {
        if (!hasTag(event, "100639")) continue;
        if (!event.endDate || new Date(event.endDate).getTime() < now - 60 * 60 * 1000) continue;

        const teams = parseNBATeamsFromTitle(event.title);
        if (!teams) continue;

        const homeTeam = matchToNBATeam(teams.team1);
        const awayTeam = matchToNBATeam(teams.team2);
        if (!homeTeam || !awayTeam) continue;

        const game: NBAGame = {
          gameId: event.id,
          gameDate: event.endDate,
          homeTeam: buildTeamInfo(homeTeam),
          awayTeam: buildTeamInfo(awayTeam),
          status: new Date(event.endDate).getTime() <= now ? "Live" : "Scheduled",
        };
        const odds = extractNBAGameOdds(event, homeTeam, awayTeam);
        const key = `${homeTeam}|${awayTeam}`;

        gamesMap.set(event.id, game);
        oddsMap.set(event.id, odds);
        oddsMap.set(key, odds);
        oddsMap.set(`${awayTeam}|${homeTeam}`, {
          ...odds,
          moneylineHome: odds.moneylineAway,
          moneylineAway: odds.moneylineHome,
        });
      }

      return {
        games: Array.from(gamesMap.values()).sort(
          (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
        ),
        oddsMap,
      };
    } catch (err) {
      console.error("[polymarket] Error fetching upcoming NBA games:", err);
      return { games: [], oddsMap: new Map() };
    }
  }, FIVE_MINUTES);
}

/**
 * Fetch single-game NBA markets from Polymarket using the NBA tag.
 * Returns a map of "homeTeam|awayTeam" → NBAGameOdds.
 */
export async function getNBAGameMarkets(): Promise<
  Map<string, NBAGameOdds>
> {
  return cached("poly:nba-games", async () => {
    try {
      const events = await fetchRawNBAEvents();
      const oddsMap = new Map<string, NBAGameOdds>();

      for (const event of events) {
        if (!hasTag(event, "100639")) continue;
        const titleLower = event.title.toLowerCase();

        // Check if this event is NBA-related
        const isNBA = NBA_KEYWORDS.some((kw) => titleLower.includes(kw));
        if (!isNBA) continue;

        // Must be a vs matchup
        const teams = parseNBATeamsFromTitle(event.title);
        if (!teams) continue;

        const homeTeam = matchToNBATeam(teams.team1);
        const awayTeam = matchToNBATeam(teams.team2);
        if (!homeTeam || !awayTeam) continue;

        // Skip expired events
        if (event.endDate && new Date(event.endDate) < new Date()) continue;

        const odds = extractNBAGameOdds(event, homeTeam, awayTeam);

        // Only include if we got moneyline data
        if (odds.moneylineHome > 0 || odds.moneylineAway > 0) {
          // Key: canonical "HomeTeam|AwayTeam"
          const key = `${homeTeam}|${awayTeam}`;
          oddsMap.set(key, odds);
          // Also set reverse key for matching flexibility
          const reverseKey = `${awayTeam}|${homeTeam}`;
          if (!oddsMap.has(reverseKey)) {
            oddsMap.set(reverseKey, {
              ...odds,
              moneylineHome: odds.moneylineAway,
              moneylineAway: odds.moneylineHome,
            });
          }
        }
      }

      return oddsMap;
    } catch (err) {
      console.error("[polymarket] Error fetching NBA game markets:", err);
      return new Map();
    }
  }, FIVE_MINUTES);
}

/**
 * Enrich games with both season odds AND single-game Polymarket odds.
 */
export function enrichGamesWithAllOdds(
  games: NBAGame[],
  seasonOddsMap: Map<string, TeamMarketOdds>,
  gameOddsMap: Map<string, NBAGameOdds>
): GameWithOdds[] {
  return games.map((game) => {
    const homeTeam = game.homeTeam.teamName;
    const awayTeam = game.awayTeam.teamName;
    const key = `${homeTeam}|${awayTeam}`;

    return {
      game,
      homeOdds: seasonOddsMap.get(homeTeam) ?? { ...EMPTY_ODDS },
      awayOdds: seasonOddsMap.get(awayTeam) ?? { ...EMPTY_ODDS },
      gameOdds: gameOddsMap.get(game.gameId) ?? gameOddsMap.get(key),
    };
  });
}
