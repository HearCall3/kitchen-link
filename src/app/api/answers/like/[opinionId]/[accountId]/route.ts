// app/api/like/[opinionId]/[accountId]/route.ts

import { NextResponse } from 'next/server';
import { PressLikeService } from '@/components/services/PressLikeService';

const likeService = new PressLikeService();

/**
 * いいねの削除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { opinionId: string, accountId: string } }) {
  const opinionId = parseInt(params.opinionId, 10);
  const accountId = parseInt(params.accountId, 10);
  
  if (isNaN(opinionId) || isNaN(accountId)) {
    return new NextResponse('Invalid IDs', { status: 400 });
  }

  try {
    await likeService.deleteLike(opinionId, accountId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('いいねの削除エラー:', error);
    return new NextResponse('Failed to delete like', { status: 500 });
  }
}