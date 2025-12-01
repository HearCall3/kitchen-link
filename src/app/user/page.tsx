"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function UserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nickname: "",
    gender: "",
    ageGroup: "",
    occupation: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("登録データ:", form);

    // ログイン状態保存
    localStorage.setItem("isLoggedIn", "true");

    // 必要なら追加のユーザー情報も保存できる
    localStorage.setItem("userNickname", form.nickname);

    // ホームへ戻る
    router.push("/");
  };

  return (
    <main className={styles["register-page"]}>
      <div className={styles["register-card"]}>
        <h1 className={styles["register-title"]}>会員登録</h1>

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
