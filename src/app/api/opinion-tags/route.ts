// app/api/opinion-tags/route.ts

import { NextResponse } from 'next/server';
import { OpinionTagsService } from '@/components/services/OpinionTagsService';

const tagsService = new OpinionTagsService();

/**
 * すべてのOpinionTagsレコードを取得 (GET)
 */
export async function GET() {
  try {
    const opinionTags = await tagsService.getAllOpinionTags();
    return NextResponse.json(opinionTags);
  } catch (error) {
    console.error('OpinionTagsの取得エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * 意見にタグを関連付け (POST)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.postAnOpinionId || !data.tagId) {
      return new NextResponse('Missing required IDs', { status: 400 });
    }

    // 重複チェック
    const existingTag = await tagsService.getOpinionTagByKeys(data.postAnOpinionId, data.tagId);
    if (existingTag) {
      return new NextResponse('Tag already associated with this opinion.', { status: 409 });
    }

    const newOpinionTag = await tagsService.addTagToOpinion(data);
    return NextResponse.json(newOpinionTag, { status: 201 });
  } catch (error) {
    console.error('タグの関連付けエラー:', error);
    return new NextResponse('Failed to add tag to opinion', { status: 500 });
  }
}