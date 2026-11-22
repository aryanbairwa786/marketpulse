import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketPulse — Live Smart Money Analytics for Indian Stocks",
  description: "Free real-time Order Block, FVG, BOS/CHoCH detection for NIFTY 50 & F&O stocks. Smart Money Concepts (SMC) analytics platform for Indian equities.",
  keywords: "order block, smart money concepts, SMC, Indian stocks, NIFTY 50, F&O, liquidity, FVG, BOS, CHoCH",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-white antialiased min-h-screen">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
