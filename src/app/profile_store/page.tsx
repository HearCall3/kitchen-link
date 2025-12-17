"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; import { useRouter } from "next/navigation";
import styles from "./style.module.css";
import {
  getUserAndStoreDetails,
  updateStore
} from "@/actions/db_access";

export default function StoreProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- 状態管理のためのStateを追加/修正 ---
  const [isLoading, setIsLoading] = useState(true);
  const [originalStoreData, setOriginalStoreData] = useState<any>(null);

  // フォームフィールド 
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [storeUrl, setStoreUrl] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleMenuClick = (path: string) => {
    setMenuOpen(false);
    setTimeout(() => router.push(path), 50);
  };

  // ----------------------------------------------------------------
    // データのフェッチと初期値設定 (useEffect)
    // ----------------------------------------------------------------
    useEffect(() => {
        const accountId = session?.user?.accountId as string;
        // status が authenticated かつ accountId が存在する場合にデータ取得を開始
        if (status === 'authenticated' && accountId) {
            async function fetchAndSetData() {
                setIsLoading(true);
                // getUserAndStoreDetails を使用してアカウント情報を取得
                const result = await getUserAndStoreDetails(accountId); 
                
                // 成功し、かつストア情報が存在する場合
                if (result.success && result.account?.store) {
                    const store = result.account.store;
                    setOriginalStoreData(store); // 生データを保存

                    // ★ 取得した値をStateの初期値に設定 ★
                    setStoreName(store.storeName || '');
                    setDescription(store.introduction || '');
                    // storeUrlやaddressなどの追加情報があれば設定
                    setStoreUrl(store.storeUrl || ''); 
                    
                } else if (result.success && !result.account?.store) {
                    // アカウントはあるが、ストア情報がない（=ユーザーアカウントとしてログイン中）
                    alert("このアカウントは店舗情報を持っていません。");
                    router.replace("/user"); // ユーザープロフィール編集ページへリダイレクト
                } else {
                    console.error("ストアプロフィールデータの取得に失敗しました:", result.error);
                }
                setIsLoading(false);
            }
            fetchAndSetData();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
            router.push('/login'); // 非認証時はログインページへ
        } else if (status === 'loading') {
            // ローディング状態を維持
            setIsLoading(true);
        }
    }, [session, status, router]);

    // ----------------------------------------------------------------
    // 更新処理ハンドラー (handleSave)
    // ----------------------------------------------------------------
    const handleSave = async () => {
        const accountId = session?.user?.accountId; 
        
        if (!accountId || isLoading) {
            alert("ログイン情報が見つからないか、データ読み込み中です。");
            return;
        }

        if (!storeName || !description) {
            alert("店舗名と紹介文は必須です。");
            return;
        }

        // FormDataを作成し、データを格納
        const formData = new FormData();
        formData.append('storeName', storeName);
        formData.append('introduction', description); // DBのキー名に合わせて修正
        formData.append('storeUrl', storeUrl);
        // addressなどあれば追加

        console.log("Saving Store data via FormData:", Object.fromEntries(formData));

        try {
            // ★ サーバーアクションの呼び出し: updateStore を使用 ★
            const result = await updateStore(accountId, formData); 

            if (result.success) {
                alert("店舗プロフィールを保存しました！");
                // 成功した場合、ページデータを再取得するためにリロード
                window.location.reload(); 
            } else {
                alert(`保存に失敗しました: ${result.error || '不明なエラー'}`);
            }
        } catch (error) {
            console.error("更新エラー:", error);
            alert("サーバーとの通信中にエラーが発生しました。");
        }
    };

    // --- ローディング/非認証時の表示 ---
    if (isLoading || status === 'loading') {
        return <div className={styles.phoneFrame}><h2 className={styles.title}>読み込み中...</h2></div>;
    }

    if (status === 'unauthenticated') {
        return <div className={styles.phoneFrame}><h2 className={styles.title}>ログインしてください</h2></div>;
    }

  return (
    <div className={styles["phone-frame"]}>
      <div className={styles["phone-content"]}>
        {/* タイトル */}
        <h2 className={styles.title}>店舗プロフィール設定</h2>

        <div className={`home-button`}>
          <button
            className={styles.iconButton}
            onClick={() => router.push("/")}
            title="ホームに戻る"
          >
            ✕
          </button>
        </div>

        {/* 入力フォーム */}
        <div className={styles.container}>
          {/* 店舗名 */}
          <div>
            <label className={styles.label}>店舗名</label>
            <input
              type="text"
              className={styles.input}
              placeholder="例：キッチンリンク"
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
