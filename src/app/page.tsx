"use client";
import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  // ====== メニュー・状態 ======
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // ====== ログイン状態 ======
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setMenuOpen(false);
    alert("ログアウトしました");
  };

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
  // ====== アンケート ======
  const [pollOpen, setPollOpen] = useState(false);
  const [votes, setVotes] = useState({ yes: 3, no: 2 });
  const [voted, setVoted] = useState(false);

  const handleVote = (option: "yes" | "no") => {
    if (voted) return;
    setVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
    setVoted(true);
  };

  // ←ここなら OK！
  const currentVotes = votes || { yes: 0, no: 0 };
  const total = currentVotes.yes + currentVotes.no;
  const yesPercent = total ? (currentVotes.yes / total) * 100 : 0;
  const noPercent = total ? (currentVotes.no / total) * 100 : 0;


  // ====== アンケートを開く ======
  const openPoll = () => setPollOpen(true);

  // ====== アンケート作成 ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

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


  return (
    <div className="phone-frame">

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
        {["キッチンカー", "アンケート", "意見"].map((item) => (
          <button
            key={item}
            className={`filter-chip ${selectedFilter === item ? "active" : ""}`}
            onClick={() => setSelectedFilter(item)}
          >
            {item}
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
            onClick={() => router.push("/profile/user")}
          >
            プロフィール
          </li>
          <li className="border-b p-3 hover:bg-gray-100">マイ投稿</li>
          <li className="border-b p-3 hover:bg-gray-100">出店登録</li>
          {!isLoggedIn ? (
            <li
              className="border-b p-3 hover:bg-gray-100 text-blue-600 cursor-pointer"
              onClick={handleLogin}
            >
              {/* todo ログイン中はログアウト、未ログインの場合はログインと表示*/}
              ログイン
            </li>
          ) : (
            <li
              className="border-b p-3 hover:bg-gray-100 text-red-500 cursor-pointer"
              onClick={handleLogout}
            >

            </li>
          )}
        </ul>
      </div>

      {/* ==== オーバーレイ（背景クリックで閉じる） ==== */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* マップ */}
      <div className="map-container z-10 relative">
        地図をここに表示予定
      </div>

      {/* ===== アンケート作成ボタン ===== */}
      <button
        onClick={() => setCreateOpen(true)}
        className="submit-btn mb-2"
      >
        アンケートを作成
      </button>

      {/* ===== アクションボタン ===== */}
      <div className="flex flex-col items-center gap-4 p-4">
        <button className="submit-btn flex flex-col items-center" onClick={openPoll}>
          アンケートに回答する
        </button>

        <button onClick={() => setPostOpen(true)} className="submit-btn">
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
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="質問を入力してください"
            />
            <button onClick={createPoll} className="submit-btn">作成</button>
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