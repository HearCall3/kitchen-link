"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import styles from "./style.module.css";
import { useSession } from "next-auth/react";
import { registerStoreSchedule } from "@/actions/db_access";
import Geocoding from "../../components/ReverceGeocoding";
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

  // ★ 修正 1: isLoading ステートを追加 ★
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries
  });

  const { data: session } = useSession();

  const storeId = session?.user.storeId;

  // ★ 修正 2: handleSave にローディング制御を追加 ★
  const handleSave = async () => {
    if (!coordinates) {
      alert("場所を選択してください");
      return;
    }
    if (!date) {
      alert("日付を選択してください");
      return;
    }
    if (!storeId) {
      alert("storeIdが見つかりません。店舗オーナーとして登録されているか確認してください。");
      return;
    }

    setIsLoading(true);

    const dataToSend = {
      storeId: storeId,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      scheduledDate: date, // サーバーアクションに渡す
    };

    try {
      // サーバーアクションを呼び出す
      // registerStoreSchedule は { success: boolean, ... } を返すと仮定
      const result = await registerStoreSchedule(dataToSend);

      if (result.success) {
        alert("出店スケジュールを登録しました！");
        // 登録成功後、画面をホームに戻す
        router.push("/");
      } else {
        // DBからのエラーメッセージを表示
        alert(`登録に失敗しました: ${result.error || '不明なエラー'}`);
      }

    } catch (error) {
      console.error("登録処理中に予期せぬエラー:", error);
      alert("システムエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
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
      {/* ... (ヘッダー, マップ表示は省略) ... */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`home-button`}>
            <button
              className={styles.iconButton}
              onClick={() => router.push("/")}
              title="ホームに戻る"
            >
              ✕
            </button>
          </div>
          <h1 className={styles.title}>出店登録</h1>
        </div>
      </header>

      <div className={styles.mainContent}>

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
                gestureHandling: "greedy",
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

            {/* 1. 座標表示エリア (変更なし) */}
            <div className={styles.coordsBox}>
              <div className={styles.coordsLabel}>📍 出店場所</div>
              {coordinates ? (
                <div className={styles.coordsValue}>
                <Geocoding lat={coordinates?.lat} lng={coordinates?.lng} />
                </div>
              ) : (
                <div className={styles.guideText}>
                  マップをクリックして<br />場所を指定してください
                </div>
              )}
            </div>

            {/* 2. 日付選択エリア (変更なし) */}
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
              // ★ 修正 3: ローディング中と未入力時に無効化 ★
              disabled={!coordinates || !date || isLoading}
            >
              {isLoading ? '登録中...' : '登録する'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}