# TODO（非托管下单改造计划）

目标：淘汰服务端私钥下单，改为“用户钱包签名下单”或“引导到 Polymarket 页面下单”，默认非托管模式，确保安全与合规。

## Phase 0（已完成）
- 后端鉴权：完成 SIWE（EIP‑4361）+ JWT，受保护接口可按需启用。
- 白名单门禁：可选启用链上 `verified(address)` 校验（FastAPI 中间件）。
- 保护措施：后端新增 `ENABLE_SERVER_TRADING`，默认 false；当为 false 时，`/api/trading/place|cancel|allowance/update` 返回 403（禁止服务端交易）。

## Phase 1（安全保底：引导到 Polymarket 下单）
- UI 增加“去 Polymarket 下单”按钮：
  - 在分析卡（PredictionCard/AnalysisPanel）提供 CTA，基于 `slug` 或 `tokenId` 生成 Polymarket 事件链接。
  - 优先匹配单场比赛 moneyline 市场；若未匹配，退化到赛季/分区赔率或提示“该市场暂不支持跳转”。
- 复制/分享功能：
  - 一键复制 tokenId、建议价格、方向（BUY/SELL），便于用户在 Polymarket 页面快速下单。
- 配置开关：
  - `NEXT_PUBLIC_ENABLE_SERVER_TRADING=false` 时隐藏本地“直接下单”按钮，仅显示“去 Polymarket 下单”。
- 文案与引导：
  - 增加风险提示：资金与私钥安全由用户钱包控制；本应用不托管资产。

## Phase 2（非托管直连 CLOB：前端钱包签名 + API 直呼）
- 选择方案 A（优先）：接入 Polymarket 官方 JS SDK（若可用）
  - 功能：derive/create API key、EIP‑712 下单签名、post_order/cancel 等。
  - 安全：所有签名在浏览器内完成；后端仅做只读代理（可选）。
- 选择方案 B（备选）：最小实现 EIP‑712 流程
  - 复刻 `derive_api_key` 与 `create_order` 所需的 typed data（参考 py‑clob‑client / 文档）。
  - 使用 wagmi/viem 完成签名；前端直呼 CLOB REST 接口。
- 会话/密钥管理：
  - 临时 API key 只存在前端内存或 LocalStorage（加密存储可选）。
  - 提供“登出/清除密钥”操作；切换账户自动清理。
- 失败路径与重试：
  - 余额/授权不足 → 引导到 Polymarket 页面完成授权；或提供“授权”按钮（仅在用户确认后触发链上交易）。
- 速率限制与防刷：
  - 前端调用 CLOB 时增加节流；后端（如开代理）增加速率限制与来源校验。

## Phase 3（可观测性/产品打磨）
- 交易状态回传与 UI 更新：
  - 轮询订单状态或订阅事件；显示“已提交/部分成交/完全成交/撤单”。
- 错误码映射与提示：
  - 将常见错误（余额不足、价格过期、最小下单限制）转为用户可理解的提示。
- A/B 配置：
  - 支持后端开关“仅跳转”vs“签名直连”；按用户分组或环境切换。

## Phase 4（上线与合规）
- 生产配置：
  - 彻底移除服务端私钥；如必须保留，需隔离到工具服务并默认关闭。
  - 严格 CORS、CSRF、JWT 过期与刷新策略。
- 风控/限流：
  - IP 与账号维度的限流；异常行为告警。
- 监控与日志：
  - 前端 Sentry/后端日志聚合；匿名化用户数据。

## 技术任务拆解（可指派）
- 前端
  - [ ] 新增“去 Polymarket 下单”按钮与链接生成器
  - [ ] 增加复制 tokenId/价格/方向的工具按钮
  - [ ] 加入 `NEXT_PUBLIC_ENABLE_SERVER_TRADING` 开关控制 UI
  - [ ]（可选）集成 Polymarket JS SDK 或 EIP‑712 自实现，完成 derive/create key 与下单签名
  - [ ] 交易状态轮询与错误提示映射
- 后端
  - [x] 默认关闭服务端交易（`ENABLE_SERVER_TRADING=false`）
  - [ ] 保留只读代理（/api/auth/*、行情数据），移除对私钥的强依赖
  - [ ]（可选）提供签名直通代理（仅转发，不代签）与速率限制
- 文档/产品
  - [x] SIWE + 白名单说明（README_SIWE_SKILL.md）
  - [ ] 非托管交易说明与用户安全提示
  - [ ] 政策与合规检查清单（风控、日志、隐私）

## 风险与注意事项
- 价格波动与最小下单限制：NBA 大多为 $5 起；需在 UI 中提示。
- 授权（Allowance）是链上交易，需要 MATIC Gas；应明确风险并提供跳转而非强制自动执行。
- 本项目默认非托管：禁用后端私钥交易，避免合规与安全隐患。
