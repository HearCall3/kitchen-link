// src/app/store/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./style.module.css";
import { useRouter } from "next/navigation";

// next-auth から useSession をインポート
import { useSession } from "next-auth/react";
// データベースアクションをインポート
import { createStore } from "@/actions/db_access"; //


export default function StoreRegisterPage() {
  const router = useRouter();
  // セッションからメールアドレスを取得
  const { data: session } = useSession();
  const email = session?.user?.email;

  // ★ ローディング状態の State を追加 ★
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================
  // ★ リダイレクト処理の追加 (ストアIDの確認) ★
  // ==========================================================
  useEffect(() => {
    // セッションデータがまだ解決されていない状態（ローディング）
    if (session === undefined) {
      setIsLoading(true);
      return;
    }

    // 認証済み (sessionが存在する) かつ storeId が存在する (=既にストア登録済み) の場合
    if (session && session.user && session.user.storeId) { // ★ 修正: storeId の有無で判定 ★
      console.log("ストアアカウントが既に存在するため、トップページへリダイレクトします。");
      router.replace("/");
    } else {
      // ストアIDが存在しない（ユーザーアカウントのみ、または新規ユーザー）場合は、登録フォームへ
      setIsLoading(false);
    }
  }, [session, router]);
  // ==========================================================

  // ローディング中の表示
  if (isLoading) {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1 style={{ fontSize: '24px', color: '#f97316' }}>
          セッション情報を照会中・・・
        </h1>
      </main>
    );
  }

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    storeUrl: "",
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- デバッグログ: 試行開始 ---
    console.log("--- Store Registration Attempt ---");
    console.log("Session Email:", email);

    if (!email) {
      alert("認証情報（メールアドレス）が見つかりません。再度ログインしてください。");
      router.push("/login");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const storeName = formData.get('storeName');
    console.log("Form Store Name:", storeName); // 入力された店舗名を確認


    // DB登録アクション呼び出し
    const result = await createStore(formData, email);

    // --- デバッグログ: サーバーアクションの結果 ---
    console.log("Server Action Result:", result);

    if (result.success) {
      console.log("店舗登録データ:", form);
      alert("出店登録が完了しました！");

      // 登録成功後、トップページへリダイレクト
      router.push("/");
    } else {
      alert(`登録失敗: ${result.error}`);
    }
  };
  return (
    <div>
      {/* ユーザーのGmailアカウント名を表示 */}
      {email && <p style={{ textAlign: 'center', marginBottom: '10px', color: '#10b981' }}>({email} で登録)</p>}

      {/* ==== メインコンテンツ ==== */}
      <div className={styles.storeTheme}>
        <div className={styles.registerCard}>
          <h2 className={styles.registerTitle}>店舗情報入力</h2>

          <div className={styles.registerForm}>
            <form onSubmit={handleSubmit} className={styles.registerForm}>
              <input
                type="text"
                className={styles.registerInput}
                name="storeName"
                placeholder="店舗名"
                value={form.storeName}
                onChange={handleChange}
                required
              />

              <textarea
                name="description"
                placeholder="説明（任意）"
                value={form.description}
                onChange={handleChange}
                className={styles.registerTextarea}
                required
              />

              <input
                type="url"
                name="storeUrl"
                className={styles.registerInput}
                placeholder="店舗URL（任意）"
                value={form.storeUrl}
                onChange={handleChange}
              />

              <button type="submit" className={styles.registerBtn}>
                登録する
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}