'use client';

import { toggleLike } from './LikeCrudActions';
import { useState, useTransition } from 'react';

// 仮にこのコンポーネントが投稿一覧に表示されることを想定
interface LikeButtonProps {
  commentId: number;
  userEmail: string; // 現在ログインしているユーザー
  isLiked: boolean; // 初期状態でいいね済みか
}

export function LikeButton({ commentId, userEmail, isLiked: initialIsLiked }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  const handleClick = () => {
    startTransition(async () => {
      // ユーザーIDとコメントIDを渡してトグルアクションを実行
      const result = await toggleLike(userEmail, commentId);
      
      if (result.success) {
        // 成功した場合のみ状態を切り替える
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