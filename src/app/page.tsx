"use client"

import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import OpinionMap from "../components/map/OpinionMap";
import PollMap from "../components/map/PollMap";
import StoreMap from "../components/map/StoreMap";
import {
  createOpinion,
  createQuestion,
  createStore,
  getAllQuestions,
  answerQuestion,
  getAllTags,
  getAllOpinions,
  getUserAndStoreDetails
} from "@/actions/db_access";

export default function Home() {
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  // Map Statuses
  const mapStatuses = ['opinion', 'poll', 'store'] as const;
  const [mapStatus, setMapStatus] = useState<typeof mapStatuses[number]>('store');
  const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null);

  // ====== 共通データ States ======
  const [questions, setQuestions] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<any[]>([]);
  const [tags, setTags] = useState([{ value: "", label: "タグを選択" }]);

  // ====== アンケート回答 States ======
  // 結果表示
  const [showResult, setShowResult] = useState(false);

  const [answerPollOpen, setAnswerPollOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // ====== メニュー・状態 ======
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // ====== router ======
  const router = useRouter();

  // ====== 意見投稿 States ======
  const [postOpen, setPostOpen] = useState(false);
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const genres = ["商品", "値段", "ボリューム", "満足", "その他"];

  // ====== アンケート作成 States ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [optionOne, setOptionOne] = useState("");
  const [optionTwo, setOptionTwo] = useState("");

  // ====== 出店登録 States ======
  const [storeRegisterOpen, setStoreRegisterOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({ storeName: "", description: "", address: "" });

  // ====== 絞り込み ======
  const [selectedFilter, setSelectedFilter] = useState("キッチンカー");
  const [filter, setFilter] = useState("");

  // ====== 投稿・アンケート開閉 ======
  const handleOpinionTransition = (data: string, pos: { lat: number, lng: number }) => {
    setLatLng(pos);

    if (!session) {  // 未ログインなら
      setShowLoginPrompt(true);
      return;
    }

    if (data === "post") setPostOpen(true);
    if (data === "poll") setCreateOpen(true);
  };

  // ====== 絞り込みジャンル ======
  const [searchActive, setSearchActive] = useState(false);

  // ====== 意見抽出シート ======
  const [extractedOpinions, setExtractedOpinions] = useState<string[]>([]);
  const [showExtractPanel, setShowExtractPanel] = useState(false);
  const handleExtract = (opinions: string[]) => {
    setExtractedOpinions(opinions);
    setShowExtractPanel(true);
  };

  // 1. ログイン状態チェック
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
    };
    checkLoginStatus();
    window.addEventListener('focus', checkLoginStatus);
    return () => { window.removeEventListener('focus', checkLoginStatus); };
  }, []);

  // 2. データ取得
  useEffect(() => {
    async function fetchData() {
      const resultQ = await getAllQuestions();
      if (resultQ.success && resultQ.questions) setQuestions(resultQ.questions);
      else console.error(resultQ.error);

      const resultO = await getAllOpinions();
      if (resultO.success && resultO.opinions) setOpinions(resultO.opinions);
      else console.error(resultO.error);

      // タグ取得
      const resultT = await getAllTags();
      if (resultT.success && resultT.tags) setTags([{ value: "", label: "タグを選択" }, ...resultT.tags]);
      else console.error(resultT.error);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (session?.user) {
      console.log("Account ID:", session.user.accountId);
      console.log("Store ID:", session.user.storeId);
    }
  }, [session]);

  // 3. ログイン詳細情報取得ログ
  useEffect(() => {
    const currentAccountId = session?.user?.accountId;
    if (status === 'authenticated' && currentAccountId) {
      async function fetchUserDetails() {
        const result = await getUserAndStoreDetails(currentAccountId!);
        if (result.success && result.account) {
          console.log("User Info:", result.account.user);
          console.log("Store Info:", result.account.store);
        } else {
          console.error("ユーザー詳細情報の取得に失敗しました:", result.error);
        }
      }
      fetchUserDetails();

    }
  }, [session, status]);

  // --- Store Handlers ---
  const handleStoreRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStoreForm({ ...storeForm, [e.target.name]: e.target.value });
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = session?.user?.email;
    if (!email) {
      alert("認証情報が見つかりません。再度ログインしてください。");
      router.push("/login");
      return;
    }
    const { storeName, description, address } = storeForm;
    if (!storeName || !description) {
      alert("店舗名と店舗の紹介は必須です。");
      return;
    }
    const formData = new FormData();
    formData.append('storeName', storeName);
    formData.append('description', description);
    formData.append('address', address);

    const result = await createStore(formData, email);
    if (result.success) {
      alert("出店登録が完了しました！");
      setStoreRegisterOpen(false);
      setStoreForm({ storeName: "", description: "", address: "" });
      window.location.reload();
    } else {
      alert(`登録失敗: ${result.error}`);
    }
  };

  // --- Opinion Handlers ---
  const handleOpinionSubmit = async () => {
    const accountId = session?.user?.accountId;
    if (!accountId) {
      alert("ログインしているか確認してください。");
      return;
    }
    if (!text || !latLng || !selectedTag || selectedTag === "") {
      alert("コメント、場所、タグは必須です。");
      return;
    }
    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('commentText', text);
    formData.append('latitude', latLng.lat.toString());
    formData.append('longitude', latLng.lng.toString());
    formData.append('tagValue', selectedTag);

    const result = await createOpinion(formData);
    if (result.success) {
      // alert("意見の投稿が完了しました！");
      setPostOpen(false);
      setText("");
      setSelectedTag("");
      const fetchResult = await getAllOpinions();
      if (fetchResult.success && fetchResult.opinions) setOpinions(fetchResult.opinions);
    } else {
      alert(`意見投稿に失敗しました: ${result.error}`);
    }
  };

  // --- Answer Handlers ---
  const handleAnswerClick = (question: any) => {
    if (!session?.user?.accountId) {
      // alert("ログインしているか確認してください。");
      return;
    }
    setSelectedQuestion(question);
    setSelectedOption(null);
    setAnswerPollOpen(true);
  };

  const handleAnswerSubmit = async () => {
    if (!session?.user?.accountId || !selectedQuestion || selectedOption === null) {
      alert("回答情報が不完全です。");
      return;
    }
    const accountId = session.user.accountId;
    const questionId = selectedQuestion.questionId;

    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('questionId', questionId);
    formData.append('selectedOptionNumber', selectedOption.toString());

    const result = await answerQuestion(formData);
    if (result.success) {
      // alert("アンケートに回答しました！");
      setAnswerPollOpen(false);
      // 結果表示ダイヤログを呼ぶ
      setShowResult(true);
      const fetchResult = await getAllQuestions();
      if (fetchResult.success && fetchResult.questions) setQuestions(fetchResult.questions);
    } else {
      alert(`回答に失敗しました: ${result.error}`);
    }
  };

  // --- Poll Creation Handlers ---
  const createPoll = async () => {
    const storeId = session?.user?.storeId;
    if (!storeId) {
      // alert("出店者としてログインしているか確認してください。");
      return;
    }
    if (!newQuestion || !optionOne || !optionTwo || !latLng) {
      alert("質問、選択肢、現在地情報が不完全です。");
      return;
    }
    const formData = new FormData();
    formData.append('storeId', storeId);
    formData.append('questionText', newQuestion);
    formData.append('option1Text', optionOne);
    formData.append('option2Text', optionTwo);
    formData.append('latitude', latLng.lat.toString());
    formData.append('longitude', latLng.lng.toString());

    const result = await createQuestion(formData);
    if (result.success) {
      // alert("アンケートの作成が完了しました！");
      setCreateOpen(false);
      setNewQuestion("");
      setOptionOne("");
      setOptionTwo("");
      const fetchResult = await getAllQuestions();
      if (fetchResult.success && fetchResult.questions) setQuestions(fetchResult.questions);
    } else {
      alert(`アンケート作成に失敗しました: ${result.error}`);
    }
  }

  // --- Map Handlers ---
  const handleDialogOpen = (data: string, takeLatLng?: { lat: number, lng: number }) => {

    if (!session) {//ログインしてなかったらログインに誘導
      setShowLoginPrompt(true);
      return;
    }

    if (takeLatLng) {
      setLatLng(takeLatLng);
      switch (data) {
        case ("post"): setPostOpen(true); break;
        case ("poll"): setCreateOpen(true); break;
      }
    };
    setAnswerPollOpen(true);
    setSelectedQuestion(questions.find(q => q.questionId === data))
  }
  // const handleLogin = () => router.push("/login");
  // const handleLogout = () => {
  //   localStorage.removeItem("isLoggedIn");
  //   setIsLoggedIn(false);
  //   setMenuOpen(false);
  //   alert("ログアウトしました");
  // };

  const FILTER_ITEMS = [
    { label: "キッチンカー", key: "store" },
    { label: "アンケート", key: "poll" },
    { label: "意見", key: "opinion" },
  ] as const;

  const mapList = {
    opinion: (
      <OpinionMap
        opinions={opinions}
        onDialogOpen={handleDialogOpen}
        onExtract={handleExtract}
      />),
    poll: <PollMap questions={questions} onDialogOpen={handleDialogOpen} />,
    store: <StoreMap />
  };
  // スクロールバーを表示しない
  useEffect(() => {
    if (menuOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
  }, [menuOpen]);

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

      {/* 検索の絞り込みボタン */}
      {searchActive && (
        <div className="bg-white px-3 py-2 shadow-md overflow-x-auto flex gap-2">
          {genres.map((tag) => (
            <div
              key={tag}
              onClick={() => setFilter(tag)}
              className="px-3 py-1 bg-gray-200 rounded-full text-sm whitespace-nowrap cursor-pointer hover:bg-gray-300"
            >
              {tag}
            </div>
          ))}



          <div className="flex gap-2 overflow-x-auto mb-4">
            {genres.map((tag) => (
              <div
                key={tag}
                onClick={() => setFilter(tag)}
                className="px-3 py-2 bg-gray-200 rounded-full text-sm whitespace-nowrap"
              >
                {tag}
              </div>
            ))}
          </div>

          {/* 絞り込み結果リスト（仮） */}
          {/* <div>
            {filteredSpots?.map((spot) => (
              <div key={spot.id} className="p-2 border-b">{spot.name}</div>
            ))}
          </div> */}
        </div>
      )
      }


      {/* ===== ハンバーガーメニュー ===== */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul className="text-gray-800 text-lg">
          <li className="border-b p-3 hover:bg-gray-100 cursor-pointer" onClick={() => router.push("/profile_user")}>
            プロフィール
          </li>
          <li className="border-b p-3 hover:bg-gray-100">マイ投稿</li>
          {/* 店舗ログインなら表示 todo*/}
          {/* {storeId && ( */}
          <li
            className="border-b p-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/register")}
          >
            出店登録
          </li>

          {!session ? (
            <li className="border-b p-3 hover:bg-gray-100 text-blue-600 cursor-pointer" onClick={() => router.push("/login")}>
              ログイン
            </li>
          ) : (
            <li className="border-b p-3 hover:bg-gray-100 text-red-600 cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
              ログアウト
            </li>
          )}
        </ul>
      </div>

      {/*ログイン画面下から出す*/}
      {
        showLoginPrompt && (
          <>
            {/* 背景オーバーレイ */}
            <div
              className="dialog-overlay"
              onClick={() => setShowLoginPrompt(false)}
            />
            {/* ログインモーダル */}
            <div className="login-prompt-dialog">
              <h1 className="login-title">Kitchen Link</h1>

              <button
                className="login-btn"
                onClick={() => signIn("google", { callbackUrl: "/user" })}
              >
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
        )
      }

      {/* オーバーレイ */}
      {
        menuOpen && (
          <div
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          ></div>
        )
      }

      {/* マップ */}
      <div className="map-wrapper">
        {mapList[mapStatus]}
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
      </div>

      {/* ===== ダイアログ ===== */}

      {/* ===== ★ 必須: アンケート回答ダイアログ (新設) ★ ===== */}
      {/* ★ 表示条件を answerPollOpen と selectedQuestion に修正 ★ */}
      {answerPollOpen && selectedQuestion && (
        <>
          <div className="dialog-overlay" onClick={() => setAnswerPollOpen(false)} />
          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setAnswerPollOpen(false)}>×</button>
            <h3 className="text-lg font-bold text-gray-800">{selectedQuestion.questionText}</h3>
            <p className="text-sm text-gray-500 mb-3">by {selectedQuestion.storeName}</p>

            <div className="poll-options">
              <button
                onClick={() => setSelectedOption(1)}
                className={`poll-option ${selectedOption === 1 ? "selected left" : "left"
                  }`}
              >
                {selectedQuestion.option1Text}
              </button>
              <button
                onClick={() => setSelectedOption(2)}
                className={`poll-option ${selectedOption === 2 ? "selected right" : "right"
                  }`}
              >
                {selectedQuestion.option2Text}
              </button>
            </div>

            {/* ★ 確認: 回答を送信 ボタンに handleAnswerSubmit が設定されている ★ */}
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedOption === null}
              className={`submit-btn mt-4 ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              回答を送信
            </button>
          </div>
        </>
      )}

      {/* 結果表示ダイヤログ */}
      {showResult && selectedQuestion && (
        <>
          <div className="dialog-overlay" onClick={() => setShowResult(false)} />

          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setShowResult(false)}>
              ×
            </button>

            <h3 className="text-lg font-bold mb-6 text-center">
              投票結果
            </h3>

            {(() => {
              // ===== 仮データ（後でDBに置き換え）=====
              // ===== TODO　DB連携 =====
              const leftCount = 32;
              const rightCount = 18;
              const total = leftCount + rightCount || 1;

              const leftRate = Math.round((leftCount / total) * 100);
              const rightRate = Math.round((rightCount / total) * 100);

              return (
                <div className="result-wrapper">
                  {/* ラベル */}
                  <div className="result-labels">
                    <span className="result-labels-left">{selectedQuestion.option1Text}</span>
                    <span className="result-labels-right">{selectedQuestion.option2Text}</span>
                  </div>

                  {/* グラフ */}

                  <div className="result-bar">
                    {/* 左 */}
                    <div
                      className="result-left"
                      style={{ width: `${leftRate}%` }}
                    >
                      <span className="result-text">
                        {leftRate}%（{leftCount}票）
                      </span>
                    </div>

                    {/* 右 */}
                    <div
                      className="result-right"
                      style={{ width: `${rightRate}%` }}
                    >
                      <span className="result-text">
                        {rightRate}%（{rightCount}票）
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}




      {postOpen && (
        <>
          {/* ===== 意見投稿 ===== */}
          <div
            className="dialog-overlay"
            onClick={() => setPostOpen(false)}
          />
          <div className="poll-dialog active">
            <button
              className="close-btn"
              onClick={() => setPostOpen(false)}
            >
              ×
            </button>

            <h3>意見を投稿</h3>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="お店についての意見を入力..."
            />
            {/* ジャンル選択 */}
            <div className="genre-container">
              選択：
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
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleOpinionSubmit}
                className="submit-btn"
              >
                投稿する
              </button>
            </div>
          </div>
        </>
      )
      }

      {/* アンケート回答画面 todo */}
      {/* {
        pollOpen && (
          <>
            <div className="dialog-overlay" onClick={() => setPollOpen(false)} />
            <div className="poll-dialog active">
              <button className="close-btn" onClick={() => setPollOpen(false)}>×</button>
              <h3>この店にまた来たいですか？</h3>
              <div className="vote-buttons">
                <button className="yes">はい</button>
                <button className="no">いいえ</button>
              </div>
            </div>
          </>
        )
      } */}

      {
        createOpen && (
          <>
            <div className="dialog-overlay" onClick={() => setCreateOpen(false)} />
            <div className="poll-dialog active">
              <button className="close-btn" onClick={() => setCreateOpen(false)}>×</button>
              <h3>アンケートを作成</h3>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="質問を入力"
                className="mb-2 p-2 border rounded w-full"
              />
              <input
                type="text"
                value={optionOne}
                onChange={(e) => setOptionOne(e.target.value)}
                placeholder="選択肢1"
                className="mb-4 p-2 border rounded w-full"
              />
              <input
                type="text"
                value={optionTwo}
                onChange={(e) => setOptionTwo(e.target.value)}
                placeholder="選択肢2"
                className="mb-4 p-2 border rounded w-full"
              />
              <button onClick={() => { if (newQuestion && optionOne && optionTwo) createPoll(); }} className="submit-btn">作成</button>
            </div>
          </>
        )
      }
      {showExtractPanel && (
        <div className="extract-panel">
          <div className="panel-header">
            <span>抽出された意見 ({extractedOpinions.length}件)</span>
            <button onClick={() => setShowExtractPanel(false)}>×</button>
          </div>

          <div className="panel-body">
            {extractedOpinions.length === 0 ? (
              <p className="empty-text">意見がありません</p>
            ) : (
              extractedOpinions.map((op, i) => (
                <div key={i} className="opinion-item">
                  {op}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}