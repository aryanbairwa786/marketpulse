// Global state management with Zustand
import { create } from 'zustand';
import { StockData, Timeframe, WatchlistItem, SMCAnalysis } from '@/lib/types';

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Watchlist
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;

  // Active symbol
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;

  // Timeframe
  activeTimeframe: Timeframe;
  setActiveTimeframe: (tf: Timeframe) => void;

  // SMC layers visibility
  layers: {
    orderBlocks: boolean;
    fvg: boolean;
    structure: boolean;
    liquidity: boolean;
    premiumDiscount: boolean;
  };
  toggleLayer: (layer: keyof AppState['layers']) => void;

  // Market data cache
  stocksData: Record<string, StockData>;
  updateStockData: (symbol: string, data: StockData) => void;
  updateMultipleStocks: (data: Record<string, StockData>) => void;

  // SMC Analysis cache
  smcCache: Record<string, SMCAnalysis>;
  updateSMCAnalysis: (key: string, analysis: SMCAnalysis) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Screener filters
  screenerFilter: {
    sector: string;
    signal: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
  setScreenerFilter: (filter: Partial<AppState['screenerFilter']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  watchlist: [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', addedAt: Date.now() },
    { symbol: 'TCS.NS', name: 'TCS', addedAt: Date.now() },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', addedAt: Date.now() },
    { symbol: 'INFY.NS', name: 'Infosys', addedAt: Date.now() },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', addedAt: Date.now() },
  ],
  addToWatchlist: (item) => set((s) => ({
    watchlist: s.watchlist.some(w => w.symbol === item.symbol) ? s.watchlist : [...s.watchlist, item],
  })),
  removeFromWatchlist: (symbol) => set((s) => ({
    watchlist: s.watchlist.filter(w => w.symbol !== symbol),
  })),

  activeSymbol: 'RELIANCE.NS',
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),

  activeTimeframe: '15m',
  setActiveTimeframe: (tf) => set({ activeTimeframe: tf }),

  layers: {
    orderBlocks: true,
    fvg: true,
    structure: true,
    liquidity: true,
    premiumDiscount: false,
  },
  toggleLayer: (layer) => set((s) => ({
    layers: { ...s.layers, [layer]: !s.layers[layer] },
  })),

  stocksData: {},
  updateStockData: (symbol, data) => set((s) => ({
    stocksData: { ...s.stocksData, [symbol]: data },
  })),
  updateMultipleStocks: (data) => set((s) => ({
    stocksData: { ...s.stocksData, ...data },
  })),

  smcCache: {},
  updateSMCAnalysis: (key, analysis) => set((s) => ({
    smcCache: { ...s.smcCache, [key]: analysis },
  })),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  screenerFilter: {
    sector: 'All',
    signal: 'All',
    sortBy: 'changePercent',
    sortDir: 'desc',
  },
  setScreenerFilter: (filter) => set((s) => ({
    screenerFilter: { ...s.screenerFilter, ...filter },
  })),
}));
