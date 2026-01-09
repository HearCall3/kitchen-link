"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthEnforcer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const hasUserId = !!session?.user?.userId;
    const hasStoreId = !!session?.user?.storeId;
    const onUserPage = pathname?.toLowerCase().startsWith("/user");
    const onStorePage = pathname?.toLowerCase().startsWith("/store");

    // 初期設定未完了 (どちらのIDもない) → /user を起点に誘導
    if (!hasUserId && !hasStoreId) {
      if (!onUserPage && !onStorePage) {
        router.replace("/user");
      }
    } else {
      // 初期設定済みなのに初期設定ページにいる場合はトップへ
      if (onUserPage || onStorePage) {
        router.replace("/");
      }
    }
  }, [status, session, pathname, router]);

  return <>{children}</>;
}

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthEnforcer>{children}</AuthEnforcer>
    </SessionProvider>
  );
}
