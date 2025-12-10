"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export default function UserProfilePage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [job, setJob] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleMenuClick = (path: string) => {
    setMenuOpen(false);
    setTimeout(() => router.push(path), 50);
  };

  const menuWidth = "260px";

  return (
    <div className={styles.phoneFrame}>

      <div className={`${styles.phoneContent} ${menuOpen ? styles.contentShift : ''}`}>

        {/* ハンバーガーボタン*/}
        <button
          className={styles.menuButton}
          onClick={toggleMenu}
        >
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

          <button className={styles.closeMenuBtn} onClick={toggleMenu}>
            ×
          </button>
          <ul className={styles.menuList}>
            <li>
              <button className={styles.menuItemButton} onClick={() => handleMenuClick("/")}>ホーム</button>
            </li>
            <li>
              <button className={styles.menuItemButton} onClick={() => handleMenuClick("/profile/user")}>プロフィール</button>
            </li>
            <li>
              <button className={styles.menuItemButton} onClick={() => handleMenuClick("/Register")}>出店登録</button>
            </li>
            {!isLoggedIn ? (
              <li>
                <button className={`${styles.menuItemButton} ${styles.textBlue}`} onClick={handleLogin}>ログイン</button>
              </li>
            ) : (
              <li>
                <button className={`${styles.menuItemButton} ${styles.textBlue}`} onClick={handleLogout}>ログアウト</button>
              </li>
            )}
          </ul>
        </div>

        <h2 className={styles.title}>プロフィール設定</h2>
        <div className={styles.card}>
          {/* ニックネーム */}
          <div>
            <label className={styles.label}>ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例：たろう"
              className={styles.inputtext}
            />
          </div>

          {/* 性別 */}
          <div>
            <label className={styles.label}>性別</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.input}
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* 年代 */}
          <div>
            <label className={styles.label}>年代</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className={styles.input}
            >
              <option value="">年代を選択</option>
              <option value="10歳未満">10歳未満</option>
              <option value="10代">10代</option>
              <option value="20代">20代</option>
              <option value="30代">30代</option>
              <option value="40代">40代</option>
              <option value="50代">50代</option>
              <option value="60代">60代</option>
              <option value="70代">70代</option>
              <option value="80代以上">80代以上</option>
            </select>
          </div>

          {/* 職業 */}
          <div>
            <label className={styles.label}>職業</label>
            <select
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className={styles.input}
            >
              <option value="">職業を選択</option>
              <option value="student">学生</option>
              <option value="company">会社員</option>
              <option value="part-time">アルバイト・パート</option>
              <option value="freelancer">フリーランス</option>
              <option value="public">公務員</option>
              <option value="unemployed">無職</option>
              <option value="other">その他</option>
            </select>
          </div>

          <button className={styles.btn} onClick={() => alert("保存しました！")}>
            保存する
          </button>
        </div>
      </div>
      <div style={{ marginTop: '50px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>危険区域</h2>
        <DeleteAccountButton />
      </div>
    </div>
  );
}