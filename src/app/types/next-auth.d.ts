// src/app/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt"; // JWTのインポートを追加

declare module "next-auth" {
  interface Session {
    user: {
      isNewUser?: boolean;
      email?: string; // メールアドレスを追加
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    isNewUser?: boolean;
    email?: string; // メールアドレスを追加
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isNewUser?: boolean;
    email?: string; // メールアドレスを追加
  }
}