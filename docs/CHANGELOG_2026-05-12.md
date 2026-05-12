# SportOracle 2026-05-12 修改文档

## 目标

本次修改围绕三个问题：

1. SportOracle 的 NBA 数据与 Polymarket 市场匹配不够可靠。
2. 原有服务端私钥下单模式风险较高，需要默认转向非托管/手动确认路径。
3. 应用侧不应该把下注金额写死到 5 美元或 10 美元，应该支持 0.1/1 美元级别的策略配置，同时明确 Polymarket 实际成交仍受 `min_order_size` 限制。

## 已完成

### 数据源与市场质量

- 将 Python NBA schedule 拉取切到 NBA 官方 CDN 静态赛程数据，降低 `nba_api` scoreboard 波动对赛程读取的影响。
- Polymarket 单场匹配增加 14 天窗口过滤，避免把赛季 futures 或远期市场误当成近期单场比赛。
- 为分析结果保留 `polymarketUrl`，UI 可以引导用户到对应市场页面。
- 新增 OpenSpec：`openspec/changes/harden-sports-data-quality/`，记录数据质量层、市场范围分类、Playwright 验收策略。

### 非托管下单与安全

- Python trading service 增加 `ENABLE_SERVER_TRADING` 开关，默认关闭服务端下单与撤单。
- 前端在关闭服务端交易时不再展示直接下单主路径，而是展示“去 Polymarket 下单”和“复制下单信息”。
- 增加 SIWE/JWT 鉴权代理与后端接口，为后续白名单和链上 SkillVerifier 门禁保留能力。
- 前端登录状态现在校验 JWT 地址是否匹配当前钱包地址，避免旧地址 token 误用。

### 微额下注门槛

- 默认直接下注金额从 `$10` 降到 `$1`。
- 策略默认值调整为 `maxBetAmount=$1`、`dailyBudget=$10`。
- 策略表单和 API 支持 `0.1` 美元粒度。
- 文档明确：应用侧可以支持 0.1/1 美元输入，但 Polymarket 成交下限由 `min_order_size * price` 动态决定，不能承诺所有市场都能 0.1/1 美元成交。

### 验收与文档

- 新增 `docs/DATA_SOURCE_STRATEGY.md`。
- 新增 `docs/MICRO_BET_FEASIBILITY.md`。
- 新增 `docs/PLAYWRIGHT_PRACTICE.md`。
- 新增 Playwright 配置与 E2E smoke spec，但按项目规范未自动运行浏览器测试。

## 校验结果

- `pnpm exec tsc --noEmit --pretty false`：通过
- `pnpm exec next lint`：通过
- `python3 -m compileall -q nba-service/endpoints nba-service/middlewares nba-service/services nba-service/main.py`：通过
- `pnpm build`：通过

## 未自动执行

- Playwright 浏览器测试未运行。项目规则要求在完成常规校验后先询问用户确认，再运行 Playwright。

## 后续建议

1. 实现 `/api/data-quality?sport=nba`，把 OpenSpec 中的数据质量分数真正暴露给前端。
2. 在下单前读取 CLOB order book 的 `min_order_size`，根据 `amount / price` 给出明确的最小 USDC 提示。
3. 把服务端私钥下单彻底替换为浏览器钱包签名或 Polymarket 官方页面跳转。
