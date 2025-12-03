// components/services/PostAnOpinionService.ts

import prisma from '@/lib/prisma'; 
import { PostAnOpinion, Prisma } from '@prisma/client';

/**
 * 意見投稿 (PostAnOpinion) のデータベース操作サービス
 */
export class PostAnOpinionService {
  /**
   * 新しい意見投稿を作成
   * @param data 作成データ (accountId, latitude, longitude, commentText, postedAt)
   * @returns 作成された PostAnOpinion
   */
  async createOpinion(data: Prisma.PostAnOpinionCreateInput): Promise<PostAnOpinion> {
    return prisma.postAnOpinion.create({ data });
  }

  /**
   * 意見投稿IDで単一の意見投稿を取得
   * @param id 意見投稿ID
   * @returns PostAnOpinion または null
   */
  async getOpinionById(id: number): Promise<PostAnOpinion | null> {
    return prisma.postAnOpinion.findUnique({
      where: { postAnOpinionId: id },
      // リレーションを含める場合の例:
      include: { account: true, likes: true, opinionTags: { include: { tag: true } } }, 
    });
  }

  /**
   * すべての意見投稿を取得 (ページネーションやフィルタリングは省略)
   * @returns PostAnOpinion の配列
   */
  async getAllOpinions(): Promise<PostAnOpinion[]> {
    return prisma.postAnOpinion.findMany({
      orderBy: { postedAt: 'desc' },
    });
  }

  /**
   * 意見投稿を更新
   * @param id 更新対象の意見投稿ID
   * @param data 更新データ
   * @returns 更新された PostAnOpinion
   */
  async updateOpinion(id: number, data: Prisma.PostAnOpinionUpdateInput): Promise<PostAnOpinion> {
    return prisma.postAnOpinion.update({
      where: { postAnOpinionId: id },
      data,
    });
  }

  /**
   * 意見投稿を削除
   * @param id 削除対象の意見投稿ID
   * @returns 削除された PostAnOpinion
   */
  async deleteOpinion(id: number): Promise<PostAnOpinion> {
    // 関連する PressLike や OpinionTags が先に削除されていることを前提とします。
    return prisma.postAnOpinion.delete({
      where: { postAnOpinionId: id },
    });
  }
}