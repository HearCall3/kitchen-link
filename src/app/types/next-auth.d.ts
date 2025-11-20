import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      isNewUser?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    isNewUser?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isNewUser?: boolean;
  }
}
