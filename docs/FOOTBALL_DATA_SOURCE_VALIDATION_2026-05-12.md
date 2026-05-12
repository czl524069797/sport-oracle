# Football 数据源验证记录 2026-05-12

## 结论

线上足球对阵出现“牛头不对马嘴”的核心原因不是 Polymarket Gamma 源数据本身错误，而是应用侧解析和筛选规则有两个问题：

1. 代码优先使用 `startDate` 作为比赛时间，但 Gamma 里的 `startDate` 更接近市场创建/上线时间；足球单场真实开赛/结算时间应优先使用 `endDate`。
2. `- More Markets` 衍生盘口也可能包含 `vs`，旧逻辑会把它当成主对阵，导致客队名被污染成 `Team B - More Markets`，并可能展示非胜平负盘口。

## 本次修复

- `/api/football` 的单场比赛时间改为 `endDate || startDate`。
- 足球/电竞事件拉取从单页前 100 个扩展为最多 5 页，避免高成交量 futures 挤掉真实单场。
- `More Markets` 衍生盘口不再进入单场比赛列表。
- 队名解析增加清洗规则，去掉电竞标题前缀、括号赛制、尾部赛事说明。
- 赔率匹配从“第一个单词”改为规范化实体匹配，减少 `FC`、`City`、`Club` 等泛词误判。
- Playwright 新增足球 API 数据质量验收：必须返回未来比赛，队名不能包含 `Will`、`More Markets`、问号，链接必须是 Polymarket event URL。

## 测试环境

- 本地手动验证环境：`http://127.0.0.1:3003`
- Playwright 验收环境：`http://127.0.0.1:3100`
- Playwright 启动命令：`PORT=3100 pnpm exec playwright test tests/e2e/sports-data-quality.spec.ts --workers=1`
- 端口说明：Playwright 配置已支持 `PORT`、`PLAYWRIGHT_BASE_URL`、`PLAYWRIGHT_SKIP_WEB_SERVER`，方便在 3000 被占用时使用隔离测试端口。

## 当前样本

接口：`GET /api/football`

样本结果：

| Match | Home | Away | Match Date UTC | Home | Draw | Away |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Deportivo Alavés vs. FC Barcelona | Deportivo Alavés | FC Barcelona | 2026-05-13T19:30:00Z | 0.285 | 0.255 | 0.455 |
| Arsenal FC vs. Burnley FC | Arsenal FC | Burnley FC | 2026-05-18T19:00:00Z | 0.905 | 0.075 | 0.032 |
| Chelsea FC vs. Manchester City FC | Chelsea FC | Manchester City FC | 2026-05-16T14:00:00Z | 0.215 | 0.235 | 0.545 |
| FC Bayern München vs. 1. FC Köln | FC Bayern München | 1. FC Köln | 2026-05-16T13:30:00Z | 0.835 | 0.105 | 0.055 |

## 验证结果

- `curl http://127.0.0.1:3003/api/football`：返回 20 个未来足球单场。
- `badNames` 检查：0 个污染队名。
- `invalidDates` 检查：0 个过期比赛。
- `pnpm exec tsc --noEmit --pretty false`：通过。
- `pnpm exec next lint`：通过。
- `pnpm build`：通过。
- `PORT=3100 pnpm exec playwright test tests/e2e/sports-data-quality.spec.ts --workers=1`：15/15 通过，覆盖 `chromium-desktop`、`mobile-ios`、`mobile-android`。

## 测试环境稳定性修复

- 钱包 Provider 改为 client-only 动态加载，避免 Next 服务端预渲染时触发 WalletConnect 访问 `indexedDB`。
- RainbowKit 连接按钮改为动态加载，服务端渲染阶段只保留安全 fallback。
- Playwright 现在使用自己的 `webServer` 拉起测试环境，不依赖手动启动的 dev server。

## 数据源可靠性判断

Polymarket Gamma 可以作为交易市场数据源，但不能把它当作权威赛程源。可靠使用方式：

- 市场价格、市场 URL、市场活跃状态：以 Gamma 为准。
- 单场比赛时间：优先使用 Gamma `endDate`，必要时再与 ESPN/FotMob/TheSportsDB 等赛程源交叉验证。
- 对阵双方：优先使用主单场 event title，排除 `More Markets`，并用 market questions 做一致性校验。
- futures/赛季市场与单场市场必须分层展示，不能混用。

## 后续建议

1. 增加第二赛程源，对足球 `homeTeam/awayTeam/matchDate` 做交叉验证。
2. 给 `/api/football` 返回 `dataQuality` 字段，例如 `source=polymarket-gamma`、`matchedBy=endDate+title`、`confidence`。
3. 把 `More Markets` 单独归入盘口详情页，而不是主比赛列表。
