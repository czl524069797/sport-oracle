## ADDED Requirements

### Requirement: Source freshness metadata

SportOracle SHALL attach source freshness metadata to sports schedule, team stats and market prices used for AI analysis.

#### Scenario: Fresh NBA schedule data

- **WHEN** the NBA markets page loads games
- **THEN** each game SHALL include the source name, source update time and fetch time
- **AND** the UI SHALL be able to display whether the data is fresh or stale

#### Scenario: Stale market data

- **WHEN** a market price is older than the configured freshness target
- **THEN** the analysis SHALL show a stale data warning
- **AND** strong betting recommendations SHALL be disabled until refreshed

### Requirement: Market scope classification

SportOracle SHALL classify each market by scope before using it for edge calculation.

#### Scenario: Single-game moneyline edge

- **WHEN** a game has a `single_game_moneyline` market for both teams
- **THEN** the edge calculation MAY compare AI win probability against the market implied probability

#### Scenario: Season futures fallback

- **WHEN** only season champion or conference champion markets are available
- **THEN** the market MAY be shown in overview
- **AND** the single-game edge SHALL be set to zero or marked not comparable

### Requirement: Identity normalization

SportOracle SHALL normalize team and event identity before matching schedule data to Polymarket markets.

#### Scenario: Alias-based fallback

- **WHEN** canonical event IDs are unavailable
- **THEN** the system MAY use aliases and title parsing
- **AND** the match SHALL be flagged as fallback-derived for data quality scoring

### Requirement: Playwright acceptance

SportOracle SHALL maintain Playwright coverage for core user-visible flows after the browser verification gate is approved.

#### Scenario: NBA markets page renders

- **WHEN** mocked market data is returned
- **THEN** the NBA markets page SHALL render without crashing
- **AND** the page SHALL show either games, an empty state or a clear error state

#### Scenario: Mobile viewport

- **WHEN** the app is opened on an iOS-sized or Android-sized viewport
- **THEN** the dashboard and NBA markets page SHALL remain readable without overlapping core text
