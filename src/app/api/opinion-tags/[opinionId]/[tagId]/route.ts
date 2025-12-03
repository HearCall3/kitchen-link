// app/api/opinion-tags/[opinionId]/[tagId]/route.ts

import { NextResponse } from 'next/server';
import { OpinionTagsService } from '@/components/services/OpinionTagsService';

const tagsService = new OpinionTagsService();

/**
 * 意見からタグを解除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { opinionId: string, tagId: string } }) {
  const opinionId = parseInt(params.opinionId, 10);
  const tagId = parseInt(params.tagId, 10);
  
  if (isNaN(opinionId) || isNaN(tagId)) {
    return new NextResponse('Invalid IDs', { status: 400 });
  }

  try {
    await tagsService.removeTagFromOpinion(opinionId, tagId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('タグの解除エラー:', error);
    return new NextResponse('Failed to remove tag from opinion', { status: 500 });
  }
}