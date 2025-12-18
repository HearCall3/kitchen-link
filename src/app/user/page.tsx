// src/app/user/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
// next-auth から useSession をインポート
import { useSession } from "next-auth/react";
// データベースアクションをインポート
import { createUser } from "@/actions/db_access"; //


export default function UserRegisterPage() {
  const router = useRouter();
  // セッションからメールアドレスを取得
  const { data: session, status, update } = useSession();
  const email = session?.user?.email;

  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    nickname: "",
    gender: "",
    ageGroup: "",
    occupation: "",
  });

  // ==========================================================
  // ★ 追加するリダイレクト処理 ★
  // ==========================================================

  // ブラウザのコンソールでセッションを確認するためのログ
  useEffect(() => {
    console.log("Client-side Session Status:", status);
    console.log("Client-side Session Data:", session);
  }, [session, status]);

  useEffect(() => {
    // 1. まだ読み込み中なら何もしない
    if (status === "loading") return;

    // 2. 読み込み終わったのにセッションがない = ログインしていない
    if (status === "unauthenticated" || !session) {
      console.error("セッションが見つかりません。ログイン画面へ。");
      // router.push("/login"); // 開発中はコメントアウトして様子を見てもOK
      return;
    }

    // 3. 既に登録済み（userIdがある）ならトップへ
    if (session.user?.userId) {
      console.log("既に登録済みです。");
      router.replace("/");
    } else {
      // 新規ユーザーなのでフォームを表示
      setIsLoading(false);
    }

  }, [session, router]);

  // ★ 修正: ローディング中の表示を先に返す ★
  if (isLoading) {
    return (
      <main className={styles["register-page"]} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1 style={{ fontSize: '24px', color: '#f97316' }}>
          情報を照会中・・・
        </h1>
      </main>
    );
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    // session?.user?.email を直接使う
    const currentEmail = session?.user?.email;

    if (!currentEmail) {
      console.error("Session at handleSubmit:", session); // デバッグ用
      alert("セッションが切れました。ページを更新してやり直してください。");
      return;
    }

    if (!email) {
      alert("認証情報（メールアドレス）が見つかりません。再度ログインしてください。");
      router.push("/login");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);

    // DB登録アクション呼び出し
    const result = await createUser(formData, email); //

    if (result.success) {
      // これにより route.ts の jwt/session コールバックが走り、新しいIDがセットされる
      await update();
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
            <option value="1">男性</option>
            <option value="2">女性</option>
            <option value="3">その他</option>
          </select>
          <select
            name="ageGroup"
            value={form.ageGroup}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          >
            <option value="">年代を選択</option>
            <option value="1">10歳未満</option>
            <option value="2">10代</option>
            <option value="3">20代</option>
            <option value="4">30代</option>
            <option value="5">40代</option>
            <option value="5066s">50代</option>
            <option value="7">60代</option>
            <option value="8">70代</option>
            <option value="9">80代以上</option>
          </select>
          <select
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            className={styles["register-input"]}
            required
          >
            <option value="">職業を選択</option>
            <option value="1">学生</option>
            <option value="2">会社員</option>
            <option value="3">アルバイト・パート</option>
            <option value="4">フリーランス</option>
            <option value="5">公務員</option>
            <option value="6">無職</option>
            <option value="7">その他</option>
          </select>

          <button type="submit" className={styles.registerBtn}>
            登録する
          </button>
        </form>
      </div>
    </main>
  );
}