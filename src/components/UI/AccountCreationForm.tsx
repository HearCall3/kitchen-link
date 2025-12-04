// components/UI/AccountCreationForm.tsx

'use client';

import { useState } from 'react';

type AccountType = 'User' | 'Store';

// ルックアップテーブルのダミーデータ
const GENDERS = [{ id: 1, name: '男性' }, { id: 2, name: '女性' }, { id: 3, name: 'その他' }];
const AGE_GROUPS = [{ id: 1, name: '10代' }, { id: 2, name: '20代' }, { id: 3, name: '30代' }, { id: 4, name: '40代以上' }];
const OCCUPATIONS = [{ id: 1, name: '会社員' }, { id: 2, name: '自営業' }, { id: 3, name: '学生' }, { id: 4, name: 'その他/無職' }];

const initialUserData = { nickname: '', introduction: '', genderId: 1, ageGroupId: 1, occupationId: 1, };
const initialStoreData = { storeName: '', storeUrl: '', introduction: '', };

export function AccountCreationForm() {
  const [accountType, setAccountType] = useState<AccountType>('User');
  const [userData, setUserData] = useState(initialUserData);
  const [storeData, setStoreData] = useState(initialStoreData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: name.endsWith('Id') ? Number(value) : value,
    }));
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreData((prev) => ({ ...prev, [name]: value, }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setMessage('');
    const apiUrl = accountType === 'User' ? '/api/account/user' : '/api/account/store';
    const dataToSend = accountType === 'User' ? userData : storeData;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'アカウント作成に失敗しました。');
      }

      const result = await response.json();
      setMessage(`アカウント (ID: ${result.accountId}, Type: ${result.accountType}) の作成に成功しました！`);
      setUserData(initialUserData);
      setStoreData(initialStoreData);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderUserForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">ニックネーム (必須)</label>
        <input type="text" name="nickname" value={userData.nickname} onChange={handleUserChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">自己紹介</label>
        <textarea name="introduction" value={userData.introduction} onChange={handleUserChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">性別</label>
          <select name="genderId" value={userData.genderId} onChange={handleUserChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            {GENDERS.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">年齢層</label>
          <select name="ageGroupId" value={userData.ageGroupId} onChange={handleUserChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            {AGE_GROUPS.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">職業</label>
          <select name="occupationId" value={userData.occupationId} onChange={handleUserChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            {OCCUPATIONS.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStoreForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">店名 (必須)</label>
        <input type="text" name="storeName" value={storeData.storeName} onChange={handleStoreChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">ホームページURL</label>
        <input type="url" name="storeUrl" value={storeData.storeUrl} onChange={handleStoreChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">ストア紹介文</label>
        <textarea name="introduction" value={storeData.introduction} onChange={handleStoreChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
      </div>
    </div>
  );


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">アカウント作成</h1>

      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setAccountType('User')}
          className={`px-4 py-2 text-lg font-medium transition-colors duration-150 ${
            accountType === 'User' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          一般ユーザー登録
        </button>
        <button
          onClick={() => setAccountType('Store')}
          className={`px-4 py-2 text-lg font-medium transition-colors duration-150 ${
            accountType === 'Store' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ストアアカウント登録
        </button>
      </div>

      {message && <p className="text-green-600 border border-green-600 p-2 rounded mb-4">✅ {message}</p>}
      {error && <p className="text-red-600 border border-red-600 p-2 rounded mb-4">🛑 {error}</p>}

      <div className="p-6 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4">
          {accountType === 'User' ? '👤 一般ユーザー情報入力' : '🏬 ストア情報入力'}
        </h2>
        <form onSubmit={handleSubmit}>
          {accountType === 'User' ? renderUserForm() : renderStoreForm()}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? '登録中...' : `${accountType === 'User' ? 'ユーザー' : 'ストア'}アカウントを作成`}
          </button>
        </form>
      </div>
    </div>
  );
}