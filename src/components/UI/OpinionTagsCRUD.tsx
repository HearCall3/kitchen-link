// components/UI/OpinionTagsCRUD.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';

interface OpinionTag {
  postAnOpinionId: number;
  tagId: number;
  // includeで取得されるリレーションの型 (UI表示用に簡略化)
  opinion: { postAnOpinionId: number; commentText: string };
  tag: { tagId: number; tagName: string };
}

const initialFormData = {
  opinionId: 1, // 仮の値
  tagId: 1,     // 仮の値
};

/**
 * OpinionTags中間テーブルのCRUD操作を行うUIコンポーネント
 */
export function OpinionTagsCRUD() {
  const [opinionTags, setOpinionTags] = useState<OpinionTag[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/opinion-tags');
      if (!response.ok) throw new Error('タグ関連付け情報の取得に失敗しました');
      const data = await response.json();
      setOpinionTags(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // タグ付け (POST)
  const handleTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const response = await fetch('/api/opinion-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postAnOpinionId: formData.opinionId,
          tagId: formData.tagId,
        }),
      });

      if (response.status === 409) {
          setError('既にこのタグが意見に付与されています。');
      } else if (!response.ok) {
          throw new Error('タグ付けに失敗しました。');
      } else {
        setMessage(`✅ 意見 ID ${formData.opinionId} にタグ ID ${formData.tagId} を関連付けました。`);
        await fetchTags();
      }
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // タグ解除 (DELETE)
  const handleUntag = async (opinionId: number, tagId: number) => {
    if (!window.confirm(`Opinion ID ${opinionId} から Tag ID ${tagId} を解除しますか？`)) return;

    setLoading(true);
    setError(null);
    setMessage('');
    try {
      const response = await fetch(`/api/opinion-tags/${opinionId}/${tagId}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('タグの解除に失敗しました。');

      setMessage('✅ タグの解除に成功しました！');
      await fetchTags();
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">意見タグ管理 (OpinionTags) CRUD</h1>
      
      {message && <p className="text-green-600 border border-green-600 p-2 rounded mb-4">{message}</p>}
      {error && <p className="text-red-600 border border-red-600 p-2 rounded mb-4">🛑 {error}</p>}

      {/* --- CREATE Form (タグ付け) --- */}
      <div className="mb-10 p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">タグの関連付け/解除</h2>
        <form onSubmit={handleTag} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">意見投稿 ID (PostAnOpinionId)</label>
            <input type="number" name="opinionId" value={formData.opinionId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">タグ ID (TagId)</label>
            <input type="number" name="tagId" value={formData.tagId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? '処理中...' : 'タグを関連付ける (POST)'}
          </button>
        </form>
      </div>

      {/* --- READ List (全関連付け一覧) --- */}
      <h2 className="text-2xl font-semibold mb-4">全 OpinionTags レコード一覧</h2>
      <div className="space-y-3">
        {opinionTags.length === 0 && !loading && <p>関連付けられたタグはありません。</p>}
        {opinionTags.map((ot) => (
          <div key={`${ot.postAnOpinionId}-${ot.tagId}`} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-bold text-lg">
                意見ID: {ot.postAnOpinionId} &rarr; タグID: {ot.tagId}
              </p>
              <p className="text-sm text-gray-500">タグ名: {ot.tag.tagName || 'N/A'} | 意見内容: {ot.opinion.commentText.substring(0, 30)}...</p>
            </div>
            <button 
              onClick={() => handleUntag(ot.postAnOpinionId, ot.tagId)}
              disabled={loading}
              className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              解除 (DELETE)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}