# Base Gas Price Monitor

A lightweight Node.js bot that monitors Base L2 gas prices in real time and logs them to a CSV file every 30 seconds.

## Features

- Polls Base mainnet every 30 seconds via public RPC
- Logs base fee, priority fee, and effective gas price
- Fetches live ETH/USD price from CoinGecko
- Calculates USD cost for common operations (ETH transfer, ERC20 transfer, Uniswap swap)
- Optional alert threshold — warns when gas exceeds a set gwei level
- Configurable via environment variables
- Zero external dependencies beyond `ethers`

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/base-gas-monitor
cd base-gas-monitor

# 2. Install dependencies
npm install

# 3. Run
npm start
```

## Output

A `gas_prices.csv` file is created and appended every 30 seconds:

```
timestamp,block,base_fee_gwei,priority_fee_gwei,gas_price_gwei,eth_price_usd,usd_per_transfer,usd_per_erc20,usd_per_swap
2026-03-13T10:00:00.000Z,18100000,0.001050,0.001000,0.001050,3521.00,0.000023,0.000071,0.000165
2026-03-13T10:00:30.000Z,18100002,0.001100,0.001000,0.001100,3521.00,0.000024,0.000074,0.000173
```

### Column Reference

| Column | Description |
|---|---|
| `timestamp` | ISO 8601 date/time of reading |
| `block` | Base block number |
| `base_fee_gwei` | EIP-1559 base fee in gwei |
| `priority_fee_gwei` | Miner tip in gwei |
| `gas_price_gwei` | Effective gas price in gwei |
| `eth_price_usd` | Live ETH price in USD |
| `usd_per_transfer` | Cost of ETH transfer (21,000 gas) |
| `usd_per_erc20` | Cost of ERC20 transfer (65,000 gas) |
| `usd_per_swap` | Cost of Uniswap swap (150,000 gas) |

## Configuration

All settings can be overridden with environment variables:

| Variable | Default | Description |
|---|---|---|
| `RPC_URL` | `https://mainnet.base.org` | Base RPC endpoint |
| `OUTPUT_FILE` | `gas_prices.csv` | CSV output path |
| `INTERVAL_MS` | `30000` | Poll interval in milliseconds |
| `ALERT_GWEI` | `0` | Alert threshold in gwei (0 = disabled) |

### Example with custom settings

```bash
RPC_URL=https://your-rpc.com INTERVAL_MS=10000 ALERT_GWEI=0.05 node gas-monitor.js
```

## Run in Background

**Linux/Mac:**
```bash
nohup npm start > monitor.log 2>&1 &
```

**Windows:**
```cmd
start /B node gas-monitor.js
```

**PM2 (recommended for production):**
```bash
npm install -g pm2
pm2 start gas-monitor.js --name base-gas-monitor
pm2 logs base-gas-monitor
```

## Sample Console Output

```
═══════════════════════════════════════════
  Base Gas Price Monitor
  RPC:      https://mainnet.base.org
  Output:   gas_prices.csv
  Interval: 30s
═══════════════════════════════════════════
[2026-03-13T10:00:00.000Z] Block: 18100000 | Gas: 0.0011 gwei | ETH: $3521 | Transfer: $0.000023 | ERC20: $0.000071 | Swap: $0.000165
```

## License

MIT
