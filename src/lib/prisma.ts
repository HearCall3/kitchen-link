// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// グローバル変数にPrismaClientを格納するための型定義
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 開発環境でのみグローバル変数を使用し、PrismaClientのインスタンスが
// ホットリロードによって複数作成されるのを防ぐ
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;