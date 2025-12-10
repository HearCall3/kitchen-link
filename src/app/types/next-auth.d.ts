// src/app/types/next-auth.d.ts
import "next-auth";
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      isNewUser?: boolean;
      email?: string;
      storeId?: string; // ★ 修正: storeId (String) を追加
      accountId?: string; 
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    isNewUser?: boolean;
    email?: string;
    storeId?: string; // 補足: User型にも追加
    accountId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isNewUser?: boolean;
    email?: string;
    storeId?: string; // ★ 修正: JWTにもstoreIdを追加
    accountId?: string;
  }
}