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
    async jwt({ token, user, trigger }) {
      console.log(`--- JWT Callback START (Trigger: ${trigger ?? 'default'}) ---`);

      // 初回ログイン時 (userが存在する) または 
      // クライアント側で update() が実行された場合
      if (user || trigger === "update") {
        const targetEmail = user?.email || token.email;

        if (targetEmail) {
          console.log("Fetching latest user data for:", targetEmail);
          const details = await findUserByEmail(targetEmail);

          if (details.success && details.exists) {
            // DBにデータがある場合、最新のIDをセット
            token.userId = details.userId ?? undefined;
            token.storeId = details.storeId ?? undefined;
            token.accountId = details.accountId ?? undefined;
            token.isNewUser = false;
          } else {
            // 新規ユーザーの場合
            token.userId = undefined;
            token.storeId = undefined;
            token.accountId = undefined;
            token.isNewUser = true;
          }
        }
      }

      console.log("Final Token state:", token);
      return token;
    },

    async session({ session, token }) {
      console.log("--- Session Callback START ---");
      console.log("Token received in Session:", token);
      session.user.email = token.email as string;
      session.user.isNewUser = token.isNewUser; //
      session.user.accountId = token.accountId;
      session.user.userId = token.userId;
      session.user.storeId = token.storeId;
      console.log("Final Session Object:", session);
      return session;
    },
  },
});

export { handler as GET, handler as POST };