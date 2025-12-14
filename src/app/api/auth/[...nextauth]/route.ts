// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, findAccountDetailsByEmail } from "@/actions/db_access";
import * as crypto from 'crypto';

// --- Hashing Utility Function ---
// db_access.tsと同じ関数を定義
function hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}
// ----------------------------------

const handler = NextAuth({
    // adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
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
        // ★ signIn コールバックで true を返し、JWT 構築に進める ★
        async signIn({ user }) {
            if (!user.email) return false;

            const { exists } = await findUserByEmail(user.email);

            console.log(`[DEBUG AUTH SIGNIN] User exists: ${exists}. Continue to JWT.`);
            // 既存/新規に関わらず true を返し、JWT構築に進める
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.email = user.email;

                // 🚨 NextAuthが管理する Account が存在しないため、手動でDBをチェック
                if (user.email) {
                    const dbAccount = await findAccountDetailsByEmail(user.email);

                    // --- デバッグログ ---
                    console.log("[DEBUG AUTH JWT] DB Account Found:", !!dbAccount);
                    // --------------------

                    if (dbAccount) {
                        // DBに統合アカウントが存在する場合、IDを格納
                        token.accountId = dbAccount.accountId as unknown as string;
                        if (dbAccount.storeId) {
                            token.storeId = dbAccount.storeId as unknown as string;
                        }
                    } else {
                        // DBにアカウントがない場合、ここではIDを格納しない (新規登録が必要)
                        token.accountId = undefined;
                        token.storeId = undefined;
                    }
                }

                const { exists } = await findUserByEmail(user.email!);
                token.isNewUser = !exists;
            }
            // --- 最終JWTトークンのデバッグ ---
            console.log("[DEBUG AUTH JWT] Final Token:", token);
            return token;
        },

        async session({ session, token }) {
            session.user.email = token.email as string;
            session.user.isNewUser = token.isNewUser as boolean;
            session.user.accountId = token.accountId as string | undefined;
            session.user.storeId = token.storeId as string | undefined;
            return session;
        },
    },
});

export { handler as GET, handler as POST };