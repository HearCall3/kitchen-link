// app/api/opening-info/[id]/route.ts

import { NextResponse } from 'next/server';
import { StoreOpeningInformationService } from '@/components/services/StoreOpeningInformationService';

const infoService = new StoreOpeningInformationService();

/**
 * 特定の出店情報の削除 (DELETE)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  try {
    await infoService.deleteOpeningInfo(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('出店情報の削除エラー:', error);
    return new NextResponse('Failed to delete opening information', { status: 500 });
  }
}