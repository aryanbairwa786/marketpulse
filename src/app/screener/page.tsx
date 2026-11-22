'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { NIFTY50_STOCKS, StockData } from '@/lib/types';
import { formatPrice, formatPercent, formatVolume, cleanSymbol } from '@/lib/utils';
import { ScanSearch, ArrowUpDown, Filter, Eye, TrendingUp, TrendingDown } from 'lucide-react';

type SortKey = 'symbol' | 'ltp' | 'changePercent' | 'volume' | 'sector';

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('changePercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStocks = useCallback(async () => {
    try {
      const batchSize = 15;
      const allStocks: Record<string, StockData> = {};
      
      for (let i = 0; i < NIFTY50_STOCKS.length; i += batchSize) {
        const batch = NIFTY50_STOCKS.slice(i, i + batchSize);
        const symbols = batch.map(s => s.symbol).join(',');
        const res = await fetch(`/api/stocks?symbols=${symbols}`);
        if (res.ok) {
          const data = await res.json();
          Object.assign(allStocks, data.stocks || {});
        }
      }
      
      setStocks(allStocks);
      setLoading(false);
    } catch (err) {
      console.error('Screener fetch error:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, [fetchStocks]);

  const sectors = ['All', ...Array.from(new Set(NIFTY50_STOCKS.map(s => s.sector)))].sort();

  const stockList = NIFTY50_STOCKS
    .map(s => ({
      ...s,
      data: stocks[s.symbol],
    }))
    .filter(s => s.data)
    .filter(s => sectorFilter === 'All' || s.sector === sectorFilter)
    .filter(s =>
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aData = a.data;
      const bData = b.data;
      let cmp = 0;
      switch (sortBy) {
        case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
        case 'ltp': cmp = aData.ltp - bData.ltp; break;
        case 'changePercent': cmp = aData.changePercent - bData.changePercent; break;
        case 'volume': cmp = aData.volume - bData.volume; break;
        case 'sector': cmp = a.sector.localeCompare(b.sector); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const advancers = Object.values(stocks).filter(s => s.changePercent > 0).length;
  const decliners = Object.values(stocks).filter(s => s.changePercent < 0).length;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ScanSearch className="w-6 h-6 text-emerald-500" />
              Stock Screener
            </h1>
            <p className="text-sm text-zinc-500 mt-1">NIFTY 50 stocks with live market data</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{advancers}</span>
              </div>
              <span className="text-zinc-600">/</span>
              <div className="flex items-center gap-1 text-red-400">
                <TrendingDown className="w-4 h-4" />
                <span className="font-medium">{decliners}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#141417] border border-[#27272A] rounded-lg px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-zinc-500" />
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setSectorFilter(sector)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  sectorFilter === sector
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:bg-zinc-800'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#141417] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-[#27272A]">
                  {[
                    { key: 'symbol' as SortKey, label: 'Symbol', align: 'left' },
                    { key: 'sector' as SortKey, label: 'Sector', align: 'left' },
                    { key: 'ltp' as SortKey, label: 'LTP', align: 'right' },
                    { key: 'changePercent' as SortKey, label: 'Change %', align: 'right' },
                    { key: 'volume' as SortKey, label: 'Volume', align: 'right' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => handleSort(col.key)}
                    >
                      <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                        {col.label}
                        <ArrowUpDown className={`w-3 h-3 ${sortBy === col.key ? 'text-emerald-400' : 'text-zinc-700'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Open</th>
                  <th className="px-4 py-3 font-medium text-right hidden md:table-cell">High</th>
                  <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Low</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C21]">
                {loading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-zinc-800 rounded w-16 ml-auto" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : stockList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                      No stocks match your filters
                    </td>
                  </tr>
                ) : (
                  stockList.map(stock => (
                    <tr key={stock.symbol} className="hover:bg-[#1C1C21] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{cleanSymbol(stock.symbol)}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{stock.sector}</td>
                      <td className="px-4 py-3 text-right font-mono">₹{formatPrice(stock.data.ltp)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${
                        stock.data.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatPercent(stock.data.changePercent)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatVolume(stock.data.volume)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">₹{formatPrice(stock.data.open)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400 hidden md:table-cell">₹{formatPrice(stock.data.high)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400 hidden md:table-cell">₹{formatPrice(stock.data.low)}</td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/chart/${encodeURIComponent(stock.symbol)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Chart
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 py-4">
          <p>Data sourced from Yahoo Finance. Prices may be delayed. For educational purposes only.</p>
        </div>
      </main>
    </>
  );
}
