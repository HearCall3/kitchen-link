// app/api/answers/route.ts

import { NextResponse } from 'next/server';
import { QuestionAnswerService } from '@/components/services/QuestionAnswerService';

const answerService = new QuestionAnswerService();

/**
 * すべての回答の一覧取得 (GET)
 */
export async function GET() {
  try {
    // サービス層に全件取得メソッドがないため、暫定的に実装
    const answers = await answerService.getAnswersByQuestionId(1); // 暫定的にQuestion ID 1の回答を取得
    return NextResponse.json(answers);
  } catch (error) {
    console.error('回答の取得エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * アンケート回答の作成/更新 (POST)
 * 複合キーを持つため、新規作成または既存回答の更新を行うことを想定します。
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.accountId || !data.questionId || !data.selectedOptionNumber || !data.answeredAt) {
      return new NextResponse('Missing required fields', { status: 400 });
    }
    
    // 既存の回答があるかチェック
    const existingAnswer = await answerService.getAnswerByKeys(data.accountId, data.questionId);

    let result;
    if (existingAnswer) {
      // 存在すれば更新 (Update)
      result = await answerService.updateAnswer(data.accountId, data.questionId, {
        selectedOptionNumber: data.selectedOptionNumber,
        answeredAt: data.answeredAt,
      });
    } else {
      // 存在しなければ作成 (Create)
      result = await answerService.createAnswer(data);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('アンケート回答の処理エラー:', error);
    return new NextResponse('Failed to process answer', { status: 500 });
  }
}