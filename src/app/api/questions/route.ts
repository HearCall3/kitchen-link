// app/api/questions/route.ts

import { NextResponse } from 'next/server';
import { QuestionService } from '@/components/services/QuestionService';

const questionService = new QuestionService();

/**
 * アンケートの一覧取得 (GET)
 */
export async function GET() {
  try {
    const questions = await questionService.getAllQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('アンケート一覧取得エラー:', error);
    return new NextResponse('Internal Server Error while fetching questions', { status: 500 });
  }
}

/**
 * 新規アンケートの作成 (POST)
 */
export async function POST(request: Request) {
  try {
    const questionData = await request.json();
    
    // 必須フィールドの簡易チェック
    if (!questionData.storeId || !questionData.questionText || !questionData.option1Text || !questionData.option2Text) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newQuestion = await questionService.createQuestion(questionData);
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('アンケート作成エラー:', error);
    return new NextResponse('Failed to create question', { status: 500 });
  }
}