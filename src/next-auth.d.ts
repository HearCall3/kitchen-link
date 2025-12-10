import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role?: string; // ← これ追加
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
