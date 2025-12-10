// app/api/questions/[id]/route.ts

import { NextResponse } from 'next/server';
import { QuestionService } from '@/components/services/QuestionService';

const questionService = new QuestionService();

/**
 * 特定のアンケートの削除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    await questionService.deleteQuestion(id);
    return new NextResponse(null, { status: 204 }); // 成功したがコンテンツなし
  } catch (error) {
    console.error('アンケートの削除エラー:', error);
    // Prismaでレコードが見つからないエラーなどもここでキャッチされます
    return new NextResponse('Failed to delete question. Ensure related answers are deleted first.', { status: 500 });
  }
}