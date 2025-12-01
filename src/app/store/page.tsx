"use client";
import { useState } from "react";
import styles from "./style.module.css";
import OpinionMap from "../../components/OpinionMap";

export default function StoreRegisterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const [isLoggedIn] = useState(true);

  return (
    <div className={styles.phoneFrame}>
      <header className={styles.header}>
        <div className={styles.menuIcon} onClick={toggleMenu}>
          {menuOpen ? "×" : "☰"}
        </div>
        <input className={styles.searchInput} placeholder="検索" />
      </header>

      {menuOpen && <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />}
      <div className={`${styles.sideMenu} ${menuOpen ? styles.sideMenuOpen : ""}`}>
        <ul>
          <li>プロフィール</li>
          <li>マイ投稿</li>
          {isLoggedIn ? <li>ログアウト</li> : <li>ログイン</li>}
        </ul>
      </div>

      <div className={styles.mapContainer}>
        <OpinionMap />
      </div>
    </div>
  );
}
