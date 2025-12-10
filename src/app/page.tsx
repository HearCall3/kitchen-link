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
  getAllQuestions,
  answerQuestion,
  getAllTags
} from "@/actions/db_access";
// next-auth から useSession をインポート
import { useSession } from "next-auth/react";


export default function Home() {

  // セッションからメールアドレスを取得
  const { data: session } = useSession();
  const email = session?.user?.email;

  // return (
  //   <Test />
  // )

  const status = ['opinion', 'poll', 'store'] as const;
  const [mapStatus, setMapStatus] = useState<typeof status[number]>('store');

  const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null);

  // ★ 追加: 回答ダイアログの状態と現在回答中の質問を保持するState  
  const [questions, setQuestions] = useState<any[]>([]);
  const [answerPollOpen, setAnswerPollOpen] = useState(false); // 新しい回答ダイアログの開閉
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null); // 現在回答中の質問
  const [selectedOption, setSelectedOption] = useState<number | null>(null); // 選択された回答

  // ====== メニュー・状態 ======
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // ====== ログイン状態 ======
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // ★ 追加: アンケートリストをフェッチする useEffect
  useEffect(() => {
    async function fetchQuestions() {
      const result = await getAllQuestions();
      if (result.success && result.questions) {
        setQuestions(result.questions);
      } else {
        console.error(result.error);
      }
    }
    fetchQuestions();
  }, []); // ページロード時に一度だけ実行

  useEffect(() => {
    if (session?.user) {
        console.log("--- ログイン後のセッション情報確認 (Home画面) ---");
        // ...
        console.log("Account ID:", session.user.accountId); // ユーザーアカウントID
        console.log("Store ID:", session.user.storeId);    // 店舗ID
        // ...
    }
}, [session]);

useEffect(() => {
    async function fetchTags() {
        const result = await getAllTags();
        if (result.success && result.tags) {
            // プレースホルダーと結合
            setTags([{ value: "", label: "タグを選択" }, ...result.tags]);
        } else {
            console.error(result.error);
            // 失敗した場合でも、最低限プレースホルダーは表示
            setTags([{ value: "", label: "タグを選択" }]);
        }
    }
    fetchTags();
}, []); // ページロード時に一度だけ実行


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

  // ★ 追加: 回答ボタンクリックハンドラー
  const handleAnswerClick = (question: any) => {
    if (!session?.user?.accountId) {
      alert("アカウントIDがセッションから取得できませんでした。ログインしているか確認してください。");
      return;
    }

    // ダイアログを開く
    setSelectedQuestion(question);
    setSelectedOption(null);
    setAnswerPollOpen(true);
  };


  // ★ 2. 回答ダイアログ内の「回答を送信」ボタンが実行する関数 ★
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

    // サーバーアクションを呼び出し
    const result = await answerQuestion(formData);

    if (result.success) {
      alert("アンケートに回答しました！");
      setAnswerPollOpen(false);

      // アンケートリストを再取得
      const fetchResult = await getAllQuestions();
      if (fetchResult.success && fetchResult.questions) {
        setQuestions(fetchResult.questions);
      }
    } else {
      alert(`回答に失敗しました: ${result.error}`);
    }
  };

  // ★  意見投稿ハンドラー ★
  const handleOpinionSubmit = async () => {

    // accountIdの取得
    const accountId = session?.user?.accountId;
    

    // クライアント側での必須チェック
    // selectedTagが初期値("")でないことを確認
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
    formData.append('tagValue', selectedTag); // ★ タグのvalueを渡す ★

    // サーバーアクションを呼び出し
    const result = await createOpinion(formData);

    if (result.success) {
      alert("意見の投稿が完了しました！");

      // 成功時の状態リセット
      setPostOpen(false);
      setText("");
      setSelectedTag("");
    } else {
      alert(`意見投稿に失敗しました: ${result.error}`);
    }
  };

  // ====== 絞り込み ======
  const [selectedFilter, setSelectedFilter] = useState("キッチンカー");
  const [filter, setFilter] = useState("");

  
  // ====== 意見投稿 ======
const [postOpen, setPostOpen] = useState(false); // ★ 意見投稿ダイアログの開閉
const [text, setText] = useState(""); // ★ 意見コメント

  const [tags, setTags] = useState([
    { value: "", label: "タグを選択" }, // 初期選択肢（プレースホルダー）
]);

  // プルダウンで選択されたタグを保持する新しいstate
  const [selectedTag, setSelectedTag] = useState("");


  // ====== アンケート作成 ======
  const [createOpen, setCreateOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  //選択肢（２こ）
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");


  const createPoll = async () => {

    const storeId = session?.user?.storeId;

    if (!storeId) {
      alert("ストアIDがセッションから取得できませんでした。出店者としてログインしているか確認してください。");
      return; // ストアIDがない場合は処理を中断
    }

    // クライアント側での必須チェック
    if (!newQuestion || !optionOne || !optionTwo || !latLng || !storeId) {
      alert("質問、選択肢、ストアID、および現在地情報が不完全です。");
      return;
    }

    // FormDataを作成し、必要なデータを格納
    const formData = new FormData();
    formData.append('storeId', storeId);
    formData.append('questionText', newQuestion);
    formData.append('option1Text', optionOne);
    formData.append('option2Text', optionTwo);
    formData.append('latitude', latLng.lat.toString());
    formData.append('longitude', latLng.lng.toString());

    // サーバーアクションを呼び出し
    const result = await createQuestion(formData); //

    if (result.success) {
      alert("アンケートの作成が完了しました！");

      // 成功時の状態リセット
      setCreateOpen(false);
      setNewQuestion("");
      setOptionOne("");
      setOptionTwo("");

      // ★ 追加: アンケートリストを再取得して表示を更新
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
