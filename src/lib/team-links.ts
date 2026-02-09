/**
 * External link utility for team/player info pages.
 */

// NBA team slugs used by nba.com
const NBA_TEAM_SLUGS: Record<string, string> = {
  "Atlanta Hawks": "hawks",
  "Boston Celtics": "celtics",
  "Brooklyn Nets": "nets",
  "Charlotte Hornets": "hornets",
  "Chicago Bulls": "bulls",
  "Cleveland Cavaliers": "cavaliers",
  "Dallas Mavericks": "mavericks",
  "Denver Nuggets": "nuggets",
  "Detroit Pistons": "pistons",
  "Golden State Warriors": "warriors",
  "Houston Rockets": "rockets",
  "Indiana Pacers": "pacers",
  "LA Clippers": "clippers",
  "Los Angeles Clippers": "clippers",
  "Los Angeles Lakers": "lakers",
  "Memphis Grizzlies": "grizzlies",
  "Miami Heat": "heat",
  "Milwaukee Bucks": "bucks",
  "Minnesota Timberwolves": "timberwolves",
  "New Orleans Pelicans": "pelicans",
  "New York Knicks": "knicks",
  "Oklahoma City Thunder": "thunder",
  "Orlando Magic": "magic",
  "Philadelphia 76ers": "sixers",
  "Phoenix Suns": "suns",
  "Portland Trail Blazers": "blazers",
  "Sacramento Kings": "kings",
  "San Antonio Spurs": "spurs",
  "Toronto Raptors": "raptors",
  "Utah Jazz": "jazz",
  "Washington Wizards": "wizards",
};

export function getNBATeamLink(teamName: string): string | null {
  const slug = NBA_TEAM_SLUGS[teamName];
  if (!slug) return null;
  return `https://www.nba.com/team/${slug}`;
}

export function getFootballTeamLink(teamName: string): string {
  return `https://www.zhibo8.com/search?q=${encodeURIComponent(teamName)}`;
}

/**
 * Detect esports category from event title/outcome and return the right reference site link.
 */
export function getEsportsTeamLink(teamName: string, eventTitle?: string): string {
  const title = (eventTitle ?? "").toLowerCase();
  if (title.includes("valorant") || title.includes("vct")) {
    return `https://www.op.gg/esports/search?query=${encodeURIComponent(teamName)}`;
  }
  if (title.includes("lol") || title.includes("league") || title.includes("lpl") || title.includes("lck") || title.includes("lec")) {
    return `https://lolesports.com/search?q=${encodeURIComponent(teamName)}`;
  }
  // Default to HLTV for CS2 and other esports
  return `https://www.hltv.org/search?query=${encodeURIComponent(teamName)}`;
}

export function getTeamLink(
  teamName: string,
  category: "nba" | "football" | "esports",
  eventTitle?: string
): string | null {
  switch (category) {
    case "nba":
      return getNBATeamLink(teamName);
    case "football":
      return getFootballTeamLink(teamName);
    case "esports":
      return getEsportsTeamLink(teamName, eventTitle);
    default:
      return null;
  }
}
