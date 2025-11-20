"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./style.css";

export default function UserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nickname: "",
    gender: "",
    age: "",
    occupation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("登録データ:", form);
    router.push("../../");
  };

  return (
    <main className="register-page">
      <div className="register-card">
        <h1 className="register-title">会員登録</h1>

        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="text"
            name="nickname"
            placeholder="ニックネーム"
            value={form.nickname}
            onChange={handleChange}
            className="register-input"
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="register-input"
            required
          >
            <option value="">性別を選択</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
          <input
            type="number"
            name="age"
            placeholder="年齢"
            value={form.age}
            onChange={handleChange}
            className="register-input"
            required
          />
                    <select
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            className="register-input"
            required
          >
            <option value="">職業を選択</option>
            <option value="student">学生</option>
            <option value="company">会社員</option>
            <option value="freelancer">フリーランス</option>
            <option value="self-employed">自営業</option>
            <option value="part-time">アルバイト・パート</option>
            <option value="unemployed">無職</option>
            <option value="other">その他</option>
          </select>
          <button type="submit" className="register-btn">
            登録する
          </button>
        </form>

        <div className="register-link">
          <p>お店の方はこちら</p>
          <button onClick={() => router.push("/store")}>出店登録</button>
        </div>
      </div>
    </main>
  );
}
