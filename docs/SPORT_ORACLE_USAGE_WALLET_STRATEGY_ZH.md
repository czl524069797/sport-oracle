# Sport Oracle 使用文档：钱包连接与策略配置

更新时间：2026-05-12

## 1. 当前结论

Sport Oracle 当前支持通过 RainbowKit + wagmi + viem 连接 EVM 钱包，运行网络配置为 Polygon。OKX 钱包可以接入，推荐优先使用两种方式：

- OKX Wallet 手机端：通过 WalletConnect 扫码连接。
- OKX Wallet 浏览器插件：作为 EVM injected provider 连接，或后续增加 OKX 专属入口。

当前项目还没有单独展示“OKX 钱包”品牌入口。也就是说，OKX 能用，但是否在连接弹窗中明确显示为 OKX，取决于 RainbowKit 对当前浏览器插件和 WalletConnect 的识别结果。若要保证用户看到固定的“OKX 钱包”按钮，需要新增显式 OKX connector。

## 2. 环境变量配置

本地开发使用 `.env.local`，不要把真实密钥提交到 Git。

```env
# Database
DATABASE_URL=file:./prisma/dev.db

# AI：优先使用硅基流动；没有 SILICONFLOW_API_KEY 时才回退到 AI_API_KEY
SILICONFLOW_API_KEY=sk-...
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Qwen/Qwen3-8B

# Optional custom OpenAI-compatible fallback
AI_API_KEY=sk-...
AI_BASE_URL=https://example.com/v1
AI_MODEL=grok-4

# Polymarket data
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_API_URL=https://clob.polymarket.com

# Wallet / chain
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<walletconnect-project-id>
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com

# Trading mode
# false：默认推荐模式，只跳转 Polymarket 或复制订单信息
# true：显示站内下单按钮，需要后端交易服务和鉴权配置配套完成
NEXT_PUBLIC_ENABLE_SERVER_TRADING=false

# Optional server-side trading key。生产环境不建议长期使用服务器托管私钥。
POLYMARKET_PRIVATE_KEY=

# NBA auxiliary service
NBA_SERVICE_URL=http://localhost:8000

# Optional SIWE strict checks
JWT_SECRET=<strong-random-secret>
SIWE_EXPECTED_DOMAIN=localhost:3100
SIWE_EXPECTED_CHAIN_ID=137
```

## 3. 启动顺序

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

默认访问：

```text
http://localhost:3000
```

如果本地使用 3100：

```bash
PORT=3100 pnpm exec next dev --hostname 127.0.0.1 --port 3100
```

## 4. 钱包连接

### 4.1 当前钱包架构

项目当前入口：

- `src/lib/wagmi.ts`：wagmi + RainbowKit 配置。
- `src/components/wallet/WalletProviders.tsx`：全局钱包 Provider。
- `src/components/wallet/RainbowConnectButton.tsx`：页面右上角连接按钮。
- `src/hooks/useSkillAuth.ts`：SIWE 签名登录。

当前链配置：

```ts
chains: [polygon]
```

因此用户连接钱包后需要切到 Polygon 主网。Polygon chainId 是 `137`。

### 4.2 OKX 钱包怎么连接

OKX 钱包可以做到。

推荐用户路径：

1. 安装 OKX Wallet 浏览器插件，或打开 OKX Wallet 手机端。
2. 点击页面右上角“连接钱包”。
3. 如果弹窗里出现 OKX Wallet，直接选择。
4. 如果没有出现 OKX Wallet：
   - 手机端使用 WalletConnect 扫码。
   - 浏览器插件可以尝试选择 injected/browser wallet 类型。
5. 钱包连接成功后，检查网络是否为 Polygon。
6. 如需站内签名登录，点击 Header 中的“签名登录”，确认 SIWE 签名。

OKX 官方 EVM Provider 支持 `eth_requestAccounts`，插件侧会注入 `window.okxwallet`，并支持 `accountsChanged`、`chainChanged` 等事件。项目使用 wagmi/RainbowKit 后，不需要业务代码直接调用 `window.okxwallet` 才能完成常规连接；但如果要做“OKX 专属连接按钮”，可以基于该 provider 做显式适配。

### 4.3 OKX 专属入口改造建议

如果需要在连接弹窗中固定显示 OKX 钱包，建议做一个小改造：

1. 在 `src/lib/wagmi.ts` 中从 RainbowKit wallet connectors 显式引入 OKX wallet connector。
2. 保留 `walletConnectWallet` 作为手机扫码兜底。
3. 保留 `injectedWallet` 作为浏览器插件兜底。
4. 将 `appName` 从旧的 `NBA Predict DApp` 改成 `Sport Oracle`。
5. 增加一个连接验收：OKX 插件、OKX 手机端 WalletConnect、错误网络切换。

验收标准：

- OKX Wallet 插件可连接并显示地址。
- OKX Wallet 手机端可通过 WalletConnect 连接。
- 连接后 chain 为 Polygon，否则 RainbowKit 提示切链。
- SIWE 签名登录成功，`localStorage.skill_jwt` 写入 token。
- `/strategy` 能读取该钱包地址下的策略。

## 5. 签名登录与鉴权

连接钱包只代表拿到了地址；签名登录用于后端鉴权。

流程：

1. 前端调用 `GET /api/auth/nonce` 获取 nonce。
2. 前端按 EIP-4361 生成 SIWE message。
3. 钱包弹出签名确认。
4. 前端调用 `POST /api/auth/verify`。
5. 成功后把 JWT 保存到 `localStorage.skill_jwt`。
6. 需要后端门禁的请求会携带 `Authorization: Bearer <token>`。

常见失败原因：

- `SIWE_EXPECTED_DOMAIN` 和当前访问域名不一致。
- `SIWE_EXPECTED_CHAIN_ID` 和当前钱包网络不一致。
- JWT_SECRET 改动后旧 token 失效。
- 钱包切换地址后，需要重新签名登录。

## 6. 策略配置

入口：

```text
/strategy
```

连接钱包后，策略按钱包地址保存。核心字段：

| 字段 | 范围 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | 1-100 字符 | Default Strategy | 策略名称 |
| `isActive` | true/false | true | 是否启用 |
| `minConfidence` | 0-1 | 0.65 | AI 置信度低于该值时不下注 |
| `maxBetAmount` | 0.1-1000 | 1 | 单注上限，单位 USDC |
| `dailyBudget` | 0.1-10000 | 10 | 每日预算，单位 USDC |
| `autoExecute` | true/false | false | 是否允许自动执行策略 |

当前代码已经允许 `0.1` USDC 作为单注上限和日预算下限。

### 6.1 推荐配置

保守验证期：

```text
minConfidence = 0.70
maxBetAmount = 0.1
dailyBudget = 1
autoExecute = false
```

小额实盘期：

```text
minConfidence = 0.65
maxBetAmount = 1
dailyBudget = 10
autoExecute = false
```

自动化观察期：

```text
minConfidence = 0.72
maxBetAmount = 1
dailyBudget = 5
autoExecute = true
```

说明：`autoExecute=true` 不等于立即自动下注。它还依赖 `/api/cron`、后端交易服务、鉴权和交易模式配置。

## 7. 策略如何决定是否下注

当前判断逻辑在 `src/lib/bet-executor.ts`：

```text
shouldBet =
  strategy.isActive
  && analysis.recommendedSide !== "none"
  && analysis.confidence >= strategy.minConfidence
  && analysis.edgePercent >= 0.03
```

也就是说，即使 AI 给出分析，也不一定触发下注。必须同时满足：

- 策略启用。
- AI 有明确推荐方向。
- AI 置信度达到阈值。
- 市场优势至少 3%。

仓位计算使用四分之一 Kelly，并乘以 AI confidence，再受以下限制：

- 不超过 `maxBetAmount`。
- 不超过当天剩余 `dailyBudget`。
- 单次最多不超过日预算的 10%。

## 8. 下单模式

### 8.1 默认推荐模式

推荐默认保持：

```env
NEXT_PUBLIC_ENABLE_SERVER_TRADING=false
```

此时分析卡片不会直接站内下单，而是提供：

- 跳转到 Polymarket 对应市场。
- 复制推荐订单信息。

这是当前最安全的用户路径，因为资金操作发生在 Polymarket 官方页面和用户钱包中。

### 8.2 站内交易模式

只有在确认后端交易服务、安全策略和密钥管理都准备好时，才启用：

```env
NEXT_PUBLIC_ENABLE_SERVER_TRADING=true
```

站内交易当前会调用：

```text
POST /api/betting
```

Next API 再调用：

```text
NBA_SERVICE_URL/api/trading/place
```

注意：

- 当前下单链路仍依赖 Python trading service。
- 如果配置 `POLYMARKET_PRIVATE_KEY`，会进入服务器托管私钥模式。
- 生产环境更推荐非托管模式：用户在前端签名订单，不在服务器保存私钥。

## 9. 日常使用流程

1. 启动项目。
2. 打开 `/markets`、`/football` 或 `/esports`。
3. 确认数据加载完成。
4. 点击 AI 分析按钮。
5. 查看 AI 胜率、置信度、edge、推荐方向。
6. 连接 OKX 或其他 EVM 钱包。
7. 进入 `/strategy` 配置策略。
8. 默认模式下跳转 Polymarket 手动下单。
9. 在 `/history` 查看站内记录。

## 10. 故障排查

### 10.1 连接钱包按钮无反应

- 检查 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 是否配置。
- 浏览器插件钱包是否解锁。
- 尝试刷新页面后再点连接。
- 手机端优先使用 WalletConnect 扫码。

### 10.2 OKX 没有出现在连接弹窗

- 使用 WalletConnect 扫码兜底。
- 确认 OKX Wallet 插件已安装并启用。
- 如果必须固定显示 OKX，需要新增显式 OKX connector。

### 10.3 提示错误网络

- 当前项目只配置了 Polygon。
- 在钱包中切换到 Polygon，或通过 RainbowKit 弹窗切链。
- 如果 SIWE 开启严格校验，确认 `SIWE_EXPECTED_CHAIN_ID=137`。

### 10.4 签名登录失败

- 清理 `localStorage.skill_jwt` 后重新签名。
- 检查 `JWT_SECRET`。
- 检查 `SIWE_EXPECTED_DOMAIN` 是否等于当前 host。
- 检查钱包地址是否切换。

### 10.5 策略保存失败

- 必须先连接钱包。
- `maxBetAmount` 和 `dailyBudget` 不能低于 `0.1`。
- `minConfidence` 必须在 `0` 到 `1` 之间。

### 10.6 为什么没有直接下注按钮

- 如果 `NEXT_PUBLIC_ENABLE_SERVER_TRADING=false`，系统会显示 Polymarket 跳转和复制订单。
- 如果要站内下单，需要启用 server trading 并配置 Python trading service。

## 11. 参考链接

- OKX Wallet EVM Provider API：https://web3.okx.com/zh-hans/onchainos/dev-docs/sdks/chains/evm/provider
- Polymarket：https://polymarket.com
- WalletConnect Cloud：https://cloud.walletconnect.com
