// app/api/opinions/[id]/route.ts

import { NextResponse } from 'next/server';
import { PostAnOpinionService } from '@/components/services/PostAnOpinionService';

const opinionService = new PostAnOpinionService();

/**
 * 特定の意見投稿の取得 (GET)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    const opinion = await opinionService.getOpinionById(id);
    if (!opinion) {
      return new NextResponse('Opinion not found', { status: 404 });
    }
    return NextResponse.json(opinion);
  } catch (error) {
    console.error('特定の意見投稿の取得エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * 特定の意見投稿の削除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    // 💡 複合キーを持つ関連テーブルのレコードを先に削除するか、
    // PrismaスキーマでCASCADE DELETEを設定している必要があります。
    // ここではサービス層が依存関係を処理済みか、CASCADEが有効と仮定します。
    await opinionService.deleteOpinion(id);
    return new NextResponse(null, { status: 204 }); // 成功したがコンテンツなし
  } catch (error) {
    console.error('意見投稿の削除エラー:', error);
    // 削除対象が存在しない場合などもここでキャッチされる
    return new NextResponse('Failed to delete opinion', { status: 500 });
  }
}