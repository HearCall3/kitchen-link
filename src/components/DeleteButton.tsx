'use client';

import { deleteAccount } from '@/actions/db_access';

export default function DeleteButton({ accountId }: { accountId: number }) {
  const handleDelete = async () => {
    if (window.confirm('本当にこのアカウントを削除しますか？')) {
      const result = await deleteAccount(accountId);
      if (result.success) {
        alert('削除成功');
      } else {
        alert(`削除失敗: ${result.error}`);
      }
    }
  };

  return (
    <button onClick={handleDelete} style={{ color: 'red', marginLeft: '10px' }}>
      削除
    </button>
  );
}