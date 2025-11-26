import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

//npm install next-auth　のインストール

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      // 初回ログインなら user へ飛ばす　テスト用で全員になっている
      const isNewUser = true; // todo 後でDB判定に置き換え
      if (isNewUser) {
        // Google認証の直後に登録画面へ
        return "/user";
      }
      // 2回目以降ならそのままOK
      return true;
    },

    async jwt({ token, user }) {
      if (user) token.isNewUser = user.isNewUser ?? false;
      return token;
    },

    async session({ session, token }) {
      session.user.isNewUser = token.isNewUser;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
