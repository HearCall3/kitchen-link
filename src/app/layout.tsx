// app/layout.tsx (Server Component)
"use client";
import { metadata } from "./metadata";
import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// SessionProviderをインポート
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper"; //

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* SessionProviderWrapperで子コンポーネントをラップ */}
        <SessionProviderWrapper> 
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
