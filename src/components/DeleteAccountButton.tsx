"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { deleteUser, deleteStore } from "@/actions/db_access";

export default function DeleteAccountButton() {
  const { data: session } = useSession();
  const router = useRouter();

  // セッションから必須情報を取得
  const accountId = session?.user?.accountId;
  const isUser = !!session?.user?.accountId && !!session.user.email; // Accountが存在する
  const isStore = !!session?.user?.storeId; // Storeとして登録されている

  const handleDelete = async () => {
    if (!accountId) {
      alert("アカウント情報が見つかりません。");
      return;
    }

    // 警告メッセージ
    if (!window.confirm("本当にアカウントを削除しますか？この操作は元に戻せません。")) {
      return;
    }

    let result;
    let type = "";

    try {
      if (isStore) {
        // Storeのプロファイルを削除
        result = await deleteStore(accountId);
        type = "出店者プロファイル";
      } else if (isUser) {
        // Userのプロファイルを削除
        result = await deleteUser(accountId);
        type = "一般利用者プロファイル";
      } else {
        alert("削除対象のアカウントタイプが特定できません。");
        return;
      }

      if (result.success) {
        alert(`${type}の削除が完了しました。`);
        // 削除成功後、NextAuthのセッションも強制的に終了させる
        await signOut({ callbackUrl: '/' });
      } else {
        alert(`削除失敗: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("処理中にエラーが発生しました。");
    }
  };

  return (
    <button 
      onClick={handleDelete}
      style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px'
      }}
      disabled={!accountId}
    >
      アカウントを削除する
    </button>
  );
}