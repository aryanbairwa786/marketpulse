'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import { Timeframe, NIFTY50_STOCKS } from '@/lib/types';
import { cleanSymbol } from '@/lib/utils';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';

const ChartWidget = dynamic(() => import('@/components/chart/ChartWidget'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#09090B]">
      <div className="flex items-center gap-2 text-zinc-400">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
  ),
});

export default function ChartClient({ initialSymbol }: { initialSymbol: string }) {
  const symbol = initialSymbol;
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [layers, setLayers] = useState({
    orderBlocks: true,
    fvg: true,
    structure: true,
    liquidity: true,
    premiumDiscount: false,
  });

  const filteredStocks = NIFTY50_STOCKS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar - Stock list */}
        {sidebarOpen && (
          <div className="w-64 border-r border-[#27272A] bg-[#0D0D0F] flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-[#27272A]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141417] border border-[#27272A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
            {/* Stock list */}
            <div className="flex-1 overflow-y-auto">
              {filteredStocks.map(stock => {
                const isActive = stock.symbol === symbol;
                return (
                  <Link
                    key={stock.symbol}
                    href={`/chart/${encodeURIComponent(stock.symbol)}`}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm border-b border-[#1C1C21] transition-colors ${
                      isActive ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-l-emerald-500' : 'text-zinc-300 hover:bg-[#141417]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{cleanSymbol(stock.symbol)}</div>
                      <div className="text-xs text-zinc-500 truncate">{stock.name}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main chart area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Layer toggles */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#27272A] bg-[#0D0D0F] overflow-x-auto">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white shrink-0"
            >
              {sidebarOpen ? '◀ Hide' : '▶ Stocks'}
            </button>
            <div className="w-px h-5 bg-[#27272A]" />
            <span className="text-xs text-zinc-500 shrink-0">Layers:</span>
            {[
              { key: 'orderBlocks' as const, label: 'Order Blocks', color: 'emerald' },
              { key: 'fvg' as const, label: 'FVG', color: 'blue' },
              { key: 'structure' as const, label: 'BOS/CHoCH', color: 'violet' },
              { key: 'liquidity' as const, label: 'Liquidity', color: 'amber' },
              { key: 'premiumDiscount' as const, label: 'P/D Zones', color: 'pink' },
            ].map(layer => (
              <button
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                  layers[layer.key]
                    ? `bg-${layer.color}-500/10 text-${layer.color}-400 border-${layer.color}-500/30`
                    : 'bg-zinc-800/50 text-zinc-500 border-zinc-700'
                }`}
                style={layers[layer.key] ? {
                  backgroundColor: layer.color === 'emerald' ? 'rgba(16,185,129,0.1)' :
                                   layer.color === 'blue' ? 'rgba(59,130,246,0.1)' :
                                   layer.color === 'violet' ? 'rgba(139,92,246,0.1)' :
                                   layer.color === 'amber' ? 'rgba(245,158,11,0.1)' :
                                   'rgba(236,72,153,0.1)',
                  color: layer.color === 'emerald' ? '#10B981' :
                         layer.color === 'blue' ? '#3B82F6' :
                         layer.color === 'violet' ? '#8B5CF6' :
                         layer.color === 'amber' ? '#F59E0B' :
                         '#EC4899',
                  borderColor: layer.color === 'emerald' ? 'rgba(16,185,129,0.3)' :
                               layer.color === 'blue' ? 'rgba(59,130,246,0.3)' :
                               layer.color === 'violet' ? 'rgba(139,92,246,0.3)' :
                               layer.color === 'amber' ? 'rgba(245,158,11,0.3)' :
                               'rgba(236,72,153,0.3)',
                } : {}}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 relative">
            <ChartWidget
              symbol={symbol}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              layers={layers}
            />
          </div>
        </div>
      </div>
    </>
  );
}
