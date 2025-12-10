// components/services/QuestionService.ts

import prisma from '@/lib/prisma';
import { Question, Prisma } from '@prisma/client';

export class QuestionService {
  /**
   * 新しいアンケート (Question) を作成します。
   * @param data Questionテーブルの作成データ
   * @returns 作成された Question レコード
   */
  async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    return prisma.question.create({ data });
  }

  /**
   * 全てのアンケートを取得します。
   * @returns Question レコードの配列
   */
  async getAllQuestions(): Promise<Question[]> {
    return prisma.question.findMany({
      orderBy: { questionId: 'desc' },
      include: { store: true },
    });
  }

  /**
   * 💡 追加: 特定のアンケートを削除します。
   * * @param questionId 削除対象のアンケートID
   * @returns 削除された Question レコード
   */
  async deleteQuestion(questionId: number): Promise<Question> {
    return prisma.$transaction(async (tx) => {
      // 1. 関連する QuestionAnswer レコードを全て削除
      await tx.questionAnswer.deleteMany({
        where: { questionId: questionId },
      });

      // 2. Question レコード本体を削除
      const deletedQuestion = await tx.question.delete({
        where: { questionId: questionId },
      });

      return deletedQuestion;
    });
  }
}