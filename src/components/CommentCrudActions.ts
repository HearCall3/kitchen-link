'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * 💬 意見投稿（Comment）の新規登録
 * @param formData フォームデータ
 */
export async function createComment(userEmail: string, formData: FormData) {
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const commentText = formData.get('commentText') as string;

  if (!userEmail || isNaN(latitude) || isNaN(longitude) || !commentText) {
    return { success: false, message: '必須項目が不足しています。' };
  }

  try {
    await prisma.comment.create({
      data: {
        accountId: userEmail, // ★メールアドレスを使用
        latitude: latitude,
        longitude: longitude,
        commentText: commentText,
      },
    });

    revalidatePath('/posts');
    return { success: true, message: '新しい意見が投稿されました。' };
  } catch (error) {
    console.error('Create comment error:', error);
    return { success: false, message: '投稿の登録に失敗しました。' };
  }
}

/**
 * 💬 意見投稿（Comment）の更新
 * @param formData フォームデータ
 */
export async function updateComment(formData: FormData) {
  const commentId = parseInt(formData.get('commentId') as string);
  const newCommentText = formData.get('commentText') as string;

  if (isNaN(commentId) || !newCommentText) {
    return { success: false, message: '投稿IDまたは本文が不足しています。' };
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        commentText: newCommentText,
      },
    });

    revalidatePath('/posts');
    return { success: true, message: `投稿ID ${commentId} の内容を更新しました。` };
  } catch (error) {
    console.error('Update comment error:', error);
    return { success: false, message: '投稿の更新に失敗しました。' };
  }
}

/**
 * 💬 意見投稿（Comment）の削除
 * @param commentId 削除する投稿ID
 */
export async function deleteComment(commentId: number) {
  if (isNaN(commentId)) {
    return { success: false, message: '無効な投稿IDです。' };
  }

  try {
    // 関連する Like レコードを先に削除する必要がある（外部キー制約のため）
    await prisma.like.deleteMany({
        where: { commentId: commentId },
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath('/posts');
    return { success: true, message: `投稿ID ${commentId} を削除しました。` };
  } catch (error) {
    console.error('Delete comment error:', error);
    return { success: false, message: '投稿の削除に失敗しました。' };
  }
}