// ============= NBA Data Types =============

export interface NBAGame {
  gameId: string;
  gameDate: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: string;
}

export interface TeamInfo {
  teamId: number;
  teamName: string;
  teamAbbreviation: string;
  record: string;
  homeRecord?: string;
  awayRecord?: string;
}

export interface TeamStats {
  teamId: number;
  teamName: string;
  last10Record: string;
  homeRecord: string;
  awayRecord: string;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  pace: number;
  pointsPerGame: number;
  opponentPointsPerGame: number;
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  position: string;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  minutesPerGame: number;
  isInjured: boolean;
  injuryStatus?: string;
}

export interface HeadToHead {
  homeWins: number;
  awayWins: number;
  games: Array<{
    date: string;
    homeScore: number;
    awayScore: number;
    winner: string;
  }>;
}

// ============= Polymarket Types =============

export interface PolymarketMarket {
  id: string;
  conditionId: string;
  questionId: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  tokens: MarketToken[];
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
}

export interface MarketToken {
  tokenId: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface MatchedMarket {
  market: PolymarketMarket;
  game: NBAGame;
  homeToken: MarketToken;
  awayToken: MarketToken;
}

// ============= Season Market Types =============

export interface TeamMarketOdds {
  championshipPrice: number;
  championshipMarketId: string;
  conferencePrice: number;
  conferenceMarketId: string;
}

export interface GameWithOdds {
  game: NBAGame;
  homeOdds: TeamMarketOdds;
  awayOdds: TeamMarketOdds;
}

// ============= AI Analysis Types =============

export interface AIAnalysisInput {
  game: NBAGame;
  homeStats: TeamStats;
  awayStats: TeamStats;
  homePlayers: PlayerStats[];
  awayPlayers: PlayerStats[];
  headToHead: HeadToHead;
  marketPrice: {
    home: number;
    away: number;
  };
}

export interface SpreadAnalysis {
  favoredTeam: "home" | "away";
  spreadValue: number;
  spreadConfidence: number;
  coverRecommendation: "home" | "away" | "none";
}

export interface TotalPointsAnalysis {
  predictedTotal: number;
  overUnderLine: number;
  overProbability: number;
  underProbability: number;
  ouConfidence: number;
  recommendation: "over" | "under" | "none";
}

export interface AIAnalysisResult {
  homeWinProbability: number;
  awayWinProbability: number;
  confidence: number;
  confidenceExplanation: string;
  keyFactors: string[];
  reasoning: string;
  spreadAnalysis: SpreadAnalysis;
  totalPointsAnalysis: TotalPointsAnalysis;
  newsHighlights: string[];
}

export interface AnalysisWithEdge extends AIAnalysisResult {
  marketId: string;
  conditionId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  marketPrice: number;
  edgePercent: number;
  recommendedSide: "home" | "away" | "none";
  recommendedOutcome: "YES" | "NO";
  tokenId: string;
}

// ============= Strategy Types =============

export interface StrategyConfig {
  id?: string;
  name: string;
  isActive: boolean;
  minConfidence: number;
  maxBetAmount: number;
  dailyBudget: number;
  autoExecute: boolean;
}

// ============= Betting Types =============

export interface BetRequest {
  analysisId: string;
  tokenId: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  amount: number;
  price: number;
}

export interface BetRecord {
  id: string;
  analysisId: string;
  tokenId: string;
  side: string;
  outcome: string;
  amount: number;
  price: number;
  orderId: string | null;
  status: string;
  pnl: number | null;
  txHash: string | null;
  createdAt: string;
  settledAt: string | null;
  analysis?: {
    homeTeam: string;
    awayTeam: string;
    gameDate: string;
    homeWinProb: number;
    awayWinProb: number;
    confidence: number;
  };
}

// ============= Dashboard Types =============

export interface DashboardStats {
  totalBets: number;
  winRate: number;
  totalPnl: number;
  roi: number;
  activeBets: number;
  todayBets: number;
  todayPnl: number;
  avgConfidence: number;
}

// ============= Game Analysis Summary (embedded in card) =============

export interface GameAnalysisSummary {
  homeWinProbability: number;
  awayWinProbability: number;
  predictedTotal: number;
  overProbability: number;
  underProbability: number;
  newsHighlights: string[];
}

// ============= Polymarket Event Types (Football / Esports) =============

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  markets: PolymarketEventMarket[];
  category: "football" | "esports";
}

export interface PolymarketEventMarket {
  id: string;
  question: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: string;
  active: boolean;
  closed: boolean;
}

export interface EventsResponse {
  events: PolymarketEvent[];
}

// ============= Season Overview Types =============

export interface FuturesMarket {
  id: string;
  title: string;
  slug: string;
  outcomes: FuturesOutcome[];
}

export interface FuturesOutcome {
  name: string;
  price: number;
  marketId: string;
}

export interface CategoryOverview {
  category: "nba" | "football" | "esports";
  markets: FuturesMarket[];
}

// ============= API Response =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MarketsResponse {
  today: GameWithOdds[];
  tomorrow: GameWithOdds[];
  allTodayFinished: boolean;
  labels: {
    todayLabel: string;
    tomorrowLabel: string;
  };
}
