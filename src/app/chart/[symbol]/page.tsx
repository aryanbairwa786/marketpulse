import { Suspense } from 'react';
import ChartClient from './ChartClient';
import { NIFTY50_STOCKS } from '@/lib/types';

export function generateStaticParams() {
  return NIFTY50_STOCKS.map(s => ({
    symbol: s.symbol,
  }));
}

export default async function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading chart...</span>
          </div>
        </div>
      }
    >
      <ChartClient initialSymbol={decodedSymbol} />
    </Suspense>
  );
}
