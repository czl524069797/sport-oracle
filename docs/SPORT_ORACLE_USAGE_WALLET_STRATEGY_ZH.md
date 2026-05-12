# Sport Oracle 使用与技术文档

更新时间：2026-05-12

## 使用文档

### 启动

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

本地默认访问 `http://localhost:3000`。如需固定 3100：

```bash
PORT=3100 pnpm exec next dev --hostname 127.0.0.1 --port 3100
```

### 钱包连接

当前钱包弹窗已加入：

- OKX Wallet
- Binance Wallet
- WalletConnect
- Injected Wallet

使用流程：

1. 点击右上角“连接钱包”。
2. 选择 OKX Wallet、Binance Wallet 或 WalletConnect。
3. 网络切到 Polygon。
4. 如需鉴权，点击“签名登录”完成 SIWE 签名。
5. 进入 `/strategy` 配置策略。

### 策略配置

策略按钱包地址保存，入口是 `/strategy`。

| 字段 | 默认值 | 范围 | 说明 |
| --- | --- | --- | --- |
| `minConfidence` | `0.65` | `0-1` | AI 置信度阈值 |
| `maxBetAmount` | `1` | `0.1-1000` | 单注上限，USDC |
| `dailyBudget` | `10` | `0.1-10000` | 每日预算，USDC |
| `autoExecute` | `false` | true/false | 是否允许自动执行 |

小额验证建议：

```text
minConfidence = 0.70
maxBetAmount = 0.1
dailyBudget = 1
autoExecute = false
```

### 下单模式

默认建议使用推荐模式：

```env
NEXT_PUBLIC_ENABLE_SERVER_TRADING=false
```

此模式下，分析结果只提供 Polymarket 跳转和复制订单信息。

站内交易模式：

```env
NEXT_PUBLIC_ENABLE_SERVER_TRADING=true
```

站内交易依赖 Python trading service 和后端鉴权；生产环境不建议服务器长期托管私钥。

## 技术文档

### 核心模块

| 模块 | 文件 |
| --- | --- |
| 钱包配置 | `src/lib/wagmi.ts` |
| 钱包 Provider | `src/components/wallet/WalletProviders.tsx` |
| 连接按钮 | `src/components/wallet/RainbowConnectButton.tsx` |
| SIWE 签名登录 | `src/hooks/useSkillAuth.ts` |
| 策略表单 | `src/components/strategy/StrategyForm.tsx` |
| 策略 API | `src/app/api/strategy/route.ts` |
| 下注 API | `src/app/api/betting/route.ts` |
| 策略判断与仓位 | `src/lib/bet-executor.ts` |

### 钱包配置

`src/lib/wagmi.ts` 使用 RainbowKit 内置连接器：

```ts
wallets: [
  {
    groupName: "Recommended",
    wallets: [
      okxWallet,
      binanceWallet,
      walletConnectWallet,
      injectedWallet,
    ],
  },
]
```

当前链：

```ts
chains: [polygon]
```

### 关键环境变量

```env
DATABASE_URL=file:./prisma/dev.db

SILICONFLOW_API_KEY=sk-...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Qwen/Qwen3-8B

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_ENABLE_SERVER_TRADING=false

POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_API_URL=https://clob.polymarket.com
POLYMARKET_PRIVATE_KEY=

JWT_SECRET=...
SIWE_EXPECTED_DOMAIN=localhost:3000
SIWE_EXPECTED_CHAIN_ID=137
NBA_SERVICE_URL=http://localhost:8000
```

### 策略执行规则

`shouldBet` 必须同时满足：

```text
strategy.isActive
analysis.recommendedSide !== "none"
analysis.confidence >= strategy.minConfidence
analysis.edgePercent >= 0.03
```

仓位计算使用四分之一 Kelly，并受 `maxBetAmount`、`dailyBudget` 和当天剩余额度限制。

### 部署

前端按仓库约定推送 `main` 后由 Vercel 自动部署。

```bash
pnpm build
git push origin main
```
