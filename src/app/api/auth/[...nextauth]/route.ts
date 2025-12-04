// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail } from "@/actions/db_access"; //

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
      if (!user.email) {
        return false;
      }
      
      // データベースに何らかのアカウントが存在するかメールアドレスで確認
      const { exists } = await findUserByEmail(user.email); //

      if (!exists) {
        // 全く新規のユーザーの場合のみ、ユーザー登録画面へリダイレクト
        return "/user";
      }
      
      // 既存ユーザーの場合（UserまたはStoreの片方を持っている場合）はホームへ
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email; // JWTにメールアドレスを保存
        
        const { exists } = await findUserByEmail(user.email!);
        // 新規ユーザー判定は「Accountが一つも存在しない」場合に true と定義
        token.isNewUser = !exists; 
      }
      return token;
    },

    async session({ session, token }) {
      session.user.email = token.email as string;
      session.user.isNewUser = token.isNewUser; //
      return session;
    },
  },
});

export { handler as GET, handler as POST };