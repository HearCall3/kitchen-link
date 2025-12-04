// components/services/QuestionAnswerService.ts

import prisma from '@/lib/prisma';
import { QuestionAnswer, Prisma } from '@prisma/client';

/**
 * アンケート回答 (QuestionAnswer) のデータベース操作サービス
 */
export class QuestionAnswerService {
  /**
   * アンケートに回答（複合主キーによる作成）
   * @param data 作成データ (accountId, questionId, selectedOptionNumber, answeredAt)
   * @returns 作成された QuestionAnswer
   */
  async createAnswer(data: {
    accountId: number;
    questionId: number;
    selectedOptionNumber: number;
    answeredAt: Date;
  }): Promise<QuestionAnswer> {
    return prisma.questionAnswer.create({ data });
  }

  /**
   * 特定アカウントの特定アンケートへの回答を取得
   * @param accountId アカウントID
   * @param questionId アンケートID
   * @returns QuestionAnswer または null
   */
  async getAnswerByKeys(accountId: number, questionId: number): Promise<QuestionAnswer | null> {
    return prisma.questionAnswer.findUnique({
      where: {
        accountId_questionId: {
          accountId: accountId,
          questionId: questionId,
        },
      },
    });
  }

  /**
   * 特定のアンケートの全回答を取得
   * @param questionId アンケートID
   * @returns QuestionAnswer の配列
   */
  async getAnswersByQuestionId(questionId: number): Promise<QuestionAnswer[]> {
    return prisma.questionAnswer.findMany({
      where: { questionId: questionId },
      include: { account: true },
    });
  }

  /**
   * 回答を更新（選択肢の変更などを想定）
   * @param accountId アカウントID
   * @param questionId アンケートID
   * @param data 更新データ
   * @returns 更新された QuestionAnswer
   */
  async updateAnswer(
    accountId: number,
    questionId: number,
    data: Prisma.QuestionAnswerUpdateInput
  ): Promise<QuestionAnswer> {
    return prisma.questionAnswer.update({
      where: {
        accountId_questionId: {
          accountId: accountId,
          questionId: questionId,
        },
      },
      data,
    });
  }

  /**
   * 回答を削除
   * @param accountId アカウントID
   * @param questionId アンケートID
   * @returns 削除された QuestionAnswer
   */
  async deleteAnswer(accountId: number, questionId: number): Promise<QuestionAnswer> {
    return prisma.questionAnswer.delete({
      where: {
        accountId_questionId: {
          accountId: accountId,
          questionId: questionId,
        },
      },
    });
  }
}