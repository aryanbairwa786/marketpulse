# 📈 MarketPulse — Free Real-Time Smart Money Concepts (SMC) Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **MarketPulse** is a 100% free, production-grade Smart Money Concepts (SMC) & algorithmic market structure platform built specifically for Indian Equities (NSE/BSE) and F&O instruments. No paid APIs, no subscriptions, no locked features.

---

## 🌟 Key Features

### 1. 📊 Interactive Terminal & TradingView Lightweight Charts
- **Native SMC Layer Overlays**:
  - **Order Blocks (OB)**: Bullish & Bearish mitigation zones with strength rating and mean threshold (50%).
  - **Fair Value Gaps (FVG)**: Imbalance detection with dynamic fill-ratio tracking.
  - **Market Structure**: Swing Highs/Lows (HH, HL, LH, LL) and real-time **BOS** (Break of Structure) & **CHoCH** (Change of Character) markers.
  - **Liquidity Pools**: Buy-Side Liquidity (BSL), Sell-Side Liquidity (SSL), and Equal Highs/Lows (EQH/EQL) sweep indicators.
  - **Premium & Discount Zones**: 50% equilibrium boundary, 0.618 discount accumulation, and 0.382 premium distribution zones.
- Multi-timeframe switching: `1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`.
- Interactive crosshair with real-time OHLCV inspection and volume bars.

### 2. ⚡ Live Market Dashboard
- **Top Indices**: Real-time quotes for **NIFTY 50**, **BANK NIFTY**, **NIFTY IT**, and **NIFTY FIN SERVICE**.
- **Market Breadth**: Advancers vs. Decliners live tracker.
- **Top Gainers & Losers**: Intraday momentum leaders across NIFTY 50.
- **Sector Heatmap**: Sector performance matrix (Banking, IT, FMCG, Auto, Energy, Metals, Pharma, etc.).
- **Live IST Clock & NSE Session Status**: Automatic tracking of Pre-Market, Pre-Open, Live Market, and Closed states.

### 3. 🔍 Institutional Stock Screener
- Real-time screening across the top 50 Indian stocks.
- Multi-column sort by Symbol, Sector, LTP, % Change, Volume, Open, High, and Low.
- Instant sector filtering & search queries.
- One-click navigation to interactive SMC charts for any stock.

### 4. 🎯 Options Chain & Max Pain Analysis
- Real-time **NIFTY 50** & **BANK NIFTY** Option Chain.
- Call & Put breakdown: Open Interest (OI), Change in OI, Traded Volume, Implied Volatility (IV%), and LTP.
- Visual Open Interest distribution bars.
- Live **Put/Call Ratio (PCR)** calculation.
- Dynamic **Max Pain Strike** detection.
- At-The-Money (ATM) and In-The-Money (ITM) highlight bands.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18.x or 20.x+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/aryanbairwa786/marketpulse.git

# Navigate to the project directory
cd marketpulse

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Free One-Click Deployment on Vercel

MarketPulse is architected with Next.js App Router and optimized for zero-cost, instant deployment on **Vercel**:

1. Fork or import this repository on [GitHub](https://github.com/aryanbairwa786/marketpulse).
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select `marketpulse` from your GitHub repositories.
4. Click **"Deploy"** (no environment variables required — works out of the box with zero setup).

---

## 🛠️ Architecture & Tech Stack

```text
marketpulse/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── nse/indices/route.ts      # Real-time NSE indices API
│   │   │   ├── stocks/route.ts           # Batch stock quote API
│   │   │   └── stocks/[symbol]/history/  # OHLCV candles with fallback engine
│   │   ├── chart/[symbol]/               # SMC TradingView charting terminal
│   │   ├── dashboard/                    # Market overview, gainers, losers, sectors
│   │   ├── options/                      # Option chain, PCR & Max Pain analysis
│   │   ├── screener/                     # Full NIFTY 50 screener
│   │   ├── layout.tsx                    # Dark terminal theme root layout
│   │   └── globals.css                   # Custom glowing gradients & dark UI
│   ├── components/
│   │   ├── chart/ChartWidget.tsx         # TradingView Lightweight Charts v5 integration
│   │   └── layout/Navbar.tsx             # Responsive navbar with live IST ticker
│   ├── lib/
│   │   ├── smc-engine.ts                 # Algorithmic OB, FVG, BOS/CHoCH detection
│   │   ├── types.ts                      # TypeScript definitions & NIFTY 50 roster
│   │   └── utils.ts                      # INR formatting & Indian market hours
│   └── stores/
│       └── app-store.ts                  # Zustand state store
```

---

## ⚖️ Compliance & Disclaimer (India)

This platform is strictly for educational and informational purposes. It does not provide investment advice or recommendations. It is not operated by a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). Technical levels (Order Blocks, Fair Value Gaps, BOS, and Liquidity Pools) are purely mathematical and algorithmic reference zones.
