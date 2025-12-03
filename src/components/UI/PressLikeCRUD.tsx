// components/UI/PressLikeCRUD.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// APIが返すいいねの総数を表示するため、ここでは簡易的な型定義を使用
interface LikeInfo {
  opinionId: number;
  count: number;
}

const initialFormData = {
  accountId: 1, 
  opinionId: 1, 
};

/**
 * PressLikeテーブルのCRUD操作を行うUIコンポーネント
 */
export function PressLikeCRUD() {
  const [likeCount, setLikeCount] = useState<LikeInfo | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLikeCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // /api/like は暫定的に意見ID 1のいいね総数を返す
      const response = await fetch('/api/like');
      if (!response.ok) throw new Error('いいね情報の取得に失敗しました');
      const data = await response.json();
      setLikeCount(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikeCount();
  }, [fetchLikeCount]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // いいねの作成 (POST)
  const handleLike = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        accountId: formData.accountId,
        postAnOpinionId: formData.opinionId,
      };
      
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
          setError('既にいいね済みです。');
      } else if (!response.ok) {
          throw new Error('いいねの追加に失敗');
      } else {
        await fetchLikeCount(); // カウントを更新
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // いいねの削除 (DELETE)
  const handleUnlike = async () => {
    if (!window.confirm(`Account ID: ${formData.accountId} は Opinion ID: ${formData.opinionId} へのいいねを取り消しますか？`)) return;

    setLoading(true);
    setError(null);
    try {
      // APIルート /api/like/[opinionId]/[accountId] を叩く
      const response = await fetch(`/api/like/${formData.opinionId}/${formData.accountId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('いいねの取り消しに失敗');
      await fetchLikeCount();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">いいね (PressLike) CRUD</h1>
      
      {/* データの表示 */}
      {likeCount && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg mb-6">
          <p className="font-semibold">Opinion ID {likeCount.opinionId} のいいね総数: {likeCount.count}</p>
        </div>
      )}

      {/* CREATE / DELETE Form */}
      <div className="mb-10 p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">いいね操作</h2>
        <form onSubmit={handleLike} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">アカウントID</label>
            <input type="number" name="accountId" value={formData.accountId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">意見投稿ID</label>
            <input type="number" name="opinionId" value={formData.opinionId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="flex space-x-4">
            <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">いいね！(追加)</button>
            <button type="button" onClick={handleUnlike} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400">いいねを取り消し</button>
          </div>
        </form>
      </div>
    </div>
  );
}