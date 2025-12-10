"use client"

import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import OpinionMap from "../components/map/OpinionMap";
import PollMap from "../components/map/PollMap";
import StoreMap from "../components/map/StoreMap";
// データベースアクションをインポート
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
// next-auth から useSession をインポート
import { useSession } from "next-auth/react";


export default function Home() {

  // ★ 修正: useSession から data: session と status を正しく取得
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  // Map Statuses (配列名の衝突を避けるために mapStatuses に変更)
  const mapStatuses = ['opinion', 'poll', 'store'] as const;
  const [mapStatus, setMapStatus] = useState<typeof mapStatuses[number]>('store');

  const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null);

  // ====== 共通データ States ======
  const [questions, setQuestions] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<any[]>([]); // 意見リスト
  const [tags, setTags] = useState([{ value: "", label: "タグを選択" }]); // タグリスト (動的取得)

  // ====== アンケート回答 States ======
  const [answerPollOpen, setAnswerPollOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // ====== メニュー・状態 ======
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // ====== ログイン状態 (localStorage利用はそのまま残す) ======
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ====== 意見投稿 States ======
  const [postOpen, setPostOpen] = useState(false);
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // ====== アンケート作成 States ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [optionOne, setOptionOne] = useState("");
  const [optionTwo, setOptionTwo] = useState("");

  // ====== 出店登録 States ======
  const [storeRegisterOpen, setStoreRegisterOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    description: "",
    address: "",
  });


  // --- useEffects ---

  // 1. ログイン状態チェック
  useEffect(() => {
    // ログイン状態をlocalStorageからチェックし、stateを更新する関数
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
    };
    // ログアウト処理
    const handleLogout = async () => {
      try {
        // localStorageのログイン情報を削除
        localStorage.removeItem("isLoggedIn");

        // Stateを更新してUIを即座に反映
        setIsLoggedIn(false);
        setMenuOpen(false); // メニューを閉じる場合

        // NextAuth のサインアウト（リダイレクトなし）
        await signOut({ redirect: false });

        // Googleアカウントもログアウト
        window.location.href = "https://accounts.google.com/Logout";

        alert("ログアウトしました！");
      } catch (error) {
        console.error("ログアウトエラー:", error);
        alert("ログアウトに失敗しました。");
      }
    };


    // ① コンポーネントが最初に描画された時にチェック
    checkLoginStatus();

    // ② ユーザーがタブ/アプリに戻った時（focusイベント）に再チェック
    window.addEventListener('focus', checkLoginStatus);

    // ③ クリーンアップ関数: コンポーネントが破棄されるときにイベントリスナーを解除
    return () => {
      window.removeEventListener('focus', checkLoginStatus);
    };
  }, []);

  // 2. データ取得: アンケート、意見、タグ (統合)
  useEffect(() => {
    async function fetchData() {
      // アンケート取得
      const resultQ = await getAllQuestions();
      if (resultQ.success && resultQ.questions) {
        setQuestions(resultQ.questions);
      } else {
        console.error(resultQ.error);
      }

      // 意見取得
      const resultO = await getAllOpinions();
      if (resultO.success && resultO.opinions) {
        setOpinions(resultO.opinions);
      } else {
        console.error(resultO.error);
      }

      // タグ取得
      const resultT = await getAllTags();
      if (resultT.success && resultT.tags) {
        setTags([{ value: "", label: "タグを選択" }, ...resultT.tags]);
      } else {
        console.error(resultT.error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (session?.user) {
      console.log("--- ログイン後のセッション情報確認 (Home画面) ---");
      // ...
      console.log("Account ID:", session.user.accountId); // ユーザーアカウントID
      console.log("Store ID:", session.user.storeId);    // 店舗ID
      // ...
    }
  }, [session]);

  // 3. ログイン詳細情報取得ログ
  useEffect(() => {
    const currentAccountId = session?.user?.accountId;

    if (status === 'authenticated' && currentAccountId) {
      console.log("--- ログイン後のセッション情報 (簡易版) ---");
      console.log("Account ID:", currentAccountId);
      console.log("---------------------------------------");

      async function fetchUserDetails() {
        // ! で string | undefined の問題を解決
        const result = await getUserAndStoreDetails(currentAccountId!);

        if (result.success && result.account) {
          console.log("--- ログインユーザーの詳細情報 (DB取得) ---");
          console.log("Account (共通):", result.account);

          if (result.account.user) {
            console.log("User (利用者情報 - 全カラム):", result.account.user);
          }
          if (result.account.store) {
            console.log("Store (出店者情報 - 全カラム):", result.account.store);
          }
          console.log("-----------------------------------------");
        } else {
          console.error("ユーザー詳細情報の取得に失敗しました:", result.error);
        }
      }
      fetchUserDetails();

    } else if (status === 'unauthenticated') {
      console.log("--- ログアウト状態 ---");
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
      alert("認証情報（メールアドレス）が見つかりません。再度ログインしてください。");
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

      // router.reload()のエラー修正済み
      window.location.reload();

    } else {
      alert(`登録失敗: ${result.error}`);
    }
  };


  // --- Opinion Handlers ---
  const handleOpinionSubmit = async () => {

    const accountId = session?.user?.accountId;

    if (!accountId) {
      alert("アカウントIDがセッションから取得できませんでした。ログインしているか確認してください。");
      return;
    }
    if (!text || !latLng || !selectedTag || selectedTag === "") {
      alert("コメント、場所（地図上のピン）、およびタグは必須です。");
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
      alert("意見の投稿が完了しました！");
      setPostOpen(false);
      setText("");
      setSelectedTag("");
      // 投稿成功後、リストを更新
      const fetchResult = await getAllOpinions();
      if (fetchResult.success && fetchResult.opinions) {
        setOpinions(fetchResult.opinions);
      }
    } else {
      alert(`意見投稿に失敗しました: ${result.error}`);
    }
  };


  // --- Answer Handlers ---
  const handleAnswerClick = (question: any) => {
    if (!session?.user?.accountId) {
      alert("アカウントIDがセッションから取得できませんでした。ログインしているか確認してください。");
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

  // ====== アンケート作成 ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  //選択肢（２こ）
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
    const formData = new FormData();
    formData.append('accountId', accountId);
    formData.append('questionId', questionId);
    formData.append('selectedOptionNumber', selectedOption.toString());

    const result = await answerQuestion(formData);

    if (result.success) {
      alert("アンケートに回答しました！");
      setAnswerPollOpen(false);

      const fetchResult = await getAllQuestions();
      if (fetchResult.success && fetchResult.questions) {
        setQuestions(fetchResult.questions);
      }
    } else {
      alert(`回答に失敗しました: ${result.error}`);
    }
  };

  // --- Poll Creation Handlers ---
  const createPoll = async () => {

    const storeId = session?.user?.storeId;

    if (!storeId) {
      alert("ストアIDがセッションから取得できませんでした。出店者としてログインしているか確認してください。");
      return;
    }

    if (!newQuestion || !optionOne || !optionTwo || !latLng || !storeId) {
      alert("質問、選択肢、ストアID、および現在地情報が不完全です。");
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
      alert("アンケートの作成が完了しました！");
      setCreateOpen(false);
      setNewQuestion("");
      setOptionOne("");
      setOptionTwo("");

      const fetchResult = await getAllQuestions();
      if (fetchResult.success && fetchResult.questions) {
        setQuestions(fetchResult.questions);
      }
    } else {
      alert(`アンケート作成に失敗しました: ${result.error}`);
    }

    setNewQuestion("");
    setCreateOpen(false);
    setOptionOne("");
    setOptionTwo("");
  };

  // --- Map Handlers ---
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
  };

  // --- 修正箇所: handleLoginとhandleLogoutの定義を復元/追加 ---
  const handleLogin = () => {
    // ログインページへ遷移
    router.push("/login");
  };

  const handleLogout = () => {
    // ログアウト処理
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false); // stateを即座に更新
    setMenuOpen(false); // メニューを閉じる
    alert("ログアウトしました");
  };


  // ====== 絞り込み ======
  const [selectedFilter, setSelectedFilter] = useState("キッチンカー");
  const [filter, setFilter] = useState("");


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
  console.log("Session user:", session?.user);

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

      {/* ===== ハンバーガーメニュー ===== */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setStoreRegisterOpen(true)}></div>
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
          {/* 店舗ログイン */}
          {session?.user?.role === "store" && (
            <li
              className="border-b p-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push("/register")}
            >
              出店登録
            </li>
          )}


          {!session ? (
            <li
              className="border-b p-3 hover:bg-gray-100 text-blue-600 cursor-pointer"
              onClick={() => signIn("google", { callbackUrl: "/login" })}
            >
              ログイン
            </li>
          ) : (
            <li
              className="border-b p-3 hover:bg-gray-100 text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              ログアウト
            </li>
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

      {/* ==== オーバーレイ（背景クリックで閉じる） ==== */}
      {
        menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-30"
            onClick={() => setMenuOpen(false)}
          ></div>
        )
      }

      {/* マップ */}
      <div className="map-wrapper">
        {mapList[mapStatus]}
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
      </div>

      {/* ===== ダイアログ ===== */}
      {
        pollOpen && (
          <>
            {/* アンケート回答画面 */}
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
        )
      }
      {
        createOpen && (
          <>
            {/* アンケート作成 */}
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
        )
      }

      {
        postOpen && (
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
              {/* ジャンル選択UI */}
              <div className="genre-container">
                選択：
                {genres.map((g) => (
                  <button
                    key={g}
                    className={`genre-btn ${selectedGenres.includes(g) ? "selected" : ""
                      }`}
                    onClick={() => {
                      if (selectedGenres.includes(g)) {
                        setSelectedGenres(
                          selectedGenres.filter((item) => item !== g)
                        );
                      } else {
                        setSelectedGenres([...selectedGenres, g]);
                      }
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    console.log("投稿する:", {
                      text,
                      genres: selectedGenres,
                    });
                    setPostOpen(false);
                  }}
                  className="submit-btn"
                >
                  投稿する
                </button>
              </div>
            </div>
          </>
        )
      }
    </div >
  );     
}
