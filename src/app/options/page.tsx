'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { formatPrice, formatNumber, formatPercent } from '@/lib/utils';
import { ListFilter, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface OptionStrike {
  strikePrice: number;
  ce: { oi: number; changeInOI: number; volume: number; ltp: number; iv: number };
  pe: { oi: number; changeInOI: number; volume: number; ltp: number; iv: number };
}

const OPTION_SYMBOLS = [
  { symbol: '^NSEI', name: 'NIFTY 50', lotSize: 25 },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', lotSize: 15 },
];

function generateDemoOptionChain(spotPrice: number, numStrikes: number = 21): OptionStrike[] {
  const strikeInterval = spotPrice > 30000 ? 100 : 50;
  const atmStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
  const strikes: OptionStrike[] = [];
  const halfStrikes = Math.floor(numStrikes / 2);

  for (let i = -halfStrikes; i <= halfStrikes; i++) {
    const strike = atmStrike + i * strikeInterval;
    const moneyness = (spotPrice - strike) / spotPrice;
    const baseOI = Math.floor(Math.random() * 500000 + 100000);
    const ceOI = Math.floor(baseOI * (1 + moneyness * 3));
    const peOI = Math.floor(baseOI * (1 - moneyness * 3));

    const timeValue = strikeInterval * 0.3;
    const ceIntrinsic = Math.max(0, spotPrice - strike);
    const peIntrinsic = Math.max(0, strike - spotPrice);
    
    strikes.push({
      strikePrice: strike,
      ce: {
        oi: Math.max(0, ceOI),
        changeInOI: Math.floor((Math.random() - 0.4) * 50000),
        volume: Math.floor(Math.random() * 100000 + 10000),
        ltp: Math.max(0.05, ceIntrinsic + timeValue * Math.exp(-Math.abs(moneyness) * 5) + (Math.random() - 0.5) * 10),
        iv: 12 + Math.abs(moneyness) * 30 + Math.random() * 3,
      },
      pe: {
        oi: Math.max(0, peOI),
        changeInOI: Math.floor((Math.random() - 0.4) * 50000),
        volume: Math.floor(Math.random() * 100000 + 10000),
        ltp: Math.max(0.05, peIntrinsic + timeValue * Math.exp(-Math.abs(moneyness) * 5) + (Math.random() - 0.5) * 10),
        iv: 12 + Math.abs(moneyness) * 30 + Math.random() * 3,
      },
    });
  }

  return strikes;
}

export default function OptionsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState(OPTION_SYMBOLS[0]);
  const [spotPrice, setSpotPrice] = useState(0);
  const [optionChain, setOptionChain] = useState<OptionStrike[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks?symbols=${encodeURIComponent(selectedSymbol.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        const stock = Object.values(data.stocks)[0] as { ltp: number } | undefined;
        if (stock) {
          setSpotPrice(stock.ltp);
          setOptionChain(generateDemoOptionChain(stock.ltp));
        }
      }
    } catch (err) {
      console.error('Options fetch error:', err);
      setSpotPrice(24500);
      setOptionChain(generateDemoOptionChain(24500));
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCEOI = optionChain.reduce((s, o) => s + o.ce.oi, 0);
  const totalPEOI = optionChain.reduce((s, o) => s + o.pe.oi, 0);
  const pcr = totalCEOI > 0 ? (totalPEOI / totalCEOI).toFixed(2) : '0';

  const maxPainStrike = optionChain.length > 0
    ? optionChain.reduce((best, strike) => {
        const cePain = optionChain.reduce((s, o) => s + Math.max(0, o.strikePrice - strike.strikePrice) * o.ce.oi, 0);
        const pePain = optionChain.reduce((s, o) => s + Math.max(0, strike.strikePrice - o.strikePrice) * o.pe.oi, 0);
        const totalPain = cePain + pePain;
        return totalPain < best.pain ? { strike: strike.strikePrice, pain: totalPain } : best;
      }, { strike: 0, pain: Infinity }).strike
    : 0;

  const maxCEOI = Math.max(...optionChain.map(o => o.ce.oi), 1);
  const maxPEOI = Math.max(...optionChain.map(o => o.pe.oi), 1);
  const atmStrike = spotPrice > 0 ? optionChain.reduce((closest, o) => 
    Math.abs(o.strikePrice - spotPrice) < Math.abs(closest - spotPrice) ? o.strikePrice : closest
  , optionChain[0]?.strikePrice || 0) : 0;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListFilter className="w-6 h-6 text-violet-500" />
              Option Chain
            </h1>
            <p className="text-sm text-zinc-500 mt-1">OI, Change in OI, PCR & Max Pain Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            {OPTION_SYMBOLS.map(sym => (
              <button
                key={sym.symbol}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSymbol.symbol === sym.symbol
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                {sym.name}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Spot Price</div>
            <div className="text-xl font-bold font-mono">₹{formatPrice(spotPrice)}</div>
          </div>
          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">PCR (Put/Call Ratio)</div>
            <div className={`text-xl font-bold font-mono ${
              Number(pcr) > 1 ? 'text-emerald-400' : Number(pcr) < 0.7 ? 'text-red-400' : 'text-zinc-200'
            }`}>
              {pcr}
            </div>
          </div>
          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Max Pain</div>
            <div className="text-xl font-bold font-mono text-amber-400">₹{formatPrice(maxPainStrike)}</div>
          </div>
          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Lot Size</div>
            <div className="text-xl font-bold font-mono">{selectedSymbol.lotSize}</div>
          </div>
        </div>

        {/* Option Chain Table */}
        <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th colSpan={5} className="px-4 py-2 text-center text-emerald-400 bg-emerald-500/5 font-semibold">
                    CALLS (CE)
                  </th>
                  <th className="px-4 py-2 text-center text-zinc-400 bg-zinc-800/50 font-semibold">
                    STRIKE
                  </th>
                  <th colSpan={5} className="px-4 py-2 text-center text-red-400 bg-red-500/5 font-semibold">
                    PUTS (PE)
                  </th>
                </tr>
                <tr className="text-zinc-500 border-b border-[#27272A]">
                  <th className="px-3 py-2 text-right font-medium">OI</th>
                  <th className="px-3 py-2 text-right font-medium">Chg OI</th>
                  <th className="px-3 py-2 text-right font-medium">Vol</th>
                  <th className="px-3 py-2 text-right font-medium">IV%</th>
                  <th className="px-3 py-2 text-right font-medium">LTP</th>
                  <th className="px-3 py-2 text-center font-medium bg-zinc-800/30">Strike</th>
                  <th className="px-3 py-2 text-right font-medium">LTP</th>
                  <th className="px-3 py-2 text-right font-medium">IV%</th>
                  <th className="px-3 py-2 text-right font-medium">Vol</th>
                  <th className="px-3 py-2 text-right font-medium">Chg OI</th>
                  <th className="px-3 py-2 text-right font-medium">OI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C21]">
                {loading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-3 py-2.5">
                          <div className="h-3 bg-zinc-800 rounded w-12 ml-auto" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  optionChain.map(option => {
                    const isATM = option.strikePrice === atmStrike;
                    const isITMCE = option.strikePrice < spotPrice;
                    const isITMPE = option.strikePrice > spotPrice;
                    const ceOIBar = (option.ce.oi / maxCEOI) * 100;
                    const peOIBar = (option.pe.oi / maxPEOI) * 100;

                    return (
                      <tr
                        key={option.strikePrice}
                        className={`hover:bg-[#1C1C21] transition-colors ${
                          isATM ? 'bg-violet-500/5 border-l-2 border-r-2 border-violet-500/40' : ''
                        }`}
                      >
                        {/* CE Side */}
                        <td className={`px-3 py-2.5 text-right font-mono relative ${isITMCE ? 'bg-emerald-500/5' : ''}`}>
                          <div className="absolute inset-y-0 right-0 bg-emerald-500/10" style={{ width: `${ceOIBar}%` }} />
                          <span className="relative">{formatNumber(option.ce.oi)}</span>
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono ${
                          option.ce.changeInOI > 0 ? 'text-emerald-400' : 'text-red-400'
                        } ${isITMCE ? 'bg-emerald-500/5' : ''}`}>
                          {option.ce.changeInOI > 0 ? '+' : ''}{formatNumber(option.ce.changeInOI)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-zinc-400 ${isITMCE ? 'bg-emerald-500/5' : ''}`}>
                          {formatNumber(option.ce.volume)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-zinc-400 ${isITMCE ? 'bg-emerald-500/5' : ''}`}>
                          {option.ce.iv.toFixed(1)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono font-medium ${isITMCE ? 'bg-emerald-500/5' : ''}`}>
                          {formatPrice(option.ce.ltp)}
                        </td>
                        {/* Strike */}
                        <td className={`px-3 py-2.5 text-center font-mono font-bold bg-zinc-800/30 ${
                          isATM ? 'text-violet-400' : 'text-zinc-300'
                        }`}>
                          {option.strikePrice}
                          {isATM && <span className="ml-1 text-[10px] text-violet-400">ATM</span>}
                        </td>
                        {/* PE Side */}
                        <td className={`px-3 py-2.5 text-right font-mono font-medium ${isITMPE ? 'bg-red-500/5' : ''}`}>
                          {formatPrice(option.pe.ltp)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-zinc-400 ${isITMPE ? 'bg-red-500/5' : ''}`}>
                          {option.pe.iv.toFixed(1)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono text-zinc-400 ${isITMPE ? 'bg-red-500/5' : ''}`}>
                          {formatNumber(option.pe.volume)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono ${
                          option.pe.changeInOI > 0 ? 'text-emerald-400' : 'text-red-400'
                        } ${isITMPE ? 'bg-red-500/5' : ''}`}>
                          {option.pe.changeInOI > 0 ? '+' : ''}{formatNumber(option.pe.changeInOI)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-mono relative ${isITMPE ? 'bg-red-500/5' : ''}`}>
                          <div className="absolute inset-y-0 right-0 bg-red-500/10" style={{ width: `${peOIBar}%` }} />
                          <span className="relative">{formatNumber(option.pe.oi)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 py-4">
          <p>Option chain data is simulated for demonstration. Real OI data requires NSE API access.</p>
          <p className="mt-1">For educational purposes only. Not investment advice.</p>
        </div>
      </main>
    </>
  );
}
