// app/api/answers/[accountId]/[questionId]/route.ts

import { NextResponse } from 'next/server';
import { QuestionAnswerService } from '@/components/services/QuestionAnswerService';

const answerService = new QuestionAnswerService();

/**
 * 特定の回答の削除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { accountId: string, questionId: string } }) {
  const accountId = parseInt(params.accountId, 10);
  const questionId = parseInt(params.questionId, 10);
  
  if (isNaN(accountId) || isNaN(questionId)) {
    return new NextResponse('Invalid IDs', { status: 400 });
  }

  try {
    await answerService.deleteAnswer(accountId, questionId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('アンケート回答の削除エラー:', error);
    return new NextResponse('Failed to delete answer', { status: 500 });
  }
}