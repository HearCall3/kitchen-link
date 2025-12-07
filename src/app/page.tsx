"use client"

import './style.css';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
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
  const router = useRouter();

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
  const [optionOne, setOptionOne] = useState("");
  const [optionTwo, setOptionTwo] = useState("");


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
          {/* ログインしたら「ログアウト」
          未ログインなら「ログイン」 */}
          {!isLoggedIn ? (
            <li
              className="border-b p-3 hover:bg-gray-100 text-blue-600 cursor-pointer"
              onClick={handleLogin}
            >
              ログイン
            </li>
          ) : (
            <li
              className="border-b p-3 hover:bg-gray-100 text-blue-600 cursor-pointer"
              onClick={handleLogout}
            >
              ログアウト
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
        {/* <button className="submit-btn flex flex-col items-center" onClick={openPoll}>
          アンケートに回答する
        </button> */}

        <button onClick={() => setPostOpen(true)} className="submit-btn">
          意見を投稿する
        </button>
      </div>

      {/* ===== ★ 追加: アンケート一覧表示エリア ★ ===== */}
      <div className="p-4 pt-0">
        <h3 className="text-lg font-bold mb-3 text-gray-700 border-b pb-1">公開中のアンケート</h3>
        {questions.length === 0 ? (
          <p className="text-gray-500">現在、公開されているアンケートはありません。</p>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <div key={q.questionId} className="p-3 border rounded-lg shadow-sm bg-white">
                <p className="text-sm text-gray-500">店舗名: {q.storeName}</p>
                <p className="font-semibold text-base mb-2">{q.questionText}</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>1. {q.option1Text}</span>
                    <span className="font-mono text-blue-600">{q.option1Count} 票</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. {q.option2Text}</span>
                    <span className="font-mono text-blue-600">{q.option2Count} 票</span>
                  </div>
                </div>
                <p className="text-xs text-right text-gray-400 mt-2">合計 {q.totalAnswers} 回答</p>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleAnswerClick(q)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    回答する
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ★ 必須: アンケート回答ダイアログ (新設) ★ ===== */}
      {/* ★ 表示条件を answerPollOpen と selectedQuestion に修正 ★ */}
      {answerPollOpen && selectedQuestion && (
        <>
          <div className="dialog-overlay" onClick={() => setAnswerPollOpen(false)} />
          <div className="poll-dialog active">
            <button className="close-btn" onClick={() => setAnswerPollOpen(false)}>×</button>
            <h3 className="text-lg font-bold text-gray-800">{selectedQuestion.questionText}</h3>
            <p className="text-sm text-gray-500 mb-3">by {selectedQuestion.storeName}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedOption(1)}
                className={`p-3 border rounded-lg transition duration-150 ${selectedOption === 1 ? 'bg-green-100 border-green-500 font-bold' : 'bg-white hover:bg-gray-50'
                  }`}
              >
                {selectedQuestion.option1Text}
              </button>
              <button
                onClick={() => setSelectedOption(2)}
                className={`p-3 border rounded-lg transition duration-150 ${selectedOption === 2 ? 'bg-green-100 border-green-500 font-bold' : 'bg-white hover:bg-gray-50'
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
                  onClick={handleOpinionSubmit}
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
