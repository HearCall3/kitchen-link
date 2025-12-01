// components/UI/StoreOpeningInformationCRUD.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface OpeningInfo {
  storeOpeningInformationId: number;
  storeId: number;
  latitude: number;
  longitude: number;
  openingDate: string;
  locationName: string | null;
}

const initialFormData = {
  storeId: 101, // 仮の値
  latitude: 34.6937,
  longitude: 135.5023,
  locationName: '',
  openingDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
};

/**
 * StoreOpeningInformationテーブルのCRUD操作を行うUIコンポーネント
 */
export function StoreOpeningInformationCRUD() {
  const [infos, setInfos] = useState<OpeningInfo[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/opening-info');
      if (!response.ok) throw new Error('出店情報の取得に失敗しました');
      const data = await response.json();
      setInfos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfos();
  }, [fetchInfos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'storeId' || name === 'latitude' || name === 'longitude' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        openingDate: new Date(formData.openingDate).toISOString(),
      };
      
      const response = await fetch('/api/opening-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('作成に失敗');
      setFormData(initialFormData);
      await fetchInfos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`ID: ${id} の情報を削除しますか？`)) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/opening-info/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('削除に失敗');
      await fetchInfos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">出店情報 (StoreOpeningInformation) CRUD</h1>
      
      {/* CREATE Form */}
      <div className="mb-10 p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">新規出店情報 (Create)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ストアID</label>
            <input type="number" name="storeId" value={formData.storeId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">場所の名前</label>
            <input type="text" name="locationName" value={formData.locationName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">出店日</label>
            <input type="date" name="openingDate" value={formData.openingDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">作成</button>
        </form>
      </div>

      {/* READ List */}
      <h2 className="text-2xl font-semibold mb-4">出店情報一覧</h2>
      <div className="space-y-3">
        {infos.map((info) => (
          <div key={info.storeOpeningInformationId} className="flex justify-between items-start p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-bold text-lg">ID: {info.storeOpeningInformationId} (Store: {info.storeId})</p>
              <p className="text-gray-800">場所: {info.locationName || '未設定'}</p>
              <p className="text-xs text-gray-500">出店日: {new Date(info.openingDate).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleDelete(info.storeOpeningInformationId)} disabled={loading} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:bg-gray-400">
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}