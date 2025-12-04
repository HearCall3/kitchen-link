"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function StoreRegisterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    alert("出店情報を保存しました！（テスト版）");
  };

  const navigate = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneContent}>
        {/* ヘッダー部分（スマホ画面内） */}
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)}>
            ☰
          </button>
          <h2 className={styles.title}>出店登録</h2>
        </header>

        {/* メインコンテンツ */}
        <main className={styles.mainContent}>
          {/* フォームなどここに追加可能 */}
          <button className={styles.btn} onClick={handleSave}>
            保存
          </button>
        </main>

        {/* サイドメニュー */}
        {menuOpen && (
          <>
            <div
              className={styles.menuOverlay}
              onClick={() => setMenuOpen(false)}
            />
            <div className={`${styles.sideMenu} ${menuOpen ? styles.sideMenuOpen : ""}`}>
              <button className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)}>
                ×
              </button>
              <ul className={styles.menuList}>
                <li>
                  <button className={styles.menuItemButton} onClick={() => navigate("/")}>
                    ホーム
                  </button>
                </li>
                <li>
                  <button className={styles.menuItemButton} onClick={() => navigate("/profile/user")}>
                    プロフィール
                  </button>
                </li>
                <li>
                  <button className={styles.menuItemButton} onClick={() => navigate("/Register")}>
                    出店登録
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
