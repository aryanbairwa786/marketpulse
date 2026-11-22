'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { formatPrice, formatPercent, formatVolume, getMarketStatus, cleanSymbol } from '@/lib/utils';
import { IndexData, StockData } from '@/lib/types';
import { NIFTY50_STOCKS } from '@/lib/types';
import {
  TrendingUp, TrendingDown, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Clock,
  Zap, Eye
} from 'lucide-react';

export default function DashboardPage() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<string>('Market Closed');

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [indicesRes, stocksRes] = await Promise.allSettled([
        fetch('/api/nse/indices'),
        fetch(`/api/stocks?symbols=${NIFTY50_STOCKS.slice(0, 20).map(s => s.symbol).join(',')}`),
      ]);

      if (indicesRes.status === 'fulfilled' && indicesRes.value.ok) {
        const data = await indicesRes.value.json();
        setIndices(data.indices || []);
      }

      if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
        const data = await stocksRes.value.json();
        setStocks(data.stocks || {});
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load market data. Retrying...');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMarketStatus(getMarketStatus());
    fetchData();
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stockList = Object.values(stocks);
  const gainers = [...stockList].filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...stockList].filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  // Sector performance
  const sectorMap: Record<string, { total: number; change: number; count: number }> = {};
  stockList.forEach(s => {
    const stock = NIFTY50_STOCKS.find(n => n.symbol === s.symbol);
    if (stock) {
      if (!sectorMap[stock.sector]) sectorMap[stock.sector] = { total: 0, change: 0, count: 0 };
      sectorMap[stock.sector].total += s.changePercent;
      sectorMap[stock.sector].count++;
    }
  });
  const sectors = Object.entries(sectorMap)
    .map(([name, data]) => ({ name, avgChange: data.total / data.count }))
    .sort((a, b) => b.avgChange - a.avgChange);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 py-6 space-y-6">
        {/* Market Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Market Dashboard</h1>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              marketStatus === 'Market Open' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'Market Open' ? 'bg-emerald-500 live-pulse' : 'bg-zinc-500'}`} />
              {marketStatus}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </span>
            )}
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Index Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && indices.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#141417] border border-[#27272A] rounded-xl p-4 animate-pulse">
                <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
                <div className="h-8 w-32 bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-20 bg-zinc-800 rounded" />
              </div>
            ))
          ) : (
            indices.map((idx) => (
              <div
                key={idx.symbol}
                className={`bg-[#141417] border rounded-xl p-4 transition-all hover:border-zinc-600 ${
                  idx.change >= 0 ? 'border-emerald-500/20 glow-green' : 'border-red-500/20 glow-red'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 font-medium">{idx.name}</span>
                  {idx.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight">
                  {formatPrice(idx.value)}
                </div>
                <div className={`text-sm font-medium font-mono mt-1 ${
                  idx.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {idx.change >= 0 ? '+' : ''}{formatPrice(idx.change)} ({formatPercent(idx.changePercent)})
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Gainers */}
          <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Top Gainers
              </h3>
              <span className="text-xs text-zinc-500">NIFTY 50</span>
            </div>
            <div className="divide-y divide-[#1C1C21]">
              {loading && gainers.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 animate-pulse">
                    <div className="h-4 w-full bg-zinc-800 rounded" />
                  </div>
                ))
              ) : gainers.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">No data yet</div>
              ) : (
                gainers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/chart/${encodeURIComponent(stock.symbol)}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#1C1C21] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{cleanSymbol(stock.symbol)}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">₹{formatPrice(stock.ltp)}</div>
                      <div className="text-xs font-mono text-emerald-400">{formatPercent(stock.changePercent)}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Top Losers
              </h3>
              <span className="text-xs text-zinc-500">NIFTY 50</span>
            </div>
            <div className="divide-y divide-[#1C1C21]">
              {loading && losers.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 animate-pulse">
                    <div className="h-4 w-full bg-zinc-800 rounded" />
                  </div>
                ))
              ) : losers.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">No data yet</div>
              ) : (
                losers.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/chart/${encodeURIComponent(stock.symbol)}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#1C1C21] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{cleanSymbol(stock.symbol)}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">₹{formatPrice(stock.ltp)}</div>
                      <div className="text-xs font-mono text-red-400">{formatPercent(stock.changePercent)}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sector Heatmap */}
          <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                Sector Performance
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {loading && sectors.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />
                ))
              ) : sectors.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">No data yet</div>
              ) : (
                sectors.map((sector) => (
                  <div
                    key={sector.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      sector.avgChange > 1 ? 'heat-strong-up' :
                      sector.avgChange > 0 ? 'heat-up' :
                      sector.avgChange > -1 ? 'heat-down' : 'heat-strong-down'
                    }`}
                  >
                    <span className="text-sm font-medium">{sector.name}</span>
                    <span className={`text-sm font-mono font-medium ${
                      sector.avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatPercent(sector.avgChange)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Full Stock List */}
        <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              NIFTY 50 Stocks
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{stockList.length} stocks loaded</span>
              <Link
                href="/screener"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Full Screener
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-[#1C1C21]">
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-right px-4 py-2 font-medium">LTP</th>
                  <th className="text-right px-4 py-2 font-medium">Change</th>
                  <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">Open</th>
                  <th className="text-right px-4 py-2 font-medium hidden md:table-cell">High</th>
                  <th className="text-right px-4 py-2 font-medium hidden md:table-cell">Low</th>
                  <th className="text-right px-4 py-2 font-medium hidden lg:table-cell">Volume</th>
                  <th className="text-center px-4 py-2 font-medium">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C21]">
                {loading && stockList.length === 0 ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-14 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 w-14 bg-zinc-800 rounded ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-8 bg-zinc-800 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : (
                  stockList.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-[#1C1C21] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{cleanSymbol(stock.symbol)}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[120px]">{stock.name}</div>
                      </td>
                      <td className="text-right px-4 py-3 font-mono">₹{formatPrice(stock.ltp)}</td>
                      <td className={`text-right px-4 py-3 font-mono font-medium ${
                        stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatPercent(stock.changePercent)}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-zinc-400 hidden sm:table-cell">
                        ₹{formatPrice(stock.open)}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-zinc-400 hidden md:table-cell">
                        ₹{formatPrice(stock.high)}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-zinc-400 hidden md:table-cell">
                        ₹{formatPrice(stock.low)}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-zinc-400 hidden lg:table-cell">
                        {formatVolume(stock.volume)}
                      </td>
                      <td className="text-center px-4 py-3">
                        <Link
                          href={`/chart/${encodeURIComponent(stock.symbol)}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="text-center text-xs text-zinc-600 py-4 border-t border-[#1C1C21]">
          <p>MarketPulse — Free & Open Source. For educational purposes only. Not investment advice.</p>
          <p className="mt-1">Data sourced from Yahoo Finance. Prices may be delayed.</p>
        </div>
      </main>
    </>
  );
}
