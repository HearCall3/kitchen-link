"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import './style.css';
import OpinionMap from "../../components/OpinionMap";

export default function StoreRegisterPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setMenuOpen(false);
    alert("ログアウトしました");
  };

  return (
    <div className="phone-frame">
      <header className="header">
        <div className="menuIcon" onClick={toggleMenu}>
          {menuOpen ? "×" : "☰"}
        </div>
        <input className="searchInput" placeholder="タグや店名で検索" />
      </header>

      {menuOpen && <div className="menuOverlay" onClick={() => setMenuOpen(false)} />}

      <div className={`sideMenu ${menuOpen ? 'sideMenuOpen' : ''}`}>
        <ul className="sideMenuList">
          <li className="sideMenuItem" onClick={() => router.push("/profile/user")}>プロフィール</li>
          <li className="sideMenuItem">マイ投稿</li>
          <li className="sideMenuItem" onClick={() => router.push("/Register")}>出店登録</li>
          {!isLoggedIn ? (
            <li className="sideMenuItem" onClick={handleLogin}>ログイン</li>
          ) : (
            <li className="sideMenuItem" onClick={handleLogout}>ログアウト</li>
          )}
        </ul>
      </div>

      <div className="mapContainer">
        <OpinionMap />
      </div>
    </div>
  );
}
