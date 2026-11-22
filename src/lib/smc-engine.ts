// SMC (Smart Money Concepts) Detection Engine — TypeScript implementation
// Detects Order Blocks, FVGs, Structure Breaks, Liquidity Levels

import { Candle, OrderBlock, FairValueGap, StructurePoint, StructureBreak, LiquidityLevel, SMCAnalysis } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Detect swing highs and lows
export function detectSwingPoints(candles: Candle[], lookback: number = 5): StructurePoint[] {
  const points: StructurePoint[] = [];
  if (candles.length < lookback * 2 + 1) return points;

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isLow = false;
      }
    }

    if (isHigh) {
      const prevHighs = points.filter(p => p.type === 'HH' || p.type === 'LH');
      const lastHigh = prevHighs.length > 0 ? prevHighs[prevHighs.length - 1] : null;
      const type = !lastHigh || candles[i].high > lastHigh.price ? 'HH' : 'LH';
      points.push({ time: candles[i].time, price: candles[i].high, type });
    }

    if (isLow) {
      const prevLows = points.filter(p => p.type === 'HL' || p.type === 'LL');
      const lastLow = prevLows.length > 0 ? prevLows[prevLows.length - 1] : null;
      const type = !lastLow || candles[i].low > lastLow.price ? 'HL' : 'LL';
      points.push({ time: candles[i].time, price: candles[i].low, type });
    }
  }

  return points;
}

// Detect BOS (Break of Structure) and CHoCH (Change of Character)
export function detectStructureBreaks(candles: Candle[], swingPoints: StructurePoint[]): StructureBreak[] {
  const breaks: StructureBreak[] = [];
  
  const highs = swingPoints.filter(p => p.type === 'HH' || p.type === 'LH');
  const lows = swingPoints.filter(p => p.type === 'HL' || p.type === 'LL');

  // Detect bullish BOS: price breaks above a previous swing high
  for (let i = 1; i < highs.length; i++) {
    const breakCandle = candles.find(c => c.time > highs[i - 1].time && c.close > highs[i - 1].price);
    if (breakCandle) {
      const prevTrend = i >= 2 && highs[i - 1].price < highs[i - 2].price;
      breaks.push({
        time: breakCandle.time,
        price: highs[i - 1].price,
        type: prevTrend ? 'CHoCH' : 'BOS',
        direction: 'bullish',
      });
    }
  }

  // Detect bearish BOS: price breaks below a previous swing low
  for (let i = 1; i < lows.length; i++) {
    const breakCandle = candles.find(c => c.time > lows[i - 1].time && c.close < lows[i - 1].price);
    if (breakCandle) {
      const prevTrend = i >= 2 && lows[i - 1].price > lows[i - 2].price;
      breaks.push({
        time: breakCandle.time,
        price: lows[i - 1].price,
        type: prevTrend ? 'CHoCH' : 'BOS',
        direction: 'bearish',
      });
    }
  }

  return breaks.sort((a, b) => a.time - b.time);
}

// Calculate ATR (Average True Range)
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = [];
  if (candles.length < 2) return atr;

  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  // Simple moving average for first ATR value
  let sum = 0;
  for (let i = 0; i < Math.min(period, tr.length); i++) {
    sum += tr[i];
  }
  atr.push(sum / Math.min(period, tr.length));

  // Wilder's smoothing for subsequent values
  for (let i = period; i < tr.length; i++) {
    atr.push((atr[atr.length - 1] * (period - 1) + tr[i]) / period);
  }

  return atr;
}

// Calculate RSI
export function calculateRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Detect Order Blocks
export function detectOrderBlocks(candles: Candle[], atr: number[]): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];
  if (candles.length < 5) return orderBlocks;

  const avgVolume = candles.reduce((s, c) => s + c.volume, 0) / candles.length;

  for (let i = 2; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];
    const currentATR = atr[Math.min(i - 1, atr.length - 1)] || (curr.high - curr.low);

    // Bullish OB: bearish candle(s) followed by strong bullish move breaking structure
    if (prev.close < prev.open && curr.close > curr.open) {
      const moveSize = Math.abs(curr.close - prev.open);
      if (moveSize > currentATR * 1.2 && curr.volume > avgVolume * 0.8) {
        const ob: OrderBlock = {
          id: generateId(),
          type: 'bullish',
          startTime: prev.time,
          endTime: curr.time,
          top: prev.open,
          bottom: prev.low,
          midpoint: (prev.open + prev.low) / 2,
          strength: Math.min(100, Math.round((moveSize / currentATR) * 30 + (curr.volume / avgVolume) * 20)),
          status: 'active',
          timeframe: '',
          volumeRatio: curr.volume / avgVolume,
        };

        // Check if OB has been mitigated by subsequent price action
        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].low <= ob.midpoint) {
            ob.status = 'mitigated';
            break;
          }
          if (candles[j].low <= ob.top && candles[j].low > ob.midpoint) {
            ob.status = 'tested';
          }
        }

        orderBlocks.push(ob);
      }
    }

    // Bearish OB: bullish candle(s) followed by strong bearish move breaking structure
    if (prev.close > prev.open && curr.close < curr.open) {
      const moveSize = Math.abs(prev.open - curr.close);
      if (moveSize > currentATR * 1.2 && curr.volume > avgVolume * 0.8) {
        const ob: OrderBlock = {
          id: generateId(),
          type: 'bearish',
          startTime: prev.time,
          endTime: curr.time,
          top: prev.high,
          bottom: prev.close,
          midpoint: (prev.high + prev.close) / 2,
          strength: Math.min(100, Math.round((moveSize / currentATR) * 30 + (curr.volume / avgVolume) * 20)),
          status: 'active',
          timeframe: '',
          volumeRatio: curr.volume / avgVolume,
        };

        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].high >= ob.midpoint) {
            ob.status = 'mitigated';
            break;
          }
          if (candles[j].high >= ob.bottom && candles[j].high < ob.midpoint) {
            ob.status = 'tested';
          }
        }

        orderBlocks.push(ob);
      }
    }
  }

  return orderBlocks;
}

// Detect Fair Value Gaps (FVGs)
export function detectFVGs(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  if (candles.length < 3) return fvgs;

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: gap between candle 1 high and candle 3 low
    if (c3.low > c1.high && c2.close > c2.open) {
      const fvg: FairValueGap = {
        id: generateId(),
        type: 'bullish',
        time: c2.time,
        top: c3.low,
        bottom: c1.high,
        fillPercent: 0,
        status: 'open',
      };

      // Check fill
      const gapSize = fvg.top - fvg.bottom;
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].low <= fvg.bottom) {
          fvg.fillPercent = 100;
          fvg.status = 'filled';
          break;
        } else if (candles[j].low < fvg.top) {
          const fill = ((fvg.top - candles[j].low) / gapSize) * 100;
          fvg.fillPercent = Math.max(fvg.fillPercent, fill);
          if (fvg.fillPercent > 0) fvg.status = 'partially_filled';
        }
      }

      fvgs.push(fvg);
    }

    // Bearish FVG: gap between candle 3 high and candle 1 low
    if (c3.high < c1.low && c2.close < c2.open) {
      const fvg: FairValueGap = {
        id: generateId(),
        type: 'bearish',
        time: c2.time,
        top: c1.low,
        bottom: c3.high,
        fillPercent: 0,
        status: 'open',
      };

      const gapSize = fvg.top - fvg.bottom;
      for (let j = i + 1; j < candles.length; j++) {
        if (candles[j].high >= fvg.top) {
          fvg.fillPercent = 100;
          fvg.status = 'filled';
          break;
        } else if (candles[j].high > fvg.bottom) {
          const fill = ((candles[j].high - fvg.bottom) / gapSize) * 100;
          fvg.fillPercent = Math.max(fvg.fillPercent, fill);
          if (fvg.fillPercent > 0) fvg.status = 'partially_filled';
        }
      }

      fvgs.push(fvg);
    }
  }

  return fvgs;
}

// Detect Liquidity Levels (Equal Highs/Lows, Buy/Sell Side Liquidity)
export function detectLiquidityLevels(candles: Candle[], swingPoints: StructurePoint[], tolerance: number = 0.001): LiquidityLevel[] {
  const levels: LiquidityLevel[] = [];
  const highs = swingPoints.filter(p => p.type === 'HH' || p.type === 'LH');
  const lows = swingPoints.filter(p => p.type === 'HL' || p.type === 'LL');

  // Equal Highs (EQH) - potential buy-side liquidity
  for (let i = 0; i < highs.length; i++) {
    let touches = 1;
    for (let j = i + 1; j < highs.length; j++) {
      if (Math.abs(highs[j].price - highs[i].price) / highs[i].price < tolerance) {
        touches++;
      }
    }
    if (touches >= 2) {
      const swept = candles.some(c => c.time > highs[i].time && c.high > highs[i].price * (1 + tolerance));
      levels.push({
        price: highs[i].price,
        type: 'EQH',
        touches,
        swept,
        sweepTime: swept ? candles.find(c => c.time > highs[i].time && c.high > highs[i].price * (1 + tolerance))?.time : undefined,
      });
    }
  }

  // Equal Lows (EQL) - potential sell-side liquidity
  for (let i = 0; i < lows.length; i++) {
    let touches = 1;
    for (let j = i + 1; j < lows.length; j++) {
      if (Math.abs(lows[j].price - lows[i].price) / lows[i].price < tolerance) {
        touches++;
      }
    }
    if (touches >= 2) {
      const swept = candles.some(c => c.time > lows[i].time && c.low < lows[i].price * (1 - tolerance));
      levels.push({
        price: lows[i].price,
        type: 'EQL',
        touches,
        swept,
        sweepTime: swept ? candles.find(c => c.time > lows[i].time && c.low < lows[i].price * (1 - tolerance))?.time : undefined,
      });
    }
  }

  // Buy-Side Liquidity (BSL) - stops above swing highs
  if (highs.length > 0) {
    const highestHigh = highs.reduce((max, h) => h.price > max.price ? h : max, highs[0]);
    levels.push({
      price: highestHigh.price,
      type: 'BSL',
      touches: 1,
      swept: candles.some(c => c.high > highestHigh.price),
    });
  }

  // Sell-Side Liquidity (SSL) - stops below swing lows
  if (lows.length > 0) {
    const lowestLow = lows.reduce((min, l) => l.price < min.price ? l : min, lows[0]);
    levels.push({
      price: lowestLow.price,
      type: 'SSL',
      touches: 1,
      swept: candles.some(c => c.low < lowestLow.price),
    });
  }

  return levels;
}

// Full SMC Analysis
export function runSMCAnalysis(candles: Candle[], symbol: string, timeframe: string): SMCAnalysis {
  const atr = calculateATR(candles);
  const swingPoints = detectSwingPoints(candles);
  const structureBreaks = detectStructureBreaks(candles, swingPoints);
  const orderBlocks = detectOrderBlocks(candles, atr).map(ob => ({ ...ob, timeframe }));
  const fvgs = detectFVGs(candles);
  const liquidityLevels = detectLiquidityLevels(candles, swingPoints);

  // Determine trend from recent structure
  const recentBreaks = structureBreaks.slice(-5);
  const bullishBreaks = recentBreaks.filter(b => b.direction === 'bullish').length;
  const bearishBreaks = recentBreaks.filter(b => b.direction === 'bearish').length;
  const trend = bullishBreaks > bearishBreaks ? 'bullish' : bearishBreaks > bullishBreaks ? 'bearish' : 'neutral';

  // Premium/Discount zones
  const recentHigh = Math.max(...candles.slice(-50).map(c => c.high));
  const recentLow = Math.min(...candles.slice(-50).map(c => c.low));
  const range = recentHigh - recentLow;
  const equilibrium = recentLow + range * 0.5;
  const currentPrice = candles[candles.length - 1].close;
  const currentZone = currentPrice > equilibrium + range * 0.1 ? 'premium' :
                      currentPrice < equilibrium - range * 0.1 ? 'discount' : 'equilibrium';

  return {
    symbol,
    timeframe,
    trend,
    orderBlocks,
    fvgs,
    structurePoints: swingPoints,
    structureBreaks,
    liquidityLevels,
    premiumDiscount: {
      equilibrium,
      premiumZone: recentLow + range * 0.618,
      discountZone: recentLow + range * 0.382,
      currentZone,
    },
  };
}
