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
      if (user && user.email) { // nullチェックを追加
        token.email = user.email; // JWTにメールアドレスを保存

        // ★ 修正箇所: DBからユーザー/ストアの詳細情報を取得する ★
        // findUserByEmail は { exists: boolean, userId?: string, storeId?: string } 
        // のような詳細を返すものと仮定します。
        const details = await findUserByEmail(user.email);

        // 成功していればIDを格納
        if (details.success && details.exists) {
          // ★ 修正: null の場合に undefined に変換する (?? undefined は ?? で省略可能) ★
          token.userId = details.userId ?? undefined;
          token.storeId = details.storeId ?? undefined;
          token.accountId = details.accountId ?? undefined;
        } else {
          // アカウントが存在しない場合、IDを明示的に undefined に設定
          token.userId = undefined;
          token.storeId = undefined;
          token.accountId = undefined;
        }

        // 新規ユーザー判定は「Accountが一つも存在しない」場合に true と定義
        token.isNewUser = !details.exists;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.email = token.email as string;
      session.user.isNewUser = token.isNewUser; //
      session.user.accountId = token.accountId;
      session.user.userId = token.userId;
      session.user.storeId = token.storeId;
      return session;
    },
  },
});

export { handler as GET, handler as POST };