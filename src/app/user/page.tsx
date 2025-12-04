// src/app/user/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
// next-auth から useSession をインポート
import { useSession } from "next-auth/react";
// データベースアクションをインポート
import { registerUser } from "@/actions/db_access"; //


export default function UserRegisterPage() {
  const router = useRouter();
  // セッションからメールアドレスを取得
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [form, setForm] = useState({
    nickname: "",
    gender: "",
    ageGroup: "",
    occupation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert("認証情報（メールアドレス）が見つかりません。再度ログインしてください。");
      router.push("/login");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    
    // DB登録アクション呼び出し
    const result = await registerUser(formData, email); //

    if (result.success) {
      console.log("登録データ:", form);
      alert("会員登録が完了しました！");
      // 登録成功後、トップページへリダイレクト
      router.push("/");
    } else {
      alert(`登録失敗: ${result.error}`);
    }
  };

  return (
     <main className={styles["register-page"]}>
      <div className={styles["register-card"]}>
        <h1 className={styles["register-title"]}>会員登録</h1>

        {/* ユーザーのGmailアカウント名を表示 */}
        {email && <p style={{ textAlign: 'center', marginBottom: '10px', color: '#f97316' }}>({email} で登録)</p>}

        <form onSubmit={handleSubmit} className={styles["register-form"]}>
          <input
            type="text"
            name="nickname"
            placeholder="ニックネーム"
            value={form.nickname}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          >
            <option value="">性別を選択</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
          <select
            name="ageGroup"
            value={form.ageGroup}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          >
            <option value="">年代を選択</option>
            <option value="under10">10歳未満</option>
            <option value="10s">10代</option>
            <option value="20s">20代</option>
            <option value="30s">30代</option>
            <option value="40s">40代</option>
            <option value="50s">50代</option>
            <option value="60s">60代</option>
            <option value="70s">70代</option>
            <option value="80s">80代以上</option>
          </select>
          <select
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          >
            <option value="">職業を選択</option>
            <option value="student">学生</option>
            <option value="company">会社員</option>
            <option value="part-time">アルバイト・パート</option>
            <option value="freelancer">フリーランス</option>
            <option value="government">公務員</option>
            <option value="unemployed">無職</option>
            <option value="other">その他</option>
          </select>

          <button type="submit" className={styles.registerBtn}>
            登録する
          </button>
        </form>
      </div>
    </main>
  );
}