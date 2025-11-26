// ★ クライアントコンポーネントであることを明示
'use client'; 

import { deleteAccount } from '@/actions/db_access';
import { useState } from 'react';
import AccountUpdateForm from './AccountUpdateForm';
import { VendorLocationPayload, GenderPayload, AgeGroupPayload, OccupationPayload } from '@/app/db/page';


// 1. 削除ボタンコンポーネント (再利用できるようにエクスポート)
type DeleteButtonProps = {
  userEmail: string;
  accountNickname: string;
};

export function DeleteButton({ userEmail, accountNickname }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    // Note: Use custom modal UI instead of window.confirm/alert in real app.
    if (!window.confirm(`アカウント名「${accountNickname} 」を本当に削除しますか？\n（関連データも削除されます）`)) {
      return;
    }

    setLoading(true);

    // ここでDELETEを実行
    const result = await deleteAccount(userEmail);

    if (result.success) {
      alert('削除が完了しました。ページをリロードします。');
      window.location.reload(); 
    } else {
      alert(`削除に失敗しました: ${result.error}`);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading} style={{ color: 'white', backgroundColor: '#F44336', border: 'none', padding: '5px 10px', marginLeft: '10px', borderRadius: '5px', cursor: 'pointer' }}>
      {loading ? '削除中...' : '削除'}
    </button>
  );
}


// 2. Vendor用メインコンポーネント
type CrudButtonsProps = {
  vendor: VendorLocationPayload;
  masterData: {
    genders: GenderPayload[];
    ageGroups: AgeGroupPayload[];
    occupations: OccupationPayload[];
  };
};

export default function CrudButtons({ vendor, masterData }: CrudButtonsProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  
  // AccountUpdateForm に渡す initialData を VendorPayload から作成
  const initialUpdateData = {
    userEmail: vendor.email,
    nickname: vendor.nickname, 
    introduction: vendor.introduction,
    accountType: vendor.accountType,
    storeName: vendor.storeName,
    genderCode: vendor.genderCode,
    ageGroupCode: vendor.ageGroupCode,
    occupationCode: vendor.occupationCode,
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: '20px' }}>
      <DeleteButton userEmail={vendor.email} accountNickname={vendor.nickname} />
      <button onClick={() => setShowUpdate(!showUpdate)} style={{ backgroundColor: '#2196F3', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}>
        {showUpdate ? '更新閉じる' : '更新フォーム'}
      </button>

      {/* 更新フォームのモーダル/ポップアップ表示 */}
      {showUpdate && (
        <div style={{ position: 'fixed', zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px' }}>
            <AccountUpdateForm 
              initialData={initialUpdateData} 
              masterData={masterData}
              onClose={() => setShowUpdate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}