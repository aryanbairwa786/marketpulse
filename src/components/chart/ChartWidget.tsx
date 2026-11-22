'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  createSeriesMarkers,
  CandlestickData,
  HistogramData,
  Time,
  SeriesMarker,
} from 'lightweight-charts';
import { Candle, SMCAnalysis, Timeframe } from '@/lib/types';
import { runSMCAnalysis } from '@/lib/smc-engine';
import { cleanSymbol, formatPrice, formatPercent, getYahooInterval, getYahooRange } from '@/lib/utils';

interface ChartWidgetProps {
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  layers: {
    orderBlocks: boolean;
    fvg: boolean;
    structure: boolean;
    liquidity: boolean;
    premiumDiscount: boolean;
  };
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];

export default function ChartWidget({ symbol, timeframe, onTimeframeChange, layers }: ChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersPluginRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const [smcAnalysis, setSMCAnalysis] = useState<SMCAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState<{ name: string; price: number; change: number; changePercent: number } | null>(null);
  const [crosshairData, setCrosshairData] = useState<{ time: string; o: number; h: number; l: number; c: number; v: number } | null>(null);

  const fetchAndRender = useCallback(async () => {
    setLoading(true);
    try {
      const interval = getYahooInterval(timeframe);
      const range = getYahooRange(timeframe);
      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/history?interval=${interval}&range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const candles: Candle[] = data.candles || [];
      if (candles.length === 0) return;

      // Set stock info
      const lastCandle = candles[candles.length - 1];
      const prevClose = data.meta?.previousClose || candles[0].open;
      setStockInfo({
        name: data.name || symbol,
        price: lastCandle.close,
        change: lastCandle.close - prevClose,
        changePercent: prevClose ? ((lastCandle.close - prevClose) / prevClose) * 100 : 0,
      });

      // Run SMC analysis
      const analysis = runSMCAnalysis(candles, symbol, timeframe);
      setSMCAnalysis(analysis);

      // Render chart
      if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

      const candleData: CandlestickData<Time>[] = candles.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const volumeData: HistogramData<Time>[] = candles.map(c => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));

      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      // Add SMC markers
      const markers: SeriesMarker<Time>[] = [];

      if (layers.structure) {
        analysis.structureBreaks.forEach(sb => {
          markers.push({
            time: sb.time as Time,
            position: sb.direction === 'bullish' ? 'belowBar' : 'aboveBar',
            color: sb.direction === 'bullish' ? '#22C55E' : '#EF4444',
            shape: sb.type === 'CHoCH' ? 'circle' : (sb.direction === 'bullish' ? 'arrowUp' : 'arrowDown'),
            text: sb.type,
          });
        });
      }

      const sortedMarkers = markers.sort((a, b) => (a.time as number) - (b.time as number));
      if (!markersPluginRef.current && candleSeriesRef.current) {
        markersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, sortedMarkers);
      } else if (markersPluginRef.current) {
        markersPluginRef.current.setMarkers(sortedMarkers);
      }

      // Fit content
      chartRef.current.timeScale().fitContent();

    } catch (err) {
      console.error('Chart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, layers]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#09090B' },
        textColor: '#A1A1AA',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.5)' },
        horzLines: { color: 'rgba(39, 39, 42, 0.5)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(139, 92, 246, 0.4)', labelBackgroundColor: '#8B5CF6' },
        horzLine: { color: 'rgba(139, 92, 246, 0.4)', labelBackgroundColor: '#8B5CF6' },
      },
      rightPriceScale: {
        borderColor: '#27272A',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#27272A',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairData(null);
        return;
      }
      const candleValue = param.seriesData.get(candleSeries) as unknown as CandlestickData<Time> | undefined;
      const volumeValue = param.seriesData.get(volumeSeries) as unknown as HistogramData<Time> | undefined;
      if (candleValue && 'open' in candleValue) {
        setCrosshairData({
          time: new Date((param.time as number) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          o: candleValue.open,
          h: candleValue.high,
          l: candleValue.low,
          c: candleValue.close,
          v: volumeValue && 'value' in volumeValue ? volumeValue.value : 0,
        });
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (markersPluginRef.current) {
        markersPluginRef.current.detach();
        markersPluginRef.current = null;
      }
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Fetch data when symbol/timeframe/layers change
  useEffect(() => {
    fetchAndRender();
    const interval = setInterval(fetchAndRender, 60000);
    return () => clearInterval(interval);
  }, [fetchAndRender]);

  return (
    <div className="flex flex-col h-full">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272A] bg-[#141417]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-lg font-bold">{cleanSymbol(symbol)}</span>
            {stockInfo && (
              <span className="text-xs text-zinc-500 ml-2">{stockInfo.name}</span>
            )}
          </div>
          {stockInfo && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-semibold">₹{formatPrice(stockInfo.price)}</span>
              <span className={`text-sm font-mono font-medium ${
                stockInfo.change >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stockInfo.change >= 0 ? '+' : ''}{formatPrice(stockInfo.change)} ({formatPercent(stockInfo.changePercent)})
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* OHLCV overlay */}
      {crosshairData && (
        <div className="absolute top-14 left-4 z-10 flex gap-3 text-xs font-mono bg-[#09090B]/80 backdrop-blur-sm px-3 py-1.5 rounded">
          <span className="text-zinc-500">{crosshairData.time}</span>
          <span>O: <span className="text-zinc-200">{formatPrice(crosshairData.o)}</span></span>
          <span>H: <span className="text-emerald-400">{formatPrice(crosshairData.h)}</span></span>
          <span>L: <span className="text-red-400">{formatPrice(crosshairData.l)}</span></span>
          <span>C: <span className="text-zinc-200">{formatPrice(crosshairData.c)}</span></span>
          <span>V: <span className="text-violet-400">{crosshairData.v.toLocaleString()}</span></span>
        </div>
      )}

      {/* Chart container */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]/50 z-20">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading chart...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />
      </div>

      {/* SMC Analysis Summary */}
      {smcAnalysis && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#27272A] bg-[#141417] text-xs overflow-x-auto">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
            smcAnalysis.trend === 'bullish' ? 'bg-emerald-500/10 text-emerald-400' :
            smcAnalysis.trend === 'bearish' ? 'bg-red-500/10 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            Trend: {smcAnalysis.trend.toUpperCase()}
          </div>
          <div className="text-zinc-400">
            OBs: <span className="text-white font-medium">
              {smcAnalysis.orderBlocks.filter(ob => ob.status === 'active').length} active
            </span>
          </div>
          <div className="text-zinc-400">
            FVGs: <span className="text-white font-medium">
              {smcAnalysis.fvgs.filter(f => f.status !== 'filled').length} open
            </span>
          </div>
          <div className="text-zinc-400">
            BOS/CHoCH: <span className="text-white font-medium">{smcAnalysis.structureBreaks.length}</span>
          </div>
          <div className={`px-2 py-1 rounded ${
            smcAnalysis.premiumDiscount.currentZone === 'discount' ? 'bg-emerald-500/10 text-emerald-400' :
            smcAnalysis.premiumDiscount.currentZone === 'premium' ? 'bg-red-500/10 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            Zone: {smcAnalysis.premiumDiscount.currentZone.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
