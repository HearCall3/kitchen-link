// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // JWT に role を追加
    async jwt({ token, account, user }) {
      // Google のアカウント email などで判定して role を設定
      // 例: 特定メールなら user、別なら store
      if (user) {
        console.log("Google user email:", user.email); // ←必ず確認
        // ここで store メールを直接指定するか、特定メールを store にする
        if (user.email === "store@example.com") {
          token.role = "store";
        } else {
          token.role = "user";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
