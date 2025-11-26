'use client';

import { useFormStatus } from 'react-dom';
// アクションのインポートはパスを適宜修正してください
import { createLocation, updateLocation, deleteLocation } from './LocationCrudActions'; 
import { useState } from 'react';

// 送信ボタンのステータス管理コンポーネント (再利用)
function SubmitButton({ actionName }: { actionName: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ padding: '8px 15px', background: pending ? '#ccc' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}>
      {pending ? '処理中...' : actionName}
    </button>
  );
}

interface StoreFormProps {
  userEmail: string; // ログインユーザーのメールアドレス (必須)
}

export function StoreForm({ userEmail }: StoreFormProps) {
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 汎用的なフォーム送信ハンドラ
  const handleAction = async (action: (formData: FormData) => Promise<{ success: boolean; message: string; }>, formData: FormData) => {
    setMessage('');
    const result = await action(formData);
    setIsSuccess(result.success);
    setMessage(result.message);
  };
  
  // createLocation アクションをメールアドレスでバインド (登録時に自動でuserEmailを使用)
  const createLocationWithEmail = createLocation.bind(null, userEmail);

  return (
    <div style={{ border: '1px solid #28a745', padding: '20px', borderRadius: '5px', marginBottom: '30px' }}>
      <h3>📍 出店情報 CRUD (ユーザー: {userEmail})</h3>

      {/* --- 登録フォーム --- */}
      <h4>新規登録 (Create)</h4>
      <form action={(formData) => handleAction(createLocationWithEmail, formData)} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '15px' }}>
        {/* アカウントIDの入力フィールドは不要 */}
        <input type="text" name="locationName" placeholder="出店場所名" style={{ padding: '5px', marginRight: '5px' }} />
        <input type="number" step="0.00000001" name="latitude" placeholder="緯度" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="number" step="0.00000001" name="longitude" placeholder="経度" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="date" name="openingDate" placeholder="営業開始日 (YYYY-MM-DD)" required style={{ padding: '5px', marginRight: '10px' }} />
        <SubmitButton actionName="新規出店情報を登録" />
      </form>

      {/* --- 更新フォーム --- */}
      <h4 style={{ marginTop: '15px' }}>情報更新 (Update)</h4>
      <form action={(formData) => handleAction(updateLocation, formData)} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '15px' }}>
        <input type="number" name="locationId" placeholder="出店ID (必須)" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="text" name="locationName" placeholder="新しい場所名" style={{ padding: '5px', marginRight: '5px' }} />
        <input type="number" step="0.00000001" name="latitude" placeholder="新しい緯度" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="number" step="0.00000001" name="longitude" placeholder="新しい経度" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="date" name="openingDate" placeholder="新しい開始日" required style={{ padding: '5px', marginRight: '10px' }} />
        <SubmitButton actionName="出店情報を更新" />
      </form>

      {/* --- 削除フォーム --- */}
      <h4 style={{ marginTop: '15px' }}>情報削除 (Delete)</h4>
      <form action={async (formData) => handleAction(deleteLocation.bind(null, parseInt(formData.get('locationIdToDelete') as string)), formData)}>
        <input type="number" name="locationIdToDelete" placeholder="削除する出店ID" required style={{ padding: '5px', marginRight: '10px' }} />
        <SubmitButton actionName="出店情報を削除" />
      </form>
      
      {message && (
        <p style={{ color: isSuccess ? 'green' : 'red', marginTop: '15px', fontWeight: 'bold' }}>
          {message}
        </p>
      )}
    </div>
  );
}