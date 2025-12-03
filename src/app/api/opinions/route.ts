// app/api/opinions/route.ts

import { NextResponse } from 'next/server';
import { PostAnOpinionService } from '@/components/services/PostAnOpinionService';

const opinionService = new PostAnOpinionService();

/**
 * 意見投稿の一覧取得 (GET)
 */
export async function GET() {
  try {
    const opinions = await opinionService.getAllOpinions();
    return NextResponse.json(opinions);
  } catch (error) {
    console.error('意見投稿の取得エラー:', error);
    return new NextResponse('Internal Server Error while fetching opinions', { status: 500 });
  }
}

/**
 * 新規意見投稿の作成 (POST)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // 簡易的なバリデーション
    if (!data.accountId || !data.commentText || !data.postedAt) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newOpinion = await opinionService.createOpinion(data);
    return NextResponse.json(newOpinion, { status: 201 });
  } catch (error) {
    console.error('意見投稿の作成エラー:', error);
    // Prismaエラーの場合は400 Bad Requestなどを返すのが適切
    return new NextResponse('Failed to create opinion', { status: 500 });
  }
}