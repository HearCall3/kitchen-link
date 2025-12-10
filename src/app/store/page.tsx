// src/app/store/page.tsx
"use client";

import { useState } from "react";
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
            <input
              type="text"
              className={styles.registerInput}
              placeholder="店舗名"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <textarea
              className={styles.registerTextarea}
              placeholder="説明（任意）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>

            <input
              type="url"
              className={styles.registerInput}
              placeholder="店舗URL（任意）"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
            />

            <button onClick={handleSave} className={styles.registerBtn}>
              登録する
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}