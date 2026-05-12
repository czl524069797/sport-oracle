# Micro Bet Feasibility

## Conclusion

SportOracle cannot safely promise that `$0.10` or `$1.00` orders always pass on Polymarket.

Polymarket CLOB exposes `min_order_size` per market/order book. The current public sports samples returned `min_order_size = "5"`. In CLOB order terms, `size` is the number of shares, while SportOracle currently converts USDC amount to shares with:

```ts
size = amount / price
```

So the minimum USDC amount is dynamic:

```text
minimumUsdc = min_order_size * price
```

Application-side change:

- The default direct bet amount is lowered to `$1`.
- Strategy defaults are lowered to `maxBetAmount=$1` and `dailyBudget=$10`.
- Strategy inputs now accept `0.1` USDC steps, so the app no longer imposes an artificial `$5` or `$10` threshold.
- Execution still needs to respect Polymarket's per-market `min_order_size`; if `amount / price < min_order_size`, the order should be guided to a larger amount or to manual Polymarket execution.

Examples when `min_order_size = 5`:

| Market price | $0.10 order size | $1 order size | Minimum USDC |
|:--|--:|--:|--:|
| 0.01 | 10 shares, may pass | 100 shares, may pass | $0.05 |
| 0.02 | 5 shares, may pass | 50 shares, may pass | $0.10 |
| 0.20 | 0.5 shares, fails | 5 shares, may pass | $1.00 |
| 0.50 | 0.2 shares, fails | 2 shares, fails | $2.50 |
| 0.99 | 0.101 shares, fails | 1.01 shares, fails | $4.95 |

## Public API Check

No real order was submitted. I queried public Gamma/CLOB data and checked current order book parameters.

Sample result:

```json
{
  "event": "Pistons vs. Cavaliers",
  "market": "Pistons vs. Cavaliers",
  "min_order_size": "5",
  "tick_size": "0.01",
  "bestAsk": { "price": "0.99", "size": "237744.22" },
  "bestBid": { "price": "0.01", "size": "97772" }
}
```

This means:

- Buying at `0.99`: `$1` fails because it buys about `1.01` shares, below `5`.
- Buying at `0.20`: `$1` can pass because it buys exactly `5` shares.
- Buying at `0.02`: `$0.10` can pass because it buys exactly `5` shares.

## Current Project State

Code paths:

- `src/components/analysis/AnalysisPanel.tsx` currently places direct bets with hardcoded `amount: 10`.
- `src/components/strategy/StrategyForm.tsx` sets `min={1}` for max bet and daily budget fields.
- `src/app/api/betting/route.ts` accepts any positive `amount` up to `1000`.
- `src/lib/bet-executor.ts` converts amount to shares using `size = amount / price`.

So the app can technically submit small amounts through the API, but the CLOB may reject them with a minimum-size error.

## Recommended Product Rule

Do not use a fixed global minimum like `$5`, `$1`, or `$0.10`.

Instead:

1. Fetch `/book?token_id=...` before order submission.
2. Read `min_order_size` and `tick_size`.
3. Compute:

```ts
const minimumUsdc = Number(book.min_order_size) * orderPrice;
```

4. Allow the user to choose `$0.10` or `$1.00` only when:

```ts
amount / price >= Number(book.min_order_size)
```

5. Otherwise show:

```text
This market requires at least 5 shares. At the current price, minimum order is about $X.XX.
```

## Implementation Tasks

- [ ] Add a `getOrderBook(tokenId)` preflight call before direct betting.
- [ ] Add `minOrderSize`, `tickSize`, and `minimumUsdc` to the analysis/betting UI.
- [ ] Replace hardcoded `amount: 10` with a user input or quick-select buttons: `$0.10`, `$1`, `$5`, `$10`.
- [ ] Disable quick-select amounts that do not meet the current market's `min_order_size`.
- [ ] Keep `$5` as a fallback default for high-probability markets near `0.99`.
