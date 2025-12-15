"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";
import {
  getUserAndStoreDetails,
  updateUser
} from "@/actions/db_access";
// import DeleteAccountButton from "@/components/DeleteAccountButton";

// --- マスタデータとフォーム値のマッピング ---
// DBから来る値（日本語）を、フォームの value（英語キー）に変換するためのマップ。
const GENDER_MAP: { [key: string]: string } = { '男性': 'male', '女性': 'female', 'その他': 'other' };
const JOB_MAP: { [key: string]: string } = { '学生': 'student', '会社員': 'company', 'アルバイト・パート': 'part-time', 'フリーランス': 'freelancer', '公務員': 'public', '無職': 'unemployed', 'その他': 'other' };

// 保存時に日本語に戻す
const REVERSE_GENDER_MAP = Object.fromEntries(Object.entries(GENDER_MAP).map(([k, v]) => [v, k]));
const REVERSE_JOB_MAP = Object.fromEntries(Object.entries(JOB_MAP).map(([k, v]) => [v, k]));



export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // ★ 状態管理のためのStateを追加 ★
  const [isLoading, setIsLoading] = useState(true);
  const [originalData, setOriginalData] = useState<any>(null);

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

  // --- データのフェッチと初期値設定 ---
  useEffect(() => {
    const accountId = session?.user?.accountId;

    if (status === 'authenticated' && accountId) {
      async function fetchAndSetData() {
        setIsLoading(true);
        const result = await getUserAndStoreDetails(accountId!);

        if (result.success && result.account?.user) {
          const user = result.account.user;
          setOriginalData(user); // 生データを保存

          // ★ 取得した値をStateの初期値に設定 ★
          setNickname(user.nickname || '');

          // 性別
          const dbGenderName = user.gender?.genderName || '';
          setGender(GENDER_MAP[dbGenderName] || '');

          // 年代
          const dbAgeGroupName = user.ageGroup?.ageGroupName || '';
          setAgeGroup(dbAgeGroupName || '');
          // ★ 追加デバッグログ ★
          console.log(`[DEBUG] DB Age Group Name: '${dbAgeGroupName}'`);
          console.log(`[DEBUG] Form Age Group Value: '${dbAgeGroupName || ''}'`);

          // 職業
          const dbJobName = user.occupation?.occupationName || '';
          setJob(JOB_MAP[dbJobName] || '');
        } else {
          console.error("プロフィールデータの取得に失敗しました:", result.error);
        }
        setIsLoading(false);
      }
      fetchAndSetData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      // router.push('/login'); // 必要に応じてリダイレクト
    }
  }, [session, status]);

  // --- 更新処理ハンドラー ---
  const handleSaveProfile = async () => {
    const accountId = session?.user?.accountId;

    if (!accountId || isLoading) {
      alert("ログイン情報が見つからないか、データ読み込み中です。");
      return;
    }

    if (!nickname) {
      alert("ニックネームは必須です。");
      return;
    }

    // マッピング処理をここに記述
    const dataToSave = {
      nickname: nickname,
      // 性別: フォーム値 -> DB名に変換
      genderName: REVERSE_GENDER_MAP[gender] || gender || null,
      // 年代: フォーム値 -> DB名（年代は値が同じなのでそのまま）
      ageGroupName: ageGroup || null,
      // 職業: フォーム値 -> DB名に変換
      occupationName: REVERSE_JOB_MAP[job] || job || null,
    };

    // FormDataを作成し、データを格納
    const formData = new FormData();
    formData.append('nickname', dataToSave.nickname);

    if (dataToSave.genderName) {
      formData.append('genderName', dataToSave.genderName);
    }
    if (dataToSave.ageGroupName) {
      formData.append('ageGroupName', dataToSave.ageGroupName);
    }
    if (dataToSave.occupationName) {
      formData.append('occupationName', dataToSave.occupationName);
    }

    console.log("Saving data via FormData:", Object.fromEntries(formData));

    try {
      // ★ サーバーアクションの呼び出し: accountIdをstringで渡す
      const result = await updateUser(String(accountId), formData);

      if (result.success) {
        alert("保存しました！");
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

  const menuWidth = "260px";

  return (
    <div className={styles.phoneFrame}>

      <div className={`${styles.phoneContent} ${menuOpen ? styles.contentShift : ''}`}>

        <div className={`home-button`}>
          <button
            className={styles.iconButton}
            onClick={() => router.push("/")}
            title="ホームに戻る"
          >
            ✕
          </button>
        </div>

        {/* オーバーレイ */}
        {menuOpen && (
          <div
            className={styles.menuOverlay}
            onClick={() => setMenuOpen(false)}
          />
        )}

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

          <button className={styles.btn} onClick={handleSaveProfile} disabled={isLoading}>
            保存する
          </button>
        </div>
      </div>
      {/* <div style={{ marginTop: '50px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>危険区域</h2>
        <DeleteAccountButton />
      </div> */}
    </div>
  );
}