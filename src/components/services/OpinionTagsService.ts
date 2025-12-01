// components/services/OpinionTagsService.ts

import prisma from '@/lib/prisma';
import { OpinionTags, Prisma } from '@prisma/client';

/**
 * 意見投稿とタグの中間テーブル (OpinionTags) のデータベース操作サービス
 */
export class OpinionTagsService {
  /**
   * 意見投稿にタグを関連付け (複合主キーによる作成)
   * @param data 作成データ (postAnOpinionId, tagId)
   * @returns 作成された OpinionTags
   */
  async addTagToOpinion(data: { postAnOpinionId: number; tagId: number }): Promise<OpinionTags> {
    return prisma.opinionTags.create({ data });
  }

  /**
   * 特定の意見投稿に特定のタグが関連付けられているかを取得
   * @param opinionId 意見投稿ID
   * @param tagId タグID
   * @returns OpinionTags または null
   */
  async getOpinionTagByKeys(opinionId: number, tagId: number): Promise<OpinionTags | null> {
    return prisma.opinionTags.findUnique({
      where: {
        postAnOpinionId_tagId: {
          postAnOpinionId: opinionId,
          tagId: tagId,
        },
      },
    });
  }

  /**
   * 特定の意見投稿に関連付けられたすべてのタグを取得
   * @param opinionId 意見投稿ID
   * @returns OpinionTags の配列
   */
  async getTagsForOpinion(opinionId: number): Promise<OpinionTags[]> {
    return prisma.opinionTags.findMany({
      where: { postAnOpinionId: opinionId },
      include: { tag: true }, // タグ情報も含めて取得
    });
  }

  /**
   * 意見投稿からタグを解除
   * @param opinionId 意見投稿ID
   * @param tagId タグID
   * @returns 削除された OpinionTags
   */
  async removeTagFromOpinion(opinionId: number, tagId: number): Promise<OpinionTags> {
    return prisma.opinionTags.delete({
      where: {
        postAnOpinionId_tagId: {
          postAnOpinionId: opinionId,
          tagId: tagId,
        },
      },
    });
  }
}