"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./style.css";

export default function StoreRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: "",
    description: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("店舗登録データ:", form);
    router.push("../../");
  };

  return (
    <main className="register-page store-theme">
      <div className="register-card">
        <h1 className="register-title">出店登録</h1>

        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="text"
            name="storeName"
            placeholder="店舗名"
            value={form.storeName}
            onChange={handleChange}
            className="register-input"
            required
          />
          <textarea
            name="description"
            placeholder="店舗の紹介"
            value={form.description}
            onChange={handleChange}
            className="register-textarea"
            required
          />
          <input
            type="text"
            name="address"
            placeholder="出店場所"
            value={form.address}
            onChange={handleChange}
            className="register-input"
            required
          />
          <button type="submit" className="register-btn">
            登録する
          </button>
        </form>

        <div className="register-link">
          <p>一般ユーザーはこちら</p>
          <button onClick={() => router.push("/user")}>会員登録</button>
        </div>
      </div>
    </main>
  );
}
