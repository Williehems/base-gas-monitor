// ============================================================
// Base Gas Price Monitor
// Monitors Base L2 gas prices and logs to CSV every 30 seconds
// GitHub: https://github.com/YOUR_USERNAME/base-gas-monitor
// ============================================================

const { ethers } = require('ethers');
const fs         = require('fs');
const https      = require('https');

// ── CONFIG ───────────────────────────────────────────────────
const RPC_URL     = process.env.RPC_URL || 'https://mainnet.base.org';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'gas_prices.csv';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '30000');  // 30s default
const ALERT_GWEI  = parseFloat(process.env.ALERT_GWEI || '0');     // 0 = no alerts

// Gas units for common operations
const GAS_ETH_TRANSFER  = 21_000;
const GAS_ERC20_TRANSFER = 65_000;
const GAS_UNISWAP_SWAP  = 150_000;

// ── SETUP ────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);

let ethPriceUsd = 0;
let lastPriceFetch = 0;

// Write CSV header if file does not exist
if (!fs.existsSync(OUTPUT_FILE)) {
  fs.writeFileSync(
    OUTPUT_FILE,
    'timestamp,block,base_fee_gwei,priority_fee_gwei,gas_price_gwei,' +
    'eth_price_usd,usd_per_transfer,usd_per_erc20,usd_per_swap\n'
  );
  console.log(`📄 Created ${OUTPUT_FILE}`);
}

// ── ETH PRICE ────────────────────────────────────────────────
function fetchEthPrice() {
  return new Promise((resolve) => {
    const now = Date.now();
    // Cache price for 60 seconds
    if (ethPriceUsd > 0 && now - lastPriceFetch < 60_000) {
      return resolve(ethPriceUsd);
    }
    https.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const price = JSON.parse(data).ethereum.usd;
            ethPriceUsd = price;
            lastPriceFetch = now;
            resolve(price);
          } catch {
            resolve(ethPriceUsd || 3500); // fallback
          }
        });
      }
    ).on('error', () => resolve(ethPriceUsd || 3500));
  });
}

// ── MAIN LOOP ─────────────────────────────────────────────────
async function checkGas() {
  try {
    const [feeData, blockNumber, ethPrice] = await Promise.all([
      provider.getFeeData(),
      provider.getBlockNumber(),
      fetchEthPrice(),
    ]);

    const baseFeeGwei     = feeData.lastBaseFeePerGas
      ? parseFloat(ethers.formatUnits(feeData.lastBaseFeePerGas, 'gwei'))
      : 0;
    const priorityFeeGwei = feeData.maxPriorityFeePerGas
      ? parseFloat(ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei'))
      : 0;
    const gasPriceGwei    = parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei'));

    const usdCost = (gasUnits) =>
      ((gasPriceGwei * gasUnits * 1e-9) * ethPrice).toFixed(6);

    const usdTransfer = usdCost(GAS_ETH_TRANSFER);
    const usdErc20    = usdCost(GAS_ERC20_TRANSFER);
    const usdSwap     = usdCost(GAS_UNISWAP_SWAP);
    const timestamp   = new Date().toISOString();

    // Write to CSV
    const row = [
      timestamp,
      blockNumber,
      baseFeeGwei.toFixed(6),
      priorityFeeGwei.toFixed(6),
      gasPriceGwei.toFixed(6),
      ethPrice.toFixed(2),
      usdTransfer,
      usdErc20,
      usdSwap,
    ].join(',');

    fs.appendFileSync(OUTPUT_FILE, row + '\n');

    // Console output
    console.log(
      `[${timestamp}] ` +
      `Block: ${blockNumber} | ` +
      `Gas: ${gasPriceGwei.toFixed(4)} gwei | ` +
      `ETH: $${ethPrice.toFixed(0)} | ` +
      `Transfer: $${usdTransfer} | ` +
      `ERC20: $${usdErc20} | ` +
      `Swap: $${usdSwap}`
    );

    // Optional alert
    if (ALERT_GWEI > 0 && gasPriceGwei >= ALERT_GWEI) {
      console.warn(`⚠️  ALERT: Gas price ${gasPriceGwei.toFixed(4)} gwei exceeds threshold ${ALERT_GWEI} gwei!`);
    }

  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error: ${e.message}`);
  }
}

// ── START ─────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════');
console.log('  Base Gas Price Monitor');
console.log(`  RPC:      ${RPC_URL}`);
console.log(`  Output:   ${OUTPUT_FILE}`);
console.log(`  Interval: ${INTERVAL_MS / 1000}s`);
if (ALERT_GWEI > 0) console.log(`  Alert at: ${ALERT_GWEI} gwei`);
console.log('═══════════════════════════════════════════');

checkGas();
setInterval(checkGas, INTERVAL_MS);
