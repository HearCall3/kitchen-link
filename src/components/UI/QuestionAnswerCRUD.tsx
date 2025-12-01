// components/UI/QuestionAnswerCRUD.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Answer {
  accountId: number;
  questionId: number;
  selectedOptionNumber: number; // 1 or 2
  answeredAt: string;
}

const initialFormData = {
  accountId: 1, 
  questionId: 1, 
  selectedOptionNumber: 1,
};

/**
 * QuestionAnswerテーブルのCRUD操作を行うUIコンポーネント
 */
export function QuestionAnswerCRUD() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/answers');
      if (!response.ok) throw new Error('回答の取得に失敗しました');
      const data = await response.json();
      setAnswers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        answeredAt: new Date().toISOString(),
      };
      
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('回答の送信に失敗');
      setFormData(initialFormData);
      await fetchAnswers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: number, questionId: number) => {
    if (!window.confirm(`Account ID: ${accountId}, Question ID: ${questionId} の回答を削除しますか？`)) return;

    setLoading(true);
    setError(null);
    try {
      // APIルート /api/answers/[accountId]/[questionId] を叩く
      const response = await fetch(`/api/answers/${accountId}/${questionId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('削除に失敗');
      await fetchAnswers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">アンケート回答 (QuestionAnswer) CRUD</h1>
      
      {/* CREATE/UPSERT Form */}
      <div className="mb-10 p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">回答 (Create/Update)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">アカウントID</label>
            <input type="number" name="accountId" value={formData.accountId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">アンケートID</label>
            <input type="number" name="questionId" value={formData.questionId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">選択肢番号 (1 or 2)</label>
            <select name="selectedOptionNumber" value={formData.selectedOptionNumber} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">回答を送信/更新</button>
        </form>
      </div>
      
      {/* READ List */}
      <h2 className="text-2xl font-semibold mb-4">回答一覧</h2>
      <div className="space-y-3">
        {answers.map((answer, index) => (
          <div key={index} className="flex justify-between items-start p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-bold text-lg">Account: {answer.accountId} | Question: {answer.questionId}</p>
              <p className="text-gray-800">選択肢: {answer.selectedOptionNumber}</p>
            </div>
            <button onClick={() => handleDelete(answer.accountId, answer.questionId)} disabled={loading} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:bg-gray-400">
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}