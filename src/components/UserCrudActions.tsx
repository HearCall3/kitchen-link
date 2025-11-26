// ★ クライアントコンポーネントであることを明示
'use client';

import { DeleteButton } from '@/components/CrudButtons';
import AccountUpdateForm from '@/components/AccountUpdateForm';
import { UserAccountPayload, GenderPayload, AgeGroupPayload, OccupationPayload } from '@/app/db/page';
import { useState } from 'react';


type UserCrudActionsProps = {
  user: UserAccountPayload;
  masterData: {
    genders: GenderPayload[];
    ageGroups: AgeGroupPayload[];
    occupations: OccupationPayload[];
  };
};

export default function UserCrudActions({ user, masterData }: UserCrudActionsProps) {
  const [showUpdate, setShowUpdate] = useState(false);

  // AccountUpdateForm に渡す initialData を UserPayload から作成
  const initialUpdateData = {
    userEmail: user.email,
    nickname: user.nickname,
    introduction: user.introduction,
    accountType: user.accountType,
    storeName: undefined, // Userアカウントなので undefined
    genderCode: user.genderCode,
    ageGroupCode: user.ageGroupCode,
    occupationCode: user.occupationCode,
  };


  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      
      <DeleteButton userEmail={user.email} accountNickname={user.nickname} />
      <button onClick={() => setShowUpdate(!showUpdate)} style={{ backgroundColor: '#2196F3', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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