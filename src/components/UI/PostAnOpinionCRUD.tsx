// components/UI/PostAnOpinionCRUD.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// データの型定義
interface Opinion {
  postAnOpinionId: number;
  commentText: string;
  accountId: number;
  latitude: number;
  longitude: number;
  postedAt: string; // ISO Stringで受け取る想定
}

// フォームの初期状態
const initialFormData = {
  accountId: 1, // 仮の値
  latitude: 35.6895, 
  longitude: 139.6917,
  commentText: '',
};

/**
 * PostAnOpinionテーブルのCRUD操作を行うUIコンポーネント
 */
export function PostAnOpinionCRUD() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ一覧の取得 (APIルート /api/opinions を叩く想定)
  const fetchOpinions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/opinions'); 
      if (!response.ok) {
        throw new Error(`意見投稿の取得に失敗しました: ${response.statusText}`);
      }
      const data = await response.json();
      setOpinions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  // フォーム入力の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // 数値フィールドはNumberに変換
      [name]: name === 'accountId' || name === 'latitude' || name === 'longitude' ? Number(value) : value,
    }));
  };

  // 投稿の作成 (APIルート /api/opinions を叩く想定)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        postedAt: new Date().toISOString(), // 投稿日時を追加
      };
      
      const response = await fetch('/api/opinions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // バックエンドからのエラーメッセージがあればそれを使用
        const errorData = await response.json();
        throw new Error(`投稿作成に失敗: ${errorData.message || response.statusText}`);
      }

      setFormData(initialFormData);
      await fetchOpinions(); // リストを更新
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 投稿の削除 (APIルート /api/opinions/[id] を叩く想定)
  const handleDelete = async (id: number) => {
    if (!window.confirm(`ID: ${id} の投稿を削除しますか？`)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/opinions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`投稿の削除に失敗しました: ${response.statusText}`);
      }

      await fetchOpinions(); // リストを更新
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">意見投稿 (PostAnOpinion) CRUD</h1>
      
      {loading && <p className="text-yellow-600">データ処理中...</p>}
      {error && <p className="text-red-600 border border-red-600 p-2 rounded mt-4">エラー: {error}</p>}

      {/* --- CREATE Form --- */}
      <div className="mb-10 p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">新規投稿 (Create)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">アカウントID</label>
            <input
              type="number"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">意見内容</label>
            <textarea
              name="commentText"
              value={formData.commentText}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">緯度</label>
              <input
                type="number"
                name="latitude"
                step="0.0001"
                value={formData.latitude}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">経度</label>
              <input
                type="number"
                name="longitude"
                step="0.0001"
                value={formData.longitude}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? '投稿中...' : '投稿を作成'}
          </button>
        </form>
      </div>

      {/* --- READ List --- */}
      <h2 className="text-2xl font-semibold mb-4">投稿一覧 (Read & Delete)</h2>
      <div className="space-y-3">
        {opinions.length === 0 && !loading && <p>まだ投稿はありません。</p>}
        {opinions.map((opinion) => (
          <div key={opinion.postAnOpinionId} className="flex justify-between items-start p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-bold text-lg">ID: {opinion.postAnOpinionId} (Account: {opinion.accountId})</p>
              <p className="text-gray-800 break-words mt-1">{opinion.commentText}</p>
              <p className="text-xs text-gray-500 mt-2">
                座標: ({opinion.latitude}, {opinion.longitude}) | 投稿日時: {new Date(opinion.postedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleDelete(opinion.postAnOpinionId)}
                disabled={loading}
                className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:bg-gray-400"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}