// src/app/store/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
// next-auth から useSession をインポート
import { useSession } from "next-auth/react";
// データベースアクションをインポート
import { registerStore } from "@/actions/db_access"; //


export default function StoreRegisterPage() {
  const router = useRouter();
  // セッションからメールアドレスを取得
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- デバッグログ: 試行開始 ---
    console.log("--- Store Registration Attempt ---");
    console.log("Session Email:", email); 
    // ------------------------------

    if (!email) {
      alert("認証情報（メールアドレス）が見つかりません。再度ログインしてください。");
      router.push("/login");
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const storeName = formData.get('storeName');
    console.log("Form Store Name:", storeName); // 入力された店舗名を確認
    

    // DB登録アクション呼び出し
    const result = await registerStore(formData, email); //

    // --- デバッグログ: サーバーアクションの結果 ---
    console.log("Server Action Result:", result); 
    // ------------------------------------------

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
    <main className={styles["register-page"]}>
      <div className={styles["register-card"]}>
        <h1 className={styles["register-title"]}>出店登録</h1>
        
        {/* ユーザーのGmailアカウント名を表示 */}
        {email && <p style={{ textAlign: 'center', marginBottom: '10px', color: '#10b981' }}>({email} で登録)</p>}

        <form onSubmit={handleSubmit} className={styles["register-form"]}>
          <input
            type="text"
            name="storeName"
            placeholder="店舗名"
            value={form.storeName}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          />
          <textarea
            name="description"
            placeholder="店舗の紹介"
            value={form.description}
            onChange={handleChange}
            className={styles["register-textarea"]}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="出店場所"
            value={form.address}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          />
          <button type="submit" className={styles.registerBtn}>
            登録する
          </button>
        </form>
      </div>
    </main>
  );
}