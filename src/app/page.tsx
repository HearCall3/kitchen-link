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

  // ====== アンケート ======
  const [pollOpen, setPollOpen] = useState(false);
  const [votes, setVotes] = useState({ yes: 3, no: 2 });
  const [voted, setVoted] = useState(false);

  // ====== 意見投稿 ======
  const [postOpen, setPostOpen] = useState(false);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState("");

  const handleVote = (option: "yes" | "no") => {
    if (voted) return;
    setVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
    setVoted(true);
  };

  const total = votes.yes + votes.no;
  const yesPercent = total ? (votes.yes / total) * 100 : 0;
  const noPercent = total ? (votes.no / total) * 100 : 0;

  const addTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim())) {
      setTags([...tags, inputTag.trim()]);
      setInputTag("");
    }
  };
  // ====== アンケートを開く ======
  const openPoll = () => setPollOpen(true);


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
          <li className="border-b p-3 hover:bg-gray-100">プロフィール</li>
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


      {/* ===== アンケート答える＆意見投稿　ボタン ===== */}
      <main className="flex-1 p-4">
        <button
          className="action-button"
          onClick={openPoll}
          aria-haspopup="dialog"
          aria-expanded={pollOpen}
          type="button"
        >
          <Image
            src="/icon/アンケート.png"
            width={100}
            height={120}
            alt="アンケート"
          />
        </button>
      </main>
      <button
        onClick={() => setPostOpen(true)}
        className="w-full bg-green-500 text-white p-3 rounded-lg"
      >
        意見を投稿する
      </button>

      {/* ===== アンケートボタンの処理 ===== */}
      {
        pollOpen && (
          <>
            <div className="dialog-overlay" onClick={() => setPollOpen(false)} />
            <div className="poll-dialog active">
              <h3 className="font-bold text-lg mb-3 text-center">
                この店にまた来たいですか？
              </h3>

              {!voted ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVote("yes")}
                    className="flex-1 bg-blue-500 text-white p-3 rounded-lg"
                  >
                    はい
                  </button>
                  <button
                    onClick={() => handleVote("no")}
                    className="flex-1 bg-gray-400 text-white p-3 rounded-lg"
                  >
                    いいえ
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden mb-2">
                    <div
                      className="bg-blue-500 h-6"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-700">
                    はい: {votes.yes}票 ({yesPercent.toFixed(1)}%)
                    いいえ: {votes.no}票 ({noPercent.toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>
          </>
        )
      }

      {/* ===== 意見投稿ボタンの処理 ===== */}
      {
        postOpen && (
          <>
            <div className="dialog-overlay" onClick={() => setPostOpen(false)} />
            <div className="poll-dialog active">
              <h3 className="font-bold text-lg mb-3 text-center">意見を投稿</h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="お店についての意見を入力..."
                className="w-full border p-2 rounded mb-2"
              />
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={inputTag}
                  onChange={(e) => setInputTag(e.target.value)}
                  placeholder="#ハッシュタグ"
                  className="flex-1 border p-2 rounded"
                />
                <button onClick={addTag} className="bg-orange-400 text-white px-3 rounded">
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setPostOpen(false);
                  setText("");
                }}
                className="w-full bg-green-500 text-white p-3 rounded-lg"
              >
                投稿する
              </button>
            </div>
          </>
        )
      }
    </div >
  );
}

