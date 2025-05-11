import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppKit } from "@/context/appkit";
import Navbar from "@/components/(ui)/Navbar";
import QueryProvider from "../context/queryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/wallet-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Arcade",
  description: "AI-powered Blockchain Agent Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased  m-auto`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <WalletProvider>
            <AppKit>
              <QueryProvider>
                <TooltipProvider delayDuration={0}>
                  <Navbar />
                  {children}
                </TooltipProvider>
              </QueryProvider>
            </AppKit>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
