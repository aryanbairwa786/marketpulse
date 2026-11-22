// Core types for MarketPulse

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  id: string;
  type: 'bullish' | 'bearish';
  startTime: number;
  endTime: number;
  top: number;
  bottom: number;
  midpoint: number;
  strength: number; // 0-100
  status: 'active' | 'tested' | 'mitigated' | 'breaker';
  timeframe: string;
  volumeRatio: number;
}

export interface FairValueGap {
  id: string;
  type: 'bullish' | 'bearish';
  time: number;
  top: number;
  bottom: number;
  fillPercent: number;
  status: 'open' | 'partially_filled' | 'filled';
}

export interface StructurePoint {
  time: number;
  price: number;
  type: 'HH' | 'HL' | 'LH' | 'LL';
}

export interface StructureBreak {
  time: number;
  price: number;
  type: 'BOS' | 'CHoCH';
  direction: 'bullish' | 'bearish';
}

export interface LiquidityLevel {
  price: number;
  type: 'BSL' | 'SSL' | 'EQH' | 'EQL';
  touches: number;
  swept: boolean;
  sweepTime?: number;
}

export interface SMCAnalysis {
  symbol: string;
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  structurePoints: StructurePoint[];
  structureBreaks: StructureBreak[];
  liquidityLevels: LiquidityLevel[];
  premiumDiscount: {
    equilibrium: number;
    premiumZone: number;
    discountZone: number;
    currentZone: 'premium' | 'discount' | 'equilibrium';
  };
}

export interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  prevClose: number;
  timestamp: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  advance: number;
  decline: number;
  unchanged: number;
}

export interface OptionData {
  strikePrice: number;
  expiryDate: string;
  ce: {
    oi: number;
    changeInOI: number;
    volume: number;
    ltp: number;
    iv: number;
    bidPrice: number;
    askPrice: number;
  };
  pe: {
    oi: number;
    changeInOI: number;
    volume: number;
    ltp: number;
    iv: number;
    bidPrice: number;
    askPrice: number;
  };
}

export interface OptionChainData {
  symbol: string;
  spotPrice: number;
  expiryDates: string[];
  strikePrices: number[];
  data: OptionData[];
  pcr: number;
  maxPainStrike: number;
  timestamp: number;
}

export interface ScreenerStock extends StockData {
  sector: string;
  marketCap: number;
  pe: number;
  smcSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  activeOBs: number;
  openFVGs: number;
  trendBias: 'bullish' | 'bearish' | 'neutral';
  rsi: number;
  atr: number;
  rvol: number;
}

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W';

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

export const NIFTY50_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Paints' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Pharma' },
  { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'IT' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India', sector: 'FMCG' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metals' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metals' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Conglomerate' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT' },
  { symbol: 'ONGC.NS', name: 'ONGC', sector: 'Energy' },
  { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Mining' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance' },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Labs", sector: 'Pharma' },
  { symbol: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', sector: 'Healthcare' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Auto' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Cement' },
  { symbol: 'DIVISLAB.NS', name: "Divi's Labs", sector: 'Pharma' },
  { symbol: 'BPCL.NS', name: 'BPCL', sector: 'Energy' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Auto' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking' },
  { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance', sector: 'Insurance' },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', sector: 'Insurance' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products', sector: 'FMCG' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metals' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Infrastructure' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Auto' },
  { symbol: 'LTIM.NS', name: 'LTIMindtree', sector: 'IT' },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance', sector: 'Finance' },
];

export const INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
  { symbol: '^NSEMDCP50', name: 'NIFTY MIDCAP 50' },
  { symbol: '^CNXIT', name: 'NIFTY IT' },
  { symbol: '^CNXFIN', name: 'NIFTY FINANCIAL SERVICES' },
];
