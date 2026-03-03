# Sport Oracle - 预测算法文档

## 系统概述

Sport Oracle 是一个 AI 驱动的体育赛事预测平台：
1. 聚合实时比赛数据（NBA、足球、电竞）
2. 将结构化数据输入 LLM 进行概率分析
3. 对比 AI 概率和 Polymarket 赔率，检测**市场边缘（Edge）**
4. 使用 **Kelly Criterion（凯利公式）** 计算最优下注金额
5. 可选自动在 Polymarket 上执行交易

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   数据层     │───▶│    AI 层     │───▶│   边缘层     │───▶│   下注层     │
│              │    │              │    │              │    │              │
│ NBA API      │    │ Grok-4 LLM   │    │ 去除水位     │    │ Kelly 计算   │
│ Polymarket   │    │ 结构化提示词  │    │ 边缘计算     │    │ 风控限制     │
│ 球队数据     │    │ JSON 输出    │    │ 方向选择     │    │ 自动执行     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 1. 数据管道

### NBA 数据源

| 来源 | 数据内容 | 刷新周期 |
|------|---------|---------|
| NBA API（Python 服务） | 赛程、球队数据、球员数据、交锋记录 | 实时 |
| Polymarket Gamma API | 赛季夺冠赔率 | 10 分钟缓存 |
| Polymarket Gamma API | 单场胜负盘、让分盘、大小分 | 5 分钟缓存 |

### 输入 AI 的数据（每场比赛）

```typescript
interface AIAnalysisInput {
  game: NBAGame;                    // 球队信息、日期、状态
  homeStats: TeamStats;             // 近10场、主场战绩、ORTG/DRTG/NET/PACE/PPG
  awayStats: TeamStats;             // 客队同上
  homePlayers: PlayerStats[];       // 前5球员：场均得分/助攻/篮板 + 伤病状态
  awayPlayers: PlayerStats[];
  headToHead: HeadToHead;           // 本赛季交锋记录 + 各场比分
  marketPrice: { home, away };      // Polymarket 当前赔率（优先使用单场盘口）
}
```

### 足球/电竞数据

足球和电竞比赛仅接收市场赔率数据，AI 主要依赖自身训练知识进行分析。

---

## 2. AI 分析引擎

### 模型配置

| 参数 | 值 | 原因 |
|------|-----|------|
| 模型 | `grok-4` | 通过 OpenAI 兼容代理调用 |
| 温度 | `0.3` | 低温度 = 输出更稳定/一致 |
| 最大 tokens | `4000`（NBA）、`2000`（足球/电竞） | NBA 分析更复杂 |
| 工具调用 | 禁用（`tool_choice: "none"`） | 防止模型尝试搜索网页 |

### 提示词结构

**系统提示词**定义 AI 为专业分析师，要求：
- 基于近 10 场战绩、主客场数据、攻防效率、伤病、交锋记录进行分析
- 输出胜负盘、让分盘、大小分的概率
- 提供置信度（0-1）并解释原因
- 仅返回结构化 JSON

**用户提示词**注入具体比赛数据（数据、球员、交锋、赔率）。

**语言指令**：中文环境下，所有文本值使用简体中文，JSON key 保持英文。

### AI 输出格式（NBA）

```json
{
  "home_win_probability": 0.62,
  "away_win_probability": 0.38,
  "confidence": 0.75,
  "confidence_explanation": "置信度说明...",
  "predicted_spread": -5.5,
  "spread_analysis": {
    "favored_team": "home",
    "spread_value": 5.5,
    "spread_confidence": 0.70,
    "cover_recommendation": "home"
  },
  "total_points_analysis": {
    "predicted_total": 215.5,
    "over_under_line": 213.5,
    "over_probability": 0.55,
    "under_probability": 0.45,
    "ou_confidence": 0.60,
    "recommendation": "over"
  },
  "key_factors": ["关键因素1", "关键因素2"],
  "news_highlights": ["新闻1", "新闻2"],
  "reasoning": "详细分析..."
}
```

### 后处理流水线

```
AI 原始输出
  → validateAndClamp()        // 将所有概率值钳制到 [0, 1]
  → normalizeProbabilities()  // 强制 home + away = 1.0
  → calculateNBAEdge()        // 与市场赔率对比计算边缘
```

---

## 3. 边缘（Edge）计算

### 定义

**边缘** = AI 估计概率 − 去水位后的市场隐含概率

正边缘意味着 AI 认为市场低估了该队的胜率。

### 去除水位（Vig）

Polymarket 赔率包含约 4% 的超额利润（水位）。原始隐含概率之和约为 1.04：

```
原始：   主队 0.54 + 客队 0.50 = 1.04（4% 水位）
调整后：主队 0.54/1.04 = 0.519，客队 0.50/1.04 = 0.481
```

```typescript
function removeVig(homeImplied: number, awayImplied: number) {
  const total = homeImplied + awayImplied;
  return { home: homeImplied / total, away: awayImplied / total };
}
```

### 边缘计算流程

```typescript
// 1. 获取去水位后的市场概率
const adjusted = removeVig(marketHome, marketAway);

// 2. 计算每一方的边缘
const homeEdge = aiHomeProb - adjusted.home;   // 例: 0.62 - 0.519 = +0.101
const awayEdge = aiAwayProb - adjusted.away;   // 例: 0.38 - 0.481 = -0.101

// 3. 边缘 >= 5% 才推荐
if (homeEdge >= 0.05) → 推荐主队
if (awayEdge >= 0.05) → 推荐客队
否则 → 不推荐
```

### 赔率来源优先级

1. **单场胜负盘**（`getNBAGameMarkets()`）—— 首选
2. **赛季夺冠赔率**（`getNBASeasonMarkets()`）—— 备选，精度较低

当只有赛季夺冠赔率时，edge 设为 0（不推荐），因为拿单场胜率和赛季夺冠概率比较是无效的。

### 足球/电竞边缘

更简单：AI 概率直接减去市场赔率。这些市场的赔率已经归一化，无需额外去水位。

---

## 4. Kelly Criterion（凯利公式）下注计算

### 公式

凯利公式确定最优的资金投注比例：

```
f* = (bp - q) / b

其中：
  b = 赔率收益率 = (1/市场价格) - 1
  p = AI 估计的胜率
  q = 1 - p（败率）
  f* = 应投注的资金比例
```

### 安全调整

| 调整项 | 系数 | 原因 |
|--------|------|------|
| 四分之一 Kelly | ×0.25 | 行业标准，降低方差 |
| 置信度加权 | ×confidence | 置信度越低，下注越少 |
| 单注上限 | 日预算的 10% | 防止单注过度集中 |
| 最大下注额 | 策略配置 | 用户自定义上限 |
| 日预算 | 策略配置 | 当日止损线 |

### 计算示例

```
场景：
  AI 认为主队胜率 p = 0.65
  Polymarket 价格 = 0.55（隐含 55%）
  置信度 = 0.75
  日预算 = $50

第一步：计算赔率
  decimalOdds = 1 / 0.55 = 1.818
  b = 1.818 - 1 = 0.818

第二步：计算 True Kelly
  f* = (0.818 × 0.65 - 0.35) / 0.818
     = (0.532 - 0.35) / 0.818
     = 0.222（22.2%）

第三步：四分之一 Kelly × 置信度
  adjusted = 0.222 × 0.25 × 0.75 = 0.042（4.2%）

第四步：下注金额
  amount = $50 × 0.042 = $2.08
```

### 下注决策树

```
shouldBet(analysis, strategy):
  ├─ strategy.isActive?           → 否 → 跳过
  ├─ recommendedSide != "none"?   → 否 → 跳过
  ├─ confidence >= minConfidence?  → 否 → 跳过
  ├─ edgePercent >= 3%?           → 否 → 跳过
  └─ 是 → 计算 Kelly 下注金额
       ├─ Kelly <= 0?              → 跳过
       ├─ 超出日预算?              → 跳过
       └─ 下注
```

---

## 5. JSON 响应解析

AI 响应解析器处理多种边界情况：

### 括号平衡解析器

不使用简单的"找第一个{和最后一个}"，而是用状态机：

```
1. 找到响应中第一个 '{'
2. 跟踪嵌套深度、字符串上下文、转义字符
3. 当深度回到 0 时，提取候选 JSON
4. 验证候选 JSON 是否包含预期字段（home_win_probability）
5. 如果不是分析结果（如工具调用 JSON），跳过继续找
6. 都找不到时回退到"首尾大括号"兜底逻辑
```

可处理的异常情况：
- AI 在分析前输出工具调用 JSON：`{"query":"..."} {"home_win_probability":...}`
- Markdown 代码围栏：` ```json { ... } ``` `
- JSON 后面附加多余文本

---

## 6. 架构决策

### 为什么用 LLM 而不是统计模型？

| 维度 | 统计模型 | LLM 方案 |
|------|---------|---------|
| 启动成本 | 高（特征工程、训练数据） | 低（提示词工程） |
| 数据需求 | 需要大量历史数据 | 当前赛季数据即可 |
| 伤病/新闻影响 | 难以量化 | 自然语言理解 |
| 适应性 | 需要重新训练 | 修改提示词即可 |
| 可解释性 | 模型系数 | 自然语言推理 |
| 准确率上限 | 数据好时更高 | 受模型知识限制 |

**权衡**：牺牲统计严谨性换取开发速度和适应性。后续可以加入统计模型层将结果输入提示词。

### 为什么选 Polymarket？

- 唯一提供 REST API + 链上结算的主流预测市场
- CLOB（中央限价订单簿）提供真实买卖报价
- 有 NBA 单场比赛市场（多数交易所没有）
- 链上结算 = 无需信任、无对手方风险

---

## 7. 已知限制与改进计划

### 当前限制

| 限制 | 影响 | 严重程度 |
|------|------|---------|
| 无结果追踪 | 无法衡量预测准确率 | 高 |
| 无置信度校准 | AI 置信度可能存在系统性偏差 | 高 |
| 单模型（无集成） | 受单一模型偏差影响 | 中 |
| 无背靠背疲劳数据 | 缺失约 2-4 分的影响因子 | 中 |
| 无赛程强度调整 | 对弱队的连胜会被高估 | 中 |
| 赛季赔率兜底 | 无单场赔率时边缘无效 | 低 |

### 改进路线图

**P1 — 结果追踪**
- 存储实际最终比分，与预测对比
- 计算 Brier score、校准曲线、ROI
- 自动检测模型漂移（置信度 vs 实际准确率偏离）

**P2 — 集成预测**
- 用 2-3 个模型 / 不同温度同时预测
- 模型间分歧度作为置信度信号
- 加权平均概率

**P3 — 增强数据**
- 背靠背比赛指标
- 海拔因素（丹佛主场 +3.5 分）
- 行程距离 / 时区穿越
- 真实投篮命中率（TS%）和球员效率值（PER）
- 对手强度调整后的统计数据（SOS）

**P4 — 置信度校准**
- 积累 100+ 预测后建立校准映射
- 如果"70% 置信度"的预测实际只有 60% 准确率，修正为 0.60
- 在边缘计算前应用校准修正

---

## 8. 文件索引

| 文件 | 职责 |
|------|------|
| `src/lib/openai.ts` | NBA AI 提示词构建 + LLM API 调用 + JSON 解析 |
| `src/lib/match-openai.ts` | 足球/电竞 AI 提示词 + API 调用 |
| `src/lib/ai-analyzer.ts` | NBA 编排器：数据拉取 → AI 调用 → 边缘计算 → 入库 |
| `src/lib/match-ai-analyzer.ts` | 足球/电竞编排器 |
| `src/lib/bet-executor.ts` | Kelly 公式 + 下注执行 + 日预算管理 |
| `src/lib/polymarket.ts` | Polymarket API：赛季赔率、单场赔率、订单簿 |
| `src/lib/nba-data.ts` | NBA 数据 API 客户端 |
| `src/lib/strategy-engine.ts` | 自动执行策略引擎 |
| `src/app/api/analysis/route.ts` | NBA 分析 API 端点 |
| `src/app/api/match-analysis/route.ts` | 足球/电竞分析 API 端点 |
| `src/types/index.ts` | TypeScript 类型定义 |
