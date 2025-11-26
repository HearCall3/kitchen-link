// クライアントコンポーネントであることを明示
'use client'; 

import { updateAccount } from '@/actions/db_access';
import { useState } from 'react';
import { GenderPayload, AgeGroupPayload, OccupationPayload } from '@/app/db/page';

type AccountUpdateFormProps = {
  // initialDataは更新時に必要な全データを含む
  initialData: { 
    id: number; 
    nickname: string; 
    introduction: string | null;
    accountType: string;
    storeName: string | null | undefined;
    genderCode: number | null | undefined;
    ageGroupCode: number | null | undefined;
    occupationCode: number | null | undefined;
  };
  masterData: {
    genders: GenderPayload[];
    ageGroups: AgeGroupPayload[];
    occupations: OccupationPayload[];
  };
  onClose: () => void;
};

export default function AccountUpdateForm({ initialData, masterData, onClose }: AccountUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  
  const isVendor = initialData.accountType === 'Vendor';
  const isUser = initialData.accountType === 'User';

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);

    // ここでUPDATEを実行
    const result = await updateAccount(initialData.id, formData);

    if (result.success) {
      alert('更新が完了しました。');
      onClose();
      window.location.reload();
    } else {
      alert(`更新に失敗しました: ${result.error}`);
    }
    setLoading(false);
  };

  return (
    <form action={handleSubmit} style={{ padding: '20px', width: '100%' }}>
      <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '10px' }}>
        アカウント情報更新 ({initialData.accountType} - ID: {initialData.id})
      </h3>
      
      {/* ニックネームは変更不可 */}
      <p style={{ marginTop: '10px' }}><strong>ニックネーム:</strong> {initialData.nickname}</p>

      
      {/* 1. Vendorアカウントの更新フィールド */}
      {isVendor && (
        <div style={{ marginTop: '15px', borderLeft: '3px solid #FF9800', paddingLeft: '10px' }}>
          <p style={{ fontWeight: 'bold' }}>店名 (storeName):</p>
          <input type="text" name="storeName" defaultValue={initialData.storeName || ""} style={{ width: '90%', padding: '5px' }}/>
          <p style={{ fontWeight: 'bold', marginTop: '10px' }}>紹介文 (introduction):</p>
          <textarea name="introduction" rows={3} defaultValue={initialData.introduction || ""} style={{ width: '90%', verticalAlign: 'top', padding: '5px' }}/>
        </div>
      )}

      {/* 2. Userアカウントの更新フィールド (マスタデータ + introduction) */}
      {isUser && (
        <div style={{ marginTop: '15px', borderLeft: '3px solid #007bff', paddingLeft: '10px' }}>
          
          {/* --- 性別 (ラジオボタン) --- */}
          <p style={{ marginBottom: '5px' }}><strong>性別:</strong></p>
          {masterData.genders.map(g => (
            <label key={g.code} style={{ marginRight: '15px' }}>
              <input 
                type="radio" 
                name="genderCode" 
                value={g.code} 
                defaultChecked={g.code === initialData.genderCode} 
              /> {g.name}
            </label>
          ))}
          
          {/* --- 年齢層 (プルダウン) --- */}
          <p style={{ marginBottom: '5px', marginTop: '10px' }}><strong>年齢層:</strong></p>
          <select name="ageGroupCode" defaultValue={initialData.ageGroupCode || ""} style={{ padding: '5px' }}>
            <option value="">未設定</option>
            {masterData.ageGroups.map(a => (
              <option key={a.code} value={a.code}>{a.name}</option>
            ))}
          </select>

          {/* --- 職業 (プルダウン) --- */}
          <p style={{ marginBottom: '5px', marginTop: '10px' }}><strong>職業:</strong></p>
          <select name="occupationCode" defaultValue={initialData.occupationCode || ""} style={{ padding: '5px' }}>
            <option value="">未設定</option>
            {masterData.occupations.map(o => (
              <option key={o.code} value={o.code}>{o.name}</option>
            ))}
          </select>
          
          <p style={{ fontWeight: 'bold', marginTop: '10px' }}>紹介文 (introduction):</p>
          <textarea name="introduction" rows={3} defaultValue={initialData.introduction || ""} style={{ width: '90%', verticalAlign: 'top', padding: '5px' }}/>
        </div>
      )}

      <button type="submit" disabled={loading} style={{ marginTop: '20px', marginLeft: 'auto', display: 'block', backgroundColor: '#2196F3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {loading ? '処理中...' : '更新実行'}
      </button>
    </form>
  );
}