"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function StoreProfileEditPage() {
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [storeUrl, setStoreUrl] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSave = () => {
    alert("店舗プロフィールを保存しました！（テスト版）");
    console.log({ storeName, description, storeUrl });
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleMenuClick = (path: string) => {
    setMenuOpen(false);
    setTimeout(() => router.push(path), 50);
  };

  return (
    <div className={styles["phone-frame"]}>
      <div className={styles["phone-content"]}>
        {/* タイトル */}
        <h2 className={styles.title}>店舗プロフィール設定</h2>

        <div className={`${styles.phoneContent} ${menuOpen ? styles.contentShift : ""}`}>
        
          {/* ハンバーガーボタン */}
          <button className={styles.menuButton} onClick={toggleMenu}>
            ☰
          </button>

          {/* オーバーレイ */}
          {menuOpen && (
            <div
              className={styles.menuOverlay}
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* サイドメニュー */}
          <div className={`${styles.sideMenu} ${menuOpen ? styles.sideMenuOpen : ""}`}>
            
            {/* ✕ボタン */}
            <button className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)}>
              ×
            </button>

            {/* メニュー項目 */}
            <ul className={styles.menuList}>
              <li><button className={styles.menuItemButton} onClick={() => handleMenuClick("/")}>ホーム</button></li>
              <li><button className={styles.menuItemButton} onClick={() => handleMenuClick("/profile/user")}>プロフィール</button></li>
              <li><button className={styles.menuItemButton} onClick={() => handleMenuClick("/Register")}>出店登録</button></li>
              {!isLoggedIn ? (
                <li><button className={styles.menuItemButton} onClick={handleLogin}>ログイン</button></li>
              ) : (
                <li><button className={styles.menuItemButton} onClick={handleLogout}>ログアウト</button></li>
              )}
            </ul>

          </div>

          {/* 入力フォーム */}
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
    </div>
  );
}
