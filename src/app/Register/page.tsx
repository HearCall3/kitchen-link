"use client";

import { useState } from "react";
import styles from "./style.module.css";

export default function StoreRegisterPage() {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [storeUrl, setStoreUrl] = useState("");

  const handleSave = () => {
    alert("出店情報を保存しました！（テスト版）");
    console.log({ storeName, description, storeUrl });
  };

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneContent}>
        <h2 className={styles.title}>出店登録</h2>

    

        {/* 保存ボタン（下中央固定） */}
        <button className={styles.btn} onClick={handleSave}>
          保存
        </button>
      </div>
    </div>
  );
}
