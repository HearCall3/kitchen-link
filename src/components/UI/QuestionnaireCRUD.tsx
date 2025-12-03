// components/UI/QuestionnaireCRUD.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuestionAnswerCRUD } from './QuestionAnswerCRUD'; // 既存の回答UIをインポート

type Tab = 'create' | 'answer_list';

// Questionフォームの初期状態
const initialQuestionData = {
  storeId: 101, // 仮のストアID
  latitude: 35.6,
  longitude: 139.7,
  questionText: '',
  option1Text: '',
  option2Text: '',
};

interface Question {
  questionId: number;
  questionText: string;
  storeId: number;
  latitude: number;
  longitude: number;
  option1Text: string;
  option2Text: string;
}

/**
 * アンケート作成 (Question) と回答 (QuestionAnswer) を統合したUIコンポーネント
 */
export function QuestionnaireCRUD() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionFormData, setQuestionFormData] = useState(initialQuestionData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // データ取得ロジック
  // ----------------------------------------------------------------

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('アンケート一覧の取得に失敗しました');
      const data = await response.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 回答/一覧タブがアクティブになったときにデータを取得
    if (activeTab === 'answer_list') {
      fetchQuestions();
    }
  }, [activeTab, fetchQuestions]);

  // ----------------------------------------------------------------
  // アンケート作成 (CREATE) ロジック
  // ----------------------------------------------------------------

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestionFormData((prev) => ({
      ...prev,
      [name]: name === 'storeId' || name === 'latitude' || name === 'longitude' ? Number(value) : value,
    }));
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionFormData),
      });

      if (!response.ok) throw new Error('アンケートの作成に失敗しました。');

      setMessage('✅ アンケートの作成に成功しました！');
      setQuestionFormData(initialQuestionData);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // アンケート削除 (DELETE) ロジック
  // ----------------------------------------------------------------

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm(`ID: ${id} のアンケートを削除しますか？ (関連する回答も削除されます)`)) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('アンケートの削除に失敗しました。');

      setMessage('✅ アンケートの削除に成功しました！');
      await fetchQuestions(); // リストを更新

    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  // ----------------------------------------------------------------
  // レンダリング関数
  // ----------------------------------------------------------------

  const renderCreateTab = () => (
    <div className="p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-semibold mb-4">アンケート作成 (Store操作)</h2>
      <form onSubmit={handleQuestionSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">ストアID (必須)</label>
          <input type="number" name="storeId" value={questionFormData.storeId} onChange={handleQuestionChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">質問内容 (必須)</label>
          <textarea name="questionText" value={questionFormData.questionText} onChange={handleQuestionChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">選択肢 1 テキスト (必須)</label>
          <input type="text" name="option1Text" value={questionFormData.option1Text} onChange={handleQuestionChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">選択肢 2 テキスト (必須)</label>
          <input type="text" name="option2Text" value={questionFormData.option2Text} onChange={handleQuestionChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
          {loading ? '作成中...' : 'アンケートを作成'}
        </button>
      </form>
    </div>
  );

  const renderAnswerListTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">既存アンケートへの回答 (User操作)</h2>
      
      {/* 既存のアンケート回答UI (QuestionAnswerCRUD) を再利用 */}
      <QuestionAnswerCRUD />

      <h2 className="text-2xl font-semibold mt-8">全アンケートの管理/削除</h2>
      <div className="space-y-3">
        {questions.length === 0 && !loading && <p>まだ作成されたアンケートはありません。</p>}
        {questions.map((q) => (
          <div key={q.questionId} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-bold text-lg">ID: {q.questionId} (Store: {q.storeId})</p>
              <p className="text-gray-800 break-words mt-1">{q.questionText}</p>
              <p className="text-sm text-gray-500 mt-1">選択肢: "{q.option1Text}" / "{q.option2Text}"</p>
            </div>
            <button 
              onClick={() => handleDeleteQuestion(q.questionId)}
              disabled={loading}
              className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:bg-gray-400 flex-shrink-0"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">アンケート管理</h1>
      
      {/* タブ切り替え */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 text-lg font-medium transition-colors duration-150 ${
            activeTab === 'create' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 アンケート作成
        </button>
        <button
          onClick={() => setActiveTab('answer_list')}
          className={`px-4 py-2 text-lg font-medium transition-colors duration-150 ${
            activeTab === 'answer_list' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🗳️ 回答と一覧管理
        </button>
      </div>

      {loading && <p className="text-yellow-600">データ処理中...</p>}
      {message && <p className="text-green-600 border border-green-600 p-2 rounded mb-4">{message}</p>}
      {error && <p className="text-red-600 border border-red-600 p-2 rounded mb-4">🛑 {error}</p>}

      {/* タブ内容の表示 */}
      {activeTab === 'create' ? renderCreateTab() : renderAnswerListTab()}
    </div>
  );
}