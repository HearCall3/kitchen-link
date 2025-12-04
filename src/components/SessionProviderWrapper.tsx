// src/components/SessionProviderWrapper.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// RootLayoutで利用するためのラッパーコンポーネント
export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}