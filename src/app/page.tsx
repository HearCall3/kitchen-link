"use client";

import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OpinionMap from "../components/map/OpinionMap";
import PollMap from "../components/map/PollMap";
import StoreMap from "../components/map/StoreMap";
import Test from "./db/page"

export default function Home() {
  const router = useRouter();
  // return (
  //   <Test />
  // )

  const status = ['opinion', 'poll', 'store'] as const;
  const [mapStatus, setMapStatus] = useState<typeof status[number]>('store');

  const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null)

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

  // --- 意見投稿のセクション（変更後） ---
  const [postOpen, setPostOpen] = useState(false);
  const [text, setText] = useState("");

  const tags = [//意見のタグ
    { value: "", label: "" }, // 初期選択肢（プレースホルダー）
    { value: "react", label: "React" },
    { value: "javascript", label: "JavaScript" },
    { value: "css", label: "CSS" },
    { value: "general", label: "雑談" },
  ];

  // プルダウンで選択されたタグを保持する新しいstate
  const [selectedTag, setSelectedTag] = useState("");

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
  const [optionOne, setOptionOne] = useState("");
  const [optionTwo, setOptionTwo] = useState("");

  const createPoll = async () => {

    alert(newQuestion);
    alert(optionOne);
    alert(optionTwo);
    if (latLng)
      alert(`緯度: ${latLng.lat}, 経度: ${latLng.lng}`);

    //↓は既存のDBに投げる処理
    // if (!newQuestion.trim()) return;

    // const res = await fetch("/api/poll", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ question: newQuestion }),
    // });

    // if (res.ok) {
    //   alert("アンケートを作成しました！");
    setNewQuestion("");
    setCreateOpen(false);
    setOptionOne("");
    setOptionTwo("");
    // }
  };

  const handleDialogOpen = (data: string, takelatLng: { lat: number, lng: number }) => {

    setLatLng(takelatLng)

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
        {mapList[mapStatus]}
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
            <input
              type="text"
              value={optionOne}
              onChange={(e) => setOptionOne(e.target.value)}
              placeholder='回答１'
            >
            </input>
            <input
              type="text"
              value={optionTwo}
              onChange={(e) => setOptionTwo(e.target.value)}
              placeholder='回答2'>
            </input>
            <button onClick={() => {
              if (newQuestion && optionOne && optionTwo)
                createPoll()
            }} className="submit-btn">作成</button>
          </div>
        </>
      )
      }

      {/* ===== 意見投稿ダイアログ ===== */}
      {
        postOpen && (
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
              <div className="form-controls">
                {/* ------------------------------- */}
                {/* プルダウンメニュー (タグ選択) */}
                {/* ------------------------------- */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="select-tag-input" // スタイル調整が必要な場合はclassNameを変更
                  >
                    {/* optionsのリストをレンダリング */}
                    {tags.map((tag) => (
                      <option key={tag.value} value={tag.value}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (selectedTag && text && latLng) {
                      alert(selectedTag);
                      alert(text);
                      if (latLng)
                        alert(`緯度: ${latLng.lat}, 経度: ${latLng.lng}`);
                      setPostOpen(false);
                      setText("");
                      setSelectedTag("");
                      //ここにDBに送る処理
                    }
                  }}
                  className="submit-btn"
                >
                  投稿する
                </button>
              </div>
            </div>
          </>
        )
      }</div >
  )
}