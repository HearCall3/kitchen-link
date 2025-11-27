'use client';

import { deleteAccount } from '@/actions/db_access';

interface DeleteButtonProps {
  userEmail: string; // 主キー (メールアドレス)
  accountNickname: string; // ★追加: ユーザーニックネーム
}

export default function DeleteButton({ userEmail, accountNickname }: DeleteButtonProps) {

  const handleDelete = async () => {
    // ★修正: 確認メッセージにニックネームとメールアドレスを追加
    const confirmMessage = `${accountNickname}（${userEmail}）のアカウントを本当に削除しますか？`;

    if (window.confirm(confirmMessage)) {

      const result = await deleteAccount(userEmail);

      if (result.success) {
        alert(`アカウント「${accountNickname}」を削除しました。`);
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