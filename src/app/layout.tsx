// src/app/layout.tsx
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
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
