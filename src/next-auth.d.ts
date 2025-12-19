import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});

export { handler as GET, handler as POST };

declare module "next-auth" {
  interface Session {
    user: {
      isNewUser?: boolean;
      email?: string;
      storeId?: string; // ★ 修正: storeId (String) を追加
      userId?: string;
      accountId?: string; 
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    isNewUser?: boolean;
    email?: string;
    storeId?: string; // 補足: User型にも追加
    userId?: string;
    accountId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isNewUser?: boolean;
    email?: string;
    storeId?: string; // ★ 修正: JWTにもstoreIdを追加
    userId?: string;
    accountId?: string;
  }
}