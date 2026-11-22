// Utility functions for Indian market formatting

export function formatINR(value: number): string {
  if (Math.abs(value) >= 1e7) {
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  }
  if (Math.abs(value) >= 1e5) {
    return `₹${(value / 1e5).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1e7) {
    return `${(value / 1e7).toFixed(2)} Cr`;
  }
  if (Math.abs(value) >= 1e5) {
    return `${(value / 1e5).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function formatVolume(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

export function getISTTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export function isMarketOpen(): boolean {
  const now = getISTTime();
  const day = now.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // NSE: 9:15 AM to 3:30 PM IST
  return timeInMinutes >= 555 && timeInMinutes <= 930;
}

export function getMarketStatus(): string {
  const now = getISTTime();
  const day = now.getDay();
  if (day === 0 || day === 6) return 'Weekend';
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  if (timeInMinutes < 540) return 'Pre-Market';
  if (timeInMinutes < 555) return 'Pre-Open';
  if (timeInMinutes <= 930) return 'Market Open';
  return 'Market Closed';
}

export function getTimeframeLabel(tf: string): string {
  const labels: Record<string, string> = {
    '1m': '1 Min', '3m': '3 Min', '5m': '5 Min',
    '15m': '15 Min', '30m': '30 Min', '1H': '1 Hour',
    '4H': '4 Hour', '1D': 'Daily', '1W': 'Weekly',
  };
  return labels[tf] || tf;
}

export function getYahooInterval(tf: string): string {
  const map: Record<string, string> = {
    '1m': '1m', '3m': '5m', '5m': '5m',
    '15m': '15m', '30m': '30m', '1H': '60m',
    '4H': '60m', '1D': '1d', '1W': '1wk',
  };
  return map[tf] || '1d';
}

export function getYahooRange(tf: string): string {
  const map: Record<string, string> = {
    '1m': '7d', '3m': '60d', '5m': '60d',
    '15m': '60d', '30m': '60d', '1H': '2y',
    '4H': '2y', '1D': '2y', '1W': '5y',
  };
  return map[tf] || '1y';
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function cleanSymbol(symbol: string): string {
  return symbol.replace('.NS', '').replace('.BO', '').replace('^', '');
}
