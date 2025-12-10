// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, findAccountDetailsByEmail } from "@/actions/db_access"; //

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
        return true;
      }
      
      // 既存ユーザーの場合（UserまたはStoreの片方を持っている場合）はホームへ
      return "/";
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        
        // ★ データベースからアカウント詳細を取得 ★
        if (user.email) {
            const account = await findAccountDetailsByEmail(user.email);
            
            if (account) {
                token.accountId = account.accountId as unknown as string;
                // storeIdが存在する場合のみ格納
                if (account.storeId) {
                    token.storeId = account.storeId as unknown as string;
                }
            }
        }
        
        const { exists } = await findUserByEmail(user.email!);
        token.isNewUser = !exists; 
      }
      return token;
    },

    async session({ session, token }) {
      session.user.email = token.email as string;
      session.user.isNewUser = token.isNewUser as boolean;
      
      // ★ JWTからstoreIdとaccountIdをセッションに格納 ★
      session.user.accountId = token.accountId as string | undefined;
      session.user.storeId = token.storeId as string | undefined;
      
      return session;
    },
  },
});

export { handler as GET, handler as POST };