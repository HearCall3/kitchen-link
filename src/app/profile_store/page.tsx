"use client";

import { useState } from "react";
import styles from "./style.module.css";

export default function StoreProfileEditPage() {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [storeUrl, setStoreUrl] = useState("");

  const handleSave = () => {
    alert("店舗プロフィールを保存しました！（テスト版）");
    console.log({ storeName, description, storeUrl });
  };

  return (
    <div className={styles["phone-frame"]}>
      <div className={styles["phone-content"]}>
        
        {/* タイトル */}
        <h2 className={styles.title}>店舗プロフィール設定</h2>

        <div className={styles.container}>
          
          {/* 店舗名 */}
          <div>
            <label className={styles.label}>店舗名</label>
            <input
              type="text"
              className={styles.input}
              placeholder="例：キッチンリンクカフェ"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          {/* 紹介文 */}
          <div>
            <label className={styles.label}>紹介文</label>
            <textarea
              className={styles.textarea}
              placeholder="お店の特徴などを入力してください"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* URL */}
          <div>
            <label className={styles.label}>URL</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://example.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
            />
          </div>

          {/* 保存ボタン */}
          <button className={styles.btn} onClick={handleSave}>
            保存する
          </button>

        </div>
      </div>
    </div>
  );
}
