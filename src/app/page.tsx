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
  getUserAndStoreDetails,
  getAllStoreSchedules,
  getQuestionAnswerCounts,
  toggleLike
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

  // ★ 修正 1: スケジュールデータ State の追加 ★
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // ====== アンケート回答 States ======
  // 結果表示
  const [showResult, setShowResult] = useState(false);

  const [answerPollOpen, setAnswerPollOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [pollCounts, setPollCounts] = useState<{ count1: number, count2: number } | null>(null);

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
  const [filters, setFilters] = useState<{
    tag: string | null;
    minLikes: number | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    gender: string | null;
    occupation: string | null;
    ageRange: string | null;
  }>({
    tag: null,
    minLikes: null,
    dateFrom: null,
    dateTo: null,
    gender: null,
    occupation: null,
    ageRange: null,
  });

  // ★ 追加: 実際に検索を実行するためのキーワードState
  const [filterKeyword, setFilterKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [clickedOpinion, setClickedOpinion] = useState<any>(null);
  const [showClickedOpinion, setShowClickedOpinion] = useState(false);

  const [clickedStore, setClickedStore] = useState<any>([]);
  const [showClickedStore, setShowClickedStore] = useState(false);

  const [extractedOpinions, setExtractedOpinions] = useState<string[]>([]);
  const [showExtractPanel, setShowExtractPanel] = useState(false);
  const handleExtract = (type: string, data: []) => {
    if (type === "opinionExtract") {
      setExtractedOpinions(data);
      setShowExtractPanel(true);
    } else if (type === "opinionClick") {
      setClickedOpinion(data);
      setShowClickedOpinion(true);
    } else if (type === "storeClick") {
      setClickedStore(data);
      setShowClickedStore(true);
    }
  };

  // --- Map Handlers ---
  const FILTER_ITEMS = [
    { label: "キッチンカー", key: "store" },
    { label: "アンケート", key: "poll" },
    { label: "意見", key: "opinion" },
  ] as const;

  const [isFilterOpen, setIsFilterOpen] = useState(false);//意見フィルターのダイアログ開閉

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
      // 既存のデータ取得 (Questions, Opinions, Tags) ...
      const resultQ = await getAllQuestions();
      if (resultQ.success && resultQ.questions) setQuestions(resultQ.questions);
      else console.error(resultQ.error);

      const resultO = await getAllOpinions();
      if (resultO.success && resultO.opinions) setOpinions(resultO.opinions);
      else console.error(resultO.error);

      const resultT = await getAllTags();
      if (resultT.success && resultT.tags) setTags([{ value: "", label: "タグを選択" }, ...resultT.tags]);
      else console.error(resultT.error);

      // ★ 修正 2: スケジュールデータの取得と State への格納 ★
      const resultS = await getAllStoreSchedules();
      if (resultS.success && resultS.schedules) {
        setSchedules(resultS.schedules);
        setScheduleError(null);
      } else {
        setSchedules([]);
        setScheduleError(resultS.error || 'スケジュールの取得中に不明なエラーが発生しました。');
        console.error(resultS.error);
      }
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

      // ★ 追加: 回答後、集計結果を取得する ★
      const countsResult = await getQuestionAnswerCounts(questionId);
      if (countsResult.success && countsResult.counts) {
        setPollCounts(countsResult.counts); // 結果をStateに保存
      } else {
        console.error("回答結果の取得に失敗しました:", countsResult.error);
        setPollCounts({ count1: 0, count2: 0 }); // 失敗時は0で初期化
      }

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

  const handleLikeClick = async (opinionId: string) => {
    const accountId = session?.user.accountId
    if (!accountId) {
      alert('ログインしていません。いいねを行うにはログインが必要です。');
      return;
    }

    try {
      const result = await toggleLike(accountId, opinionId);

      if (result.success) {
        const { isLiked, likeCount } = result;

        setOpinions(prevOpinions =>
          prevOpinions.map(op => {
            // 意見IDでマッチング
            if (op.opinionId === opinionId) {

              // 開いている意見パネルの情報を更新
              if (showClickedOpinion && op.opinionId === opinionId) {
                setShowClickedOpinion({
                  ...clickedOpinion,
                  likeCount: likeCount,
                  isLikedByUser: isLiked // ユーザーがいいねしたかどうかの状態も更新
                });
              }

              // 意見リストの当該レコードを更新
              return {
                ...op,
                likeCount: likeCount,
              };
            }
            return op;
          })
        );

      } else {
        alert(result.error || 'いいね処理に失敗しました。');
      }

    } catch (error) {
      console.error('いいね処理中のエラー:', error);
      alert('いいね処理中に予期せぬエラーが発生しました。');
    }

  }

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
    setSelectedQuestion(questions.find(q => q.questionId === data))
    // if(){そのアンケートに回答したことがあるか判定
    // setShowResult(true);回答済みなら結果を表示
    // } else {
    setAnswerPollOpen(true);//未回答なら回答させる
  }

  const formatDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const [appliedFilters, setAppliedFilters] = useState<typeof filters>(filters);

  const mapList = {

    opinion: <OpinionMap opinions={opinions}
      accountId={session?.user.accountId!}
      filter={appliedFilters}
      filterKeyword={searchKeyword}
      onDialogOpen={handleDialogOpen}
      onExtract={handleExtract}
    />,
    poll: <PollMap questions={questions} filterKeyword={searchKeyword} onDialogOpen={handleDialogOpen} />,
    store: <StoreMap schedule={schedules} filterKeyword={searchKeyword} onExtract={handleExtract} />
  };

  // --------------------------------------------------
  // ここで関数を呼び出して出店情報をとってくる＋表示させる
  // --------------------------------------------------
  // ★ 修正 3: スケジュールリストのレンダリング関数を定義 ★
  const renderScheduleList = () => {

    // エラー表示
    if (scheduleError) {
      return <div className="p-4 text-red-600 bg-red-100 border border-red-300">🚨 データ読み込みエラー: {scheduleError}</div>;
    }

    // データなし
    if (!schedules || schedules.length === 0) {
      return <div className="p-4 text-center text-gray-500 bg-gray-50 border-t">📅 現在、出店スケジュールはありません。</div>;
    }

    // リスト表示
    return (
      <div className="schedule-list-container p-4 bg-white border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">📅 今後の出店スケジュール</h2>
        <ul className="space-y-3">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm">
              {/* 日付 (左側) */}
              <div className="date-box font-mono text-lg text-blue-600 font-semibold mr-4 min-w-[100px]">
                {schedule.date}
              </div>
              {/* 情報 (右側) */}
              <div className="info-box flex-1">
                <strong className="block text-base text-gray-900">{schedule.storeName}</strong>
                <p className="text-xs text-gray-500 mt-1">
                  📍
                  {schedule.locationName || '場所未定'}
                  ({schedule.location.lat.toFixed(4)}, {schedule.location.lng.toFixed(4)})
                </p>

                {/* 2. ストア詳細情報（★追加部分） */}
                {/* storeDetailsオブジェクトが存在する場合のみ表示 */}
                {schedule.storeDetails && (
                  <div className="store-details p-2 mt-2 bg-white border border-gray-200 rounded-md">
                    <p className="text-sm font-medium text-gray-700">店舗情報</p>
                    <p className="text-xs text-gray-600 mt-1">
                      🏠 **ストアURL:** {schedule.storeDetails.storeUrl || '未登録'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      📞 **説明:** {schedule.storeDetails.introduction || '未登録'}
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="frame">
      {/* ===== ヘッダー ===== */}
      <header className="flex items-center bg-orange-500 text-white p-3 relative z-50">
        <div className="menuIcon text-2xl mr-3 cursor-pointer" onClick={toggleMenu}>
          {menuOpen ? "✕" : "☰"}
        </div>
        <button
          className="filter-btn"
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filter"
        >フィルター
        </button>
        {/* 修正後のヘッダー内の検索バー部分 */}
        <div className="flex-1 flex bg-white rounded-full overflow-hidden items-center pr-2">
          <input
            type="text"
            placeholder="タグや店名で検索"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="flex-1 p-2 text-gray-700 outline-none"
          />
          {/* ★ 検索ボタンを追加 */}
          <button
            onClick={() => setSearchKeyword(filterKeyword)}
            className="search-btn"
          >
            検索
          </button>
        </div>
      </header>



      {/* ===== ハンバーガーメニュー ===== */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul className="text-gray-800 text-lg">
          {/* 出店者なら出店者プロフィールに行く TODO */}
          <li className="border-b p-3 hover:bg-gray-100 cursor-pointer" onClick={() => router.push("/profile_user")}>
            プロフィール
          </li>
          <li className="border-b p-3 hover:bg-gray-100">マイ投稿</li>
          {/* 店舗ログインなら表示 TODO*/}
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

      {/* ★ 修正 4: マップの下に出店スケジュールリストを呼び出し ★ */}
      <div className="schedule-list-area">
        {/* {renderScheduleList()} */}
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
              const leftCount = pollCounts?.count1 || 0;
              const rightCount = pollCounts?.count2 || 0;
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

      {isFilterOpen && (
        <>
        {/* フィルター */}
          {/* 背景の黒み (クリックで閉じる) */}
          <div
            className="dialog-overlay"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* 中央に表示するパネル (poll-dialog active クラスなどを流用してスタイル統一) */}
          <div className="poll-dialog active" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <button
              className="close-btn"
              onClick={() => setIsFilterOpen(false)}
            >
              ×
            </button>

            <h3 className="text-lg font-bold mb-4">詳細フィルター</h3>

            {/* --- ここから中身は既存の入力フォームと同じ --- */}

            {/* タグ */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">タグの選択</label>
              <select
                className="select-tag"
                value={filters.tag ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tag: e.target.value || null }))
                }
              >
                <option value="">---</option>
                <option value="食品">食品</option>
                <option value="設備">設備</option>
                <option value="値段">値段</option>
                <option value="ボリューム">ボリューム</option>
                <option value="満足">満足</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 性別 */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">性別</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.gender ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, gender: e.target.value || null }))
                }
              >
                <option value="">---</option>
                <option value="男性">男性</option>
                <option value="女性">女性</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 職業 */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">職業</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.occupation ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, occupation: e.target.value || null }))
                }
              >
                <option value="">---</option>
                <option value="学生">学生</option>
                <option value="会社員">会社員</option>
                <option value="アルバイト・パート">アルバイト・パート</option>
                <option value="フリーランス">フリーランス</option>
                <option value="公務員">公務員</option>
                <option value="無職">無職</option>
                <option value="フリーター">フリーター</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 年齢 */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">年齢</label>
              <select
                className="w-full p-2 border rounded"
                value={filters.ageRange ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, ageRange: e.target.value || null }))
                }
              >
                <option value="">---</option>
                <option value="10代">10歳未満</option>
                <option value="20代">20代</option>
                <option value="30代">30代</option>
                <option value="40代">40代</option>
                <option value="50代">50代</option>
                <option value="60代">60代</option>
                <option value="70代">70代</option>
                <option value="80代以上">80代以上</option>
              </select>
            </div>

            {/* 最低いいね数 */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">最低いいね数</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 border rounded"
                value={filters.minLikes ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minLikes: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            {/* 日付（以降） */}
            <div style={{ marginBottom: 10 }}>
              <label className="block text-sm font-bold mb-1">日付（以降）</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={formatDateInput(filters.dateFrom)}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-2 bg-gray-200 rounded border border-gray-300"
                onClick={() =>
                  setFilters({
                    tag: null,
                    gender: null,
                    occupation: null,
                    ageRange: null,
                    minLikes: null,
                    dateFrom: null,
                    dateTo: null,
                  })
                }
              >
                リセット
              </button>
              <button
                className="flex-1 py-2 bg-orange-500 text-white rounded font-bold"
                onClick={() => {
                  setAppliedFilters(filters);
                  setIsFilterOpen(false); // 適用したら閉じる
                }}
              >
                適用
              </button>
            </div>
          </div>
        </>
      )}
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
      {showClickedOpinion && (
        <>
          <div className="extract-panel">
            <div className="panel-header">
              <span>{clickedOpinion.commentText}</span>
              <button onClick={() => setShowClickedOpinion(false)}>×</button>
            </div>
            <div className="panel-body">
              <p>いいね数：{clickedOpinion.likeCount}</p>
              <p>タグ：{clickedOpinion.tags}</p>
              <p>投稿時刻：{clickedOpinion.postedAt.toLocaleString()}</p>
              <p>性別：{clickedOpinion?.profile.gender}</p>
              <p>年齢：{clickedOpinion?.profile.age}</p>
              <p>職業：{clickedOpinion?.profile.occupation}</p>
              <button
                className="like-button"
                onClick={() => handleLikeClick(clickedOpinion.opinionId)}
              >
                いいね
              </button>
            </div>
          </div>
        </>
      )
      }
      {showClickedStore && (
        <div className="extract-panel">
          <div className="panel-header">
            <span>{clickedStore.storeName}</span>
            <button onClick={() => setShowClickedStore(false)}>×</button>
          </div>
          <div className="panel-body">
            <p>ストアURL：{clickedStore?.storeDetails?.storeUrl || '未登録'}</p>
            <p>説明:{clickedStore?.storeDetails?.introduction || '未登録'}</p>
          </div>
        </div>
      )
      }
    </div>
  )
}