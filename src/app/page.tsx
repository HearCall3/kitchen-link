"use client"

import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import OpinionMap from "../components/map/OpinionMap";
import PollMap from "../components/map/PollMap";
import StoreMap from "../components/map/StoreMap";

export default function Home() {
  const router = useRouter();
  // ログイン情報を取得
  // NextAuthのセッション情報
  // isLoggedIn = !!session で判定
  const { data: session } = useSession();

  // ====== マップ状態 ======
  const status = ['opinion', 'poll', 'store'] as const;
  const [mapStatus, setMapStatus] = useState<typeof status[number]>('store');
  // ====== 絞り込み ======
  const [selectedFilter, setSelectedFilter] = useState("キッチンカー");
  const [filter, setFilter] = useState("");

  // ====== 意見投稿 ======
  const [postOpen, setPostOpen] = useState(false);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState("");

  const addTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim())) {
      setTags([...tags, inputTag.trim()]);
      setInputTag("");
    }
  };

  // ====== メニュー ======
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  // ====== アンケート ======
  const [pollOpen, setPollOpen] = useState(false);
  const [votes, setVotes] = useState({ yes: 3, no: 2 });
  const [voted, setVoted] = useState(false);

  const handleVote = (option: "yes" | "no") => {
    if (voted) return;
    setVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
    setVoted(true);
  };
  const currentVotes = votes || { yes: 0, no: 0 };
  const total = currentVotes.yes + currentVotes.no;

  const yesPercent = total ? (currentVotes.yes / total) * 100 : 0;
  const noPercent = total ? (currentVotes.no / total) * 100 : 0;

  const handleOpenPost = () => {
    // 未ログインならモーダル表示して終了
    // ログイン済みなら意見投稿モーダルを開く
    if (!checkLoginStatus()) return;
    setPostOpen(true);
  };

  const handleOpenPollCreate = () => {
    if (!checkLoginStatus()) return;
    setCreateOpen(true);
  };

  const handleOpenPollVote = () => {
    if (!checkLoginStatus()) return;
    setPollOpen(true);
  };


  // ====== アンケートを開く ======
  const openPoll = () => setPollOpen(true);

  // ====== アンケート作成 ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  //選択肢（２こ）
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");


  const createPoll = async () => {
    if (!newQuestion.trim()) return;

    const res = await fetch("/api/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion }),
    });

    if (res.ok) {
      alert("アンケートを作成しました！");
      setNewQuestion("");
      setCreateOpen(false);
    }
  };

  // ====== ログイン====
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ====== ログインチェック関数=====
  const checkLoginStatus = () => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    // ログイン状態を state にセット
    setIsLoggedIn(loggedIn);
    // 未ログインならモーダル表示
    if (!loggedIn) setShowLoginPrompt(true);
    // 戻り値でログイン状態を返す
    return loggedIn;
  };

  // ====== ログイン・ログアウト関数（トップレベルに置く）=====
  const handleLogin = () => router.push("/login");

  const handleLogout = async () => {
    try {
      // NextAuth のセッションを削除
      await signOut({ callbackUrl: "/" }); // ログアウト後はトップページへ
      // localStorageの状態も更新
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
      setMenuOpen(false);
    } catch (error) {
      console.error(error);
      alert("ログアウトに失敗しました");
    }
  };

  // マップ処理
  useEffect(() => {
    // コンポーネント初回レンダリング時とタブフォーカス時にログインチェック
    checkLoginStatus();
    window.addEventListener("focus", checkLoginStatus);

    return () => window.removeEventListener("focus", checkLoginStatus);
  }, []);

  useEffect(() => {
    // ① コンポーネントが最初に描画された時にチェック
    checkLoginStatus();

    // ② ユーザーがタブ/アプリに戻った時（focusイベント）に再チェック
    window.addEventListener('focus', checkLoginStatus);

    // ③ クリーンアップ関数: コンポーネントが破棄されるときにイベントリスナーを解除
    return () => {
      window.removeEventListener('focus', checkLoginStatus);
    };
  }, []);

  const handleDialogOpen = (data: string) => {
    switch (data) {
      case ("post"):
        setPostOpen(true);
        break;
      case ("poll"):
        setCreateOpen(true);
        break;
    }
  }

  const FILTER_ITEMS = [
    { label: "キッチンカー", key: "store" },
    { label: "アンケート", key: "poll" },
    { label: "意見", key: "opinion" },
  ] as const;

  const mapList = {
    opinion: <OpinionMap onDialogOpen={handleDialogOpen} />,
    poll: <PollMap onDialogOpen={handleDialogOpen} />,
    store: <StoreMap />
  };

  return (
    <div className="frame">
      {/* ===== ヘッダー ===== */}
      <header className="flex items-center bg-orange-500 text-white p-3 relative z-50">
        <div className="menuIcon text-2xl mr-3 cursor-pointer" onClick={toggleMenu}>
          {menuOpen ? "×" : "☰"}
        </div>
        <div className="flex-1 flex bg-white rounded-full overflow-hidden items-center">
          <input
            type="text"
            placeholder="タグや店名で検索"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 p-2 text-gray-700"
          />
        </div>
      </header>
      {/* ===== フィルターチップ ===== */}
      <div className="filter-chip-container">
        {FILTER_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`filter-chip ${mapStatus === item.key ? "active" : ""}`}
            onClick={() => setMapStatus(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===== ハンバーガーメニュー ===== */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
      )}

      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul className="text-gray-800 text-lg">

          <li
            className="border-b p-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/profile_user")}
          >
            プロフィール
          </li>
          <li className="border-b p-3 hover:bg-gray-100">マイ投稿</li>
          <li
            className="border-b p-3 hover:bg-gray-100"
            onClick={() => router.push("/register")}
          >出店登録</li>
          {!session ? (
            <li onClick={() => signIn("google", { callbackUrl: "/user" })}>ログイン</li>
          ) : (
            <li onClick={() => signOut({ callbackUrl: "/" })}>ログアウト</li>
          )}
        </ul>
      </div>

      {/*ログイン画面下から出す*/}
      {showLoginPrompt && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="dialog-overlay"
            onClick={() => setShowLoginPrompt(false)}
          />

          {/* ログインモーダル */}
          <div className="login-prompt-dialog">
            <button className="close-btn" onClick={() => setShowLoginPrompt(false)}>×</button>
            <h1 className="login-title">Kitchen Link</h1>
            <button
              className="login-btn"
              onClick={() => signIn("google", { callbackUrl: "/user" })}>
              Googleでユーザーログイン
            </button>

            <button
              className="login-btn"
              onClick={() => signIn("google", { callbackUrl: "/store" })}
            >
              Googleで店舗ログイン
            </button>
          </div>
        </>
      )}



      {/* ==== オーバーレイ（背景クリックで閉じる） ==== */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* マップ */}
      <div className="map-container z-10 relative">
        {mapList[mapStatus]}
      </div>

      {/* ===== アクションボタン ===== */}
      <div className="flex flex-col items-center gap-4 p-4">
        <button onClick={handleOpenPollCreate} className="submit-btn mb-2">
          アンケートを作成
        </button>
        <button className="submit-btn flex flex-col items-center" onClick={handleOpenPollVote}>
          アンケートに回答する
        </button>

        <button onClick={handleOpenPost} className="submit-btn">
          意見を投稿する
        </button>
      </div>

      {/* ===== アンケート回答ダイアログ ===== */}
      {pollOpen && (
        <>
          <div className="dialog-overlay" onClick={() => setPollOpen(false)} />
          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setPollOpen(false)}>×</button>
            <h3>この店にまた来たいですか？</h3>
            {!voted ? (
              <div className="vote-buttons">
                <button className="yes" onClick={() => handleVote("yes")}>はい</button>
                <button className="no" onClick={() => handleVote("no")}>いいえ</button>
              </div>
            ) : (
              <>
                <div className="result-bar">
                  <div className="yes-bar" style={{ width: `${yesPercent}%` }}>{yesPercent.toFixed(0)}%</div>
                  <div className="no-bar" style={{ width: `${noPercent}%` }}>{noPercent.toFixed(0)}%</div>
                </div>
                <p className="result-text">はい: {votes.yes}票 / いいえ: {votes.no}票</p>
              </>
            )}
          </div>
        </>
      )}

      {/* ===== アンケート作成ダイアログ ===== */}
      {createOpen && (
        <>
          <div className="dialog-overlay" onClick={() => setCreateOpen(false)} />
          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setCreateOpen(false)}>×</button>
            <h3>アンケートを作成</h3>

            {/* 質問入力 */}
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="質問を入力してください"
              className="mb-2 p-2 border rounded w-full"
            />

            {/* 選択肢1 */}
            <input
              type="text"
              value={option1}
              onChange={(e) => setOption1(e.target.value)}
              placeholder="選択肢1"
              className="mb-2 p-2 border rounded w-full"
            />

            {/* 選択肢2 */}
            <input
              type="text"
              value={option2}
              onChange={(e) => setOption2(e.target.value)}
              placeholder="選択肢2"
              className="mb-4 p-2 border rounded w-full"
            />

            {/* 作成ボタン */}
            <button
              onClick={createPoll}
              className="submit-btn w-full"
            >
              作成
            </button>
          </div>
        </>
      )}


      {/* ===== 意見投稿ダイアログ ===== */}
      {postOpen && (
        <>
          <div className="dialog-overlay" onClick={() => setPostOpen(false)} />
          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setPostOpen(false)}>×</button>
            <h3>意見を投稿</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="お店についての意見を入力..."
            />
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                placeholder="#ハッシュタグ"
              />
              <button onClick={addTag} className="add-btn">追加</button>
            </div>
            <div className="tags">
              {tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
            <button
              onClick={() => {
                setPostOpen(false);
                setText("");
                setTags([]);
              }}
              className="submit-btn"
            >
              投稿する
            </button>
          </div>
        </>
      )}
    </div>
  );
}

