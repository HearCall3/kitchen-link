// app/api/like/route.ts

import { NextResponse } from 'next/server';
import { PressLikeService } from '@/components/services/PressLikeService';

const likeService = new PressLikeService();

/**
 * いいねの一覧取得 (GET)
 * 暫定的に意見ID 1に対するいいねの総数を取得
 */
export async function GET() {
  try {
    const likeCount = await likeService.countLikesForOpinion(1);
    return NextResponse.json({ opinionId: 1, count: likeCount });
  } catch (error) {
    console.error('いいね情報の取得エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * いいねの追加 (POST)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.accountId || !data.postAnOpinionId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }
    
    // 既にいいねがあるか確認
    const existingLike = await likeService.getLikeByKeys(data.postAnOpinionId, data.accountId);
    if (existingLike) {
      return new NextResponse('Like already exists', { status: 409 }); // Conflict
    }

    const newLike = await likeService.createLike({
      accountId: data.accountId,
      postAnOpinionId: data.postAnOpinionId,
      likedAt: new Date(),
    });

    return NextResponse.json(newLike, { status: 201 });
  } catch (error) {
    console.error('いいねの作成エラー:', error);
    return new NextResponse('Failed to create like', { status: 500 });
  }
}