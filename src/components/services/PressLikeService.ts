// components/services/PressLikeService.ts

import prisma from '@/lib/prisma';
import { PressLike, Prisma } from '@prisma/client';

/**
 * いいね (PressLike) のデータベース操作サービス
 */
export class PressLikeService {
  /**
   * いいねを作成/登録 (複合主キーによる作成)
   * @param data 作成データ (postAnOpinionId, accountId, likedAt)
   * @returns 作成された PressLike
   */
  async createLike(data: {
    postAnOpinionId: number;
    accountId: number;
    likedAt: Date;
  }): Promise<PressLike> {
    return prisma.pressLike.create({ data });
  }

  /**
   * 特定の意見投稿に対する、特定アカウントのいいねを取得
   * @param opinionId 意見投稿ID
   * @param accountId アカウントID
   * @returns PressLike または null
   */
  async getLikeByKeys(opinionId: number, accountId: number): Promise<PressLike | null> {
    return prisma.pressLike.findUnique({
      where: {
        postAnOpinionId_accountId: {
          postAnOpinionId: opinionId,
          accountId: accountId,
        },
      },
    });
  }

  /**
   * 特定の意見投稿のいいね総数を取得
   * @param opinionId 意見投稿ID
   * @returns いいねの総数
   */
  async countLikesForOpinion(opinionId: number): Promise<number> {
    return prisma.pressLike.count({
      where: { postAnOpinionId: opinionId },
    });
  }

  /**
   * いいねを削除/取り消し
   * @param opinionId 意見投稿ID
   * @param accountId アカウントID
   * @returns 削除された PressLike
   */
  async deleteLike(opinionId: number, accountId: number): Promise<PressLike> {
    return prisma.pressLike.delete({
      where: {
        postAnOpinionId_accountId: {
          postAnOpinionId: opinionId,
          accountId: accountId,
        },
      },
    });
  }
}