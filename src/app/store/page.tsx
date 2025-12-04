"use client";

import { useState } from "react";
import styles from "./style.module.css";
import { useRouter } from "next/navigation";

export default function StoreRegisterPage() {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  //保存ボタンで画面遷移
  const handleSave = () => {
    router.push("/");
  };
  return (
    <div>
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
    </div>
  );
}
