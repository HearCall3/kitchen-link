'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * 👍 「いいね」のトグル（登録または削除）
 * @param userEmail ログインユーザーのメールアドレス (String)
 * @param commentId いいねするコメントID (Int)
 */
export async function toggleLike(userEmail: string, commentId: number) {
  if (!userEmail || isNaN(commentId)) {
    return { success: false, message: '無効なIDです。' };
  }

  const compositeKey = {
    commentId: commentId,
    accountId: userEmail, // ★メールアドレスを使用
  };

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        commentId_accountId: compositeKey,
      },
    });

    if (existingLike) {
      // 存在すれば削除（いいね解除）
      await prisma.like.delete({
        where: { commentId_accountId: compositeKey },
      });
      revalidatePath('/posts');
      return { success: true, status: 'unliked', message: 'いいねを解除しました。' };

    } else {
      // 存在しなければ作成（いいね登録）
      await prisma.like.create({
        data: compositeKey,
      });
      revalidatePath('/posts');
      return { success: true, status: 'liked', message: 'いいねしました！' };
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return { success: false, message: 'いいね処理に失敗しました。' };
  }
}