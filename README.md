# SportOracle

**AI-Powered Sports Prediction Platform on Polymarket**

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## What is SportOracle?

SportOracle is an AI-driven sports prediction platform that connects to **Polymarket** prediction markets. It covers **NBA**, **Football (Soccer)**, and **Esports**, providing real-time odds analysis, AI-powered game predictions, and smart betting tools — all in a cyberpunk-styled dark UI.

## Features

### Multi-Sport Coverage
- **NBA** — Game-level AI analysis with moneyline, point spread, and over/under predictions
- **Football** — EPL, La Liga, Bundesliga, Serie A, Champions League, and 2026 FIFA World Cup markets
- **Esports** — League of Legends (LPL/LCK/LEC), CS2, Valorant, Dota 2

### AI Analysis Engine
- GPT-powered analysis of team stats, injuries, head-to-head records, and recent form
- Confidence scoring with detailed reasoning and key factors
- Market edge detection — find mispriced odds on Polymarket
- Kelly Criterion position sizing recommendations

### Season Overview
- Real-time futures/odds tracking (MVP, Championship, League Winners)
- Top 3-5 ranked outcomes with visual progress bars
- Multi-league support with automatic translation

### Polymarket Integration
- Direct connection to Polymarket CLOB (Central Limit Order Book)
- Live market prices, volume, and liquidity data
- One-click betting with wallet integration (RainbowKit + wagmi)

### Bilingual Interface
- Full Chinese / English i18n support
- Team name translations following official conventions (zhibo8 for football, nba.com for NBA)
- Locale-aware AI analysis responses

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | OpenAI-compatible API (GPT-4) |
| Markets | Polymarket Gamma API |
| Wallet | RainbowKit + wagmi + viem |
| Database | Prisma + PostgreSQL / SQLite |
| State | Zustand + TanStack React Query |

## Getting Started

### Prerequisites
- **Node.js** >= 18
- **pnpm** (or npm)
- **Python** >= 3.10 (for NBA data service)

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/sport-oracle.git
cd sport-oracle
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database
DATABASE_URL=file:./dev.db

# AI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1     # or compatible endpoint
OPENAI_MODEL=gpt-4

# Polymarket
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_API_URL=https://clob.polymarket.com
POLYMARKET_PRIVATE_KEY=                        # optional, for auto-betting

# Wallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# NBA Data Service
NBA_SERVICE_URL=http://localhost:8000
```

### 3. Database Setup

```bash
pnpm db:generate
pnpm db:push
```

### 4. Start NBA Data Service (optional)

```bash
cd nba-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── markets/          # NBA markets & AI analysis
│   ├── football/         # Football predictions
│   ├── esports/          # Esports predictions
│   ├── strategy/         # Betting strategy config
│   ├── history/          # Bet history & PnL tracking
│   └── api/              # API routes
├── components/
│   ├── analysis/         # AI analysis panel & prediction cards
│   ├── events/           # Event cards, lists, season overview
│   ├── markets/          # NBA market cards & lists
│   ├── layout/           # App shell (header, footer)
│   └── ui/               # shadcn/ui base components
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization (zh/en)
├── lib/                  # Server-side utilities
│   ├── openai.ts         # AI analysis prompts
│   ├── polymarket-events.ts    # Football/esports event fetching
│   ├── polymarket-overview.ts  # Season futures/odds
│   └── team-links.ts     # External team info links
└── types/                # TypeScript type definitions
```

---

<a id="中文"></a>

## SportOracle 是什么？

SportOracle 是一个 AI 驱动的体育预测平台，直连 **Polymarket** 预测市场。覆盖 **NBA**、**足球** 和 **电竞** 三大板块，提供实时赔率分析、AI 比赛预测和智能投注工具，采用赛博朋克风格暗色 UI。

## 核心功能

### 多赛事覆盖
- **NBA** — 单场 AI 深度分析：胜负 (Moneyline)、让分 (Point Spread)、大小分 (Over/Under)
- **足球** — 英超、西甲、德甲、意甲、欧冠、2026 美加墨世界杯市场
- **电竞** — 英雄联盟 (LPL/LCK/LEC)、CS2、无畏契约、Dota 2

### AI 分析引擎
- GPT 驱动：分析球队数据、伤病、交手记录、近期状态
- 置信度评分：附带详细推理逻辑和关键因素解释
- 市场优势发现：找出 Polymarket 上的错误定价
- Kelly 准则仓位建议

### 赛季概览
- 实时期货/赔率追踪（MVP、总冠军、联赛冠军）
- 前 3-5 名排名展示，可视化进度条
- 多联赛支持，自动中文翻译（足球参考直播吧命名规范）

### Polymarket 集成
- 直连 Polymarket CLOB 中央限价订单簿
- 实时市场价格、交易量、流动性数据
- 一键下注，钱包集成 (RainbowKit + wagmi)
- 队名可点击跳转至外部信息页（NBA → nba.com，足球 → 直播吧，电竞 → HLTV/op.gg）

### 中英双语
- 完整的中英文国际化支持
- 球队名称翻译遵循官方惯例
- AI 分析结果根据语言环境自动适配

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript (严格模式) |
| 样式 | Tailwind CSS + shadcn/ui + 赛博朋克主题 |
| AI | OpenAI 兼容 API (GPT-4) |
| 市场数据 | Polymarket Gamma API |
| 钱包 | RainbowKit + wagmi + viem |
| 数据库 | Prisma + PostgreSQL / SQLite |
| 状态管理 | Zustand + TanStack React Query |

## 快速开始

### 前置条件
- **Node.js** >= 18
- **pnpm**（或 npm）
- **Python** >= 3.10（用于 NBA 数据服务）

### 1. 克隆 & 安装

```bash
git clone https://github.com/<your-username>/sport-oracle.git
cd sport-oracle
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 数据库
DATABASE_URL=file:./dev.db

# AI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# Polymarket
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_API_URL=https://clob.polymarket.com
POLYMARKET_PRIVATE_KEY=                        # 可选，用于自动下注

# 钱包
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# NBA 数据服务
NBA_SERVICE_URL=http://localhost:8000
```

### 3. 数据库初始化

```bash
pnpm db:generate
pnpm db:push
```

### 4. 启动 NBA 数据服务（可选）

```bash
cd nba-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm db:studio` | 打开 Prisma 数据库可视化 |
| `pnpm db:push` | 同步 Schema 到数据库 |

## License

MIT

---

Built with Next.js, Tailwind CSS, OpenAI, and Polymarket.
