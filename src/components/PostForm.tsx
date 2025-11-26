'use client';

import { useFormStatus } from 'react-dom';
// アクションのインポートはパスを適宜修正してください
import { createComment, updateComment, deleteComment } from './CommentCrudActions';
import { toggleLike } from './LikeCrudActions'; // いいねアクション
import { useState, useTransition } from 'react';

// 送信ボタンのステータス管理コンポーネント (再利用)
function SubmitButton({ actionName }: { actionName: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ padding: '8px 15px', background: pending ? '#ccc' : '#17a2b8', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}>
      {pending ? '処理中...' : actionName}
    </button>
  );
}

// いいねボタンのコンポーネント (再定義)
interface LikeButtonProps {
  commentId: number;
  userEmail: string;
  initialIsLiked: boolean; 
}

function LikeButton({ commentId, userEmail, initialIsLiked }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  const handleClick = () => {
    startTransition(async () => {
      // 修正済み: (userEmail, commentId) の正しい順番で渡す
      const result = await toggleLike(userEmail, commentId); 
      if (result.success) {
        setIsLiked(result.status === 'liked');
        console.log(result.message);
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        background: isLiked ? '#ff4136' : '#eee',
        color: isLiked ? 'white' : 'black',
        border: '1px solid #ff4136',
        borderRadius: '5px',
        padding: '5px 10px',
        cursor: 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? '処理中...' : isLiked ? '❤️ いいね済み' : '🤍 いいねする'}
    </button>
  );
}


interface PostFormProps {
  userEmail: string; // ログインユーザーのメールアドレス (必須)
}

export function PostForm({ userEmail }: PostFormProps) {
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // handleAction をここで定義
  const handleAction = async (action: (formData: FormData) => Promise<{ success: boolean; message: string; }>, formData: FormData) => {
    setMessage('');
    const result = await action(formData);
    setIsSuccess(result.success);
    setMessage(result.message);
  };

  // createComment アクションをメールアドレスでバインド
  const createCommentWithEmail = createComment.bind(null, userEmail);

  return (
    <div style={{ border: '1px solid #17a2b8', padding: '20px', borderRadius: '5px', marginBottom: '30px' }}>
      <h3>💬 意見投稿 CRUD (ユーザー: {userEmail})</h3>

      {/* --- 登録フォーム --- */}
      <h4>新規投稿 (Create)</h4>
      <form action={(formData) => handleAction(createCommentWithEmail, formData)} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '15px' }}>
        {/* アカウントIDの入力フィールドは不要 */}
        <input type="number" step="0.00000001" name="latitude" placeholder="緯度" required style={{ padding: '5px', marginRight: '5px' }} />
        <input type="number" step="0.00000001" name="longitude" placeholder="経度" required style={{ padding: '5px', marginRight: '5px' }} />
        <textarea name="commentText" placeholder="意見/コメント本文" required style={{ width: '100%', padding: '5px', marginTop: '10px', marginBottom: '10px' }} rows={3}></textarea>
        <SubmitButton actionName="新規投稿を送信" />
      </form>

      {/* --- 更新フォーム --- */}
      <h4 style={{ marginTop: '15px' }}>投稿更新 (Update)</h4>
      <form action={(formData) => handleAction(updateComment, formData)} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '15px' }}>
        <input type="number" name="commentId" placeholder="投稿ID (必須)" required style={{ padding: '5px', marginRight: '5px' }} />
        <textarea name="commentText" placeholder="新しいコメント本文" required style={{ width: '100%', padding: '5px', marginTop: '10px', marginBottom: '10px' }} rows={3}></textarea>
        <SubmitButton actionName="投稿内容を更新" />
      </form>

      {/* --- 削除フォーム --- */}
      <h4 style={{ marginTop: '15px' }}>投稿削除 (Delete)</h4>
      <form action={async (formData) => handleAction(deleteComment.bind(null, parseInt(formData.get('commentIdToDelete') as string)), formData)}>
        <input type="number" name="commentIdToDelete" placeholder="削除する投稿ID" required style={{ padding: '5px', marginRight: '10px' }} />
        <SubmitButton actionName="投稿を削除" />
      </form>
      
      {/* いいねボタンの表示例 (投稿一覧のどこかに配置するイメージ) */}
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee' }}>
        <h5>[いいね] ボタンテストエリア (投稿ID: 1を想定)</h5>
        {/* 仮の投稿ID 1 でテスト */}
        <LikeButton commentId={1} userEmail={userEmail} initialIsLiked={false} />
      </div>

      {message && (
        <p style={{ color: isSuccess ? 'green' : 'red', marginTop: '15px', fontWeight: 'bold' }}>
          {message}
        </p>
      )}
    </div>
  );
}