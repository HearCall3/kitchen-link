"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import styles from "./style.module.css";
import { useLocation } from 'react-router-dom';
import { useSession } from "next-auth/react";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 35.681236,
  lng: 139.767125,
};

const libraries: ("geometry" | "drawing" | "places" | "visualization")[] = ["drawing", "geometry", "places"];

export default function StoreRegisterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // ★日付管理用のState
  const [date, setDate] = useState("");

  const router = useRouter();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries
  });

  const { data: session } = useSession();

  const storeId = session?.user.storeId;
  
  const handleSave = () => {
    if (!coordinates) {
        alert("場所を選択してください");
        return;
    }
    if (!date) {
        alert("日付を選択してください");
        return;
    }
    if (!storeId){
      alert("storeIdが見つかりません");
      return;
    }
    //ここでDBに登録して、画面をホームに戻す
    alert(coordinates.lat);
    alert(coordinates.lng);
    alert(date);
    alert(storeId);
  };

  const navigate = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setCoordinates({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)}>
            ☰
          </button>
          <h1 className={styles.title}>出店登録</h1>
        </div>
      </header>

      {/* メインエリア */}
      <div className={styles.mainContent}>
        
        {/* 背景地図 */}
        <div className={styles.mapWrapper}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={15}
              onClick={onMapClick}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: "greedy", // マップ操作優先
              }}
            >
              {coordinates && <Marker position={coordinates} animation={google.maps.Animation.DROP} />}
            </GoogleMap>
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#eee" }} />
          )}
        </div>

        {/* 左上のシンプルパネル */}
        <div className={styles.controlPanel}>
          <div className={styles.panelScrollArea}>
            
            {/* 1. 座標表示エリア */}
            <div className={styles.coordsBox}>
              <div className={styles.coordsLabel}>📍 出店場所</div>
              {coordinates ? (
                <div className={styles.coordsValue}>
                  Lat: {coordinates.lat.toFixed(6)}<br />
                  Lng: {coordinates.lng.toFixed(6)}
                </div>
              ) : (
                <div className={styles.guideText}>
                  マップをクリックして<br/>場所を指定してください
                </div>
              )}
            </div>

            {/* 2. 日付選択エリア */}
            <div className={styles.formGroup}>
              <label className={styles.label}>出店日 (YYYY-MM-DD)</label>
              <input 
                type="date" 
                className={styles.input} 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* 3. 保存ボタン */}
            <button 
              className={styles.saveButton} 
              onClick={handleSave}
              disabled={!coordinates || !date} // 両方入力しないと押せない
            >
              登録する
            </button>

          </div>
        </div>

      </div>

      {/* サイドメニュー (変更なし) */}
      {menuOpen && (
        <>
          <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
          <div className={`${styles.sideMenu} ${menuOpen ? styles.sideMenuOpen : ""}`}>
            <button className={styles.closeMenuBtn} onClick={() => setMenuOpen(false)}>×</button>
            <ul className={styles.menuList}>
              <li><button className={styles.menuItemButton} onClick={() => navigate("/")}>ホーム</button></li>
              <li><button className={styles.menuItemButton} onClick={() => navigate("/profile/user")}>プロフィール</button></li>
              <li><button className={styles.menuItemButton} onClick={() => navigate("/Register")}>出店登録</button></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}