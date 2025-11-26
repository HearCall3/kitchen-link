// ★ クライアントコンポーネントであることを明示
'use client';

import { createAccount } from '@/actions/db_access';
import { useState } from 'react';
import { GenderPayload, AgeGroupPayload, OccupationPayload } from '@/app/db/page'; 


type AccountInsertFormProps = {
  masterData: {
    genders: GenderPayload[];
    ageGroups: AgeGroupPayload[];
    occupations: OccupationPayload[];
  };
  userEmail: string;
};

export default function AccountInsertForm({ masterData, userEmail }: AccountInsertFormProps) {
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('User');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);

    // ここでINSERTを実行
    const result = await createAccount(userEmail, formData);
    if (result.success) {
      alert('新規アカウントの追加が完了しました。');
      window.location.reload();
    } else {
      alert(`処理に失敗しました: ${result.error}`);
    }
    setLoading(false);
  };

  const isVendor = accountType === 'Vendor';

  return (
    <form action={handleSubmit} style={{ border: '1px dashed #4CAF50', padding: '15px', marginBottom: '20px', maxWidth: '600px' }}>
      <h3>新規アカウント追加</h3>
      
      {/* ニックネーム入力 (必須) */}
      <label style={{ display: 'block', marginBottom: '10px' }}>
        ニックネーム: 
        <input type="text" name="nickname" required style={{ marginLeft: '10px', padding: '5px' }}/>
      </label>
      
      {/* アカウント種別 (ラジオボタン) - 必須 */}
      <p style={{ fontWeight: 'bold' }}>アカウント種別 (必須):</p>
      <label style={{ marginRight: '15px' }}>
        <input 
          type="radio" 
          name="accountType" 
          value="User" 
          required 
          checked={!isVendor}
          onChange={() => setAccountType('User')}
        /> 利用者 (User)
      </label>
      <label>
        <input 
          type="radio" 
          name="accountType" 
          value="Vendor" 
          required 
          checked={isVendor}
          onChange={() => setAccountType('Vendor')}
        /> 出店者 (Vendor)
      </label>

      {/* 1. Vendor選択時のみ表示するフィールド */}
      {isVendor ? (
        <div style={{ marginTop: '15px', borderLeft: '3px solid #FF9800', paddingLeft: '10px' }}>
          <p style={{ fontWeight: 'bold', color: '#FF9800' }}>出店者情報 (Vendor Fields)</p>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            店名 (storeName): 
            <input type="text" name="storeName" required style={{ marginLeft: '10px', padding: '5px' }}/>
          </label>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            紹介文 (introduction): 
            <textarea name="introduction" rows={3} style={{ marginLeft: '10px', verticalAlign: 'top', width: '90%', padding: '5px' }}/>
          </label>
        </div>
      ) : (
        /* 2. User選択時のみ表示するフィールド (マスタデータ + introduction) */
        <div style={{ marginTop: '15px', borderLeft: '3px solid #007bff', paddingLeft: '10px' }}>
          <p style={{ fontWeight: 'bold', color: '#007bff' }}>利用者情報 (User Fields)</p>
          
          {/* --- 性別 (ラジオボタン) --- */}
          <p style={{ marginBottom: '5px' }}><strong>性別:</strong></p>
          {masterData.genders.map(g => (
            <label key={g.code} style={{ marginRight: '15px' }}>
              <input type="radio" name="genderCode" value={g.code} /> {g.name}
            </label>
          ))}
          
          {/* --- 年齢層 (プルダウン) --- */}
          <p style={{ marginBottom: '5px', marginTop: '10px' }}><strong>年齢層:</strong></p>
          <select name="ageGroupCode" defaultValue="" style={{ padding: '5px' }}>
            <option value="">選択してください</option>
            {masterData.ageGroups.map(a => (
              <option key={a.code} value={a.code}>{a.name}</option>
            ))}
          </select>

          {/* --- 職業 (プルダウン) --- */}
          <p style={{ marginBottom: '5px', marginTop: '10px' }}><strong>職業:</strong></p>
          <select name="occupationCode" defaultValue="" style={{ padding: '5px' }}>
            <option value="">選択してください</option>
            {masterData.occupations.map(o => (
              <option key={o.code} value={o.code}>{o.name}</option>
            ))}
          </select>
          
          {/* Userも紹介文を持てるようにする */}
          <label style={{ display: 'block', marginTop: '10px' }}>
            紹介文 (introduction): 
            <textarea name="introduction" rows={3} style={{ marginLeft: '10px', verticalAlign: 'top', width: '90%', padding: '5px' }}/>
          </label>
        </div>
      )}

      <button type="submit" disabled={loading} style={{ marginTop: '20px', marginLeft: 'auto', display: 'block', backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        {loading ? '処理中...' : '追加実行'}
      </button>
    </form>
  );
}