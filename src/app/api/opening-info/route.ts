// app/api/opening-info/route.ts

import { NextResponse } from 'next/server';
import { StoreOpeningInformationService } from '@/components/services/StoreOpeningInformationService';

const infoService = new StoreOpeningInformationService();

/**
 * すべての出店情報の一覧取得 (GET)
 */
export async function GET() {
  // すべての情報を取得するAPIがないため、仮にストアID1の情報を取得
  try {
    const infos = await infoService.getOpeningsByStoreId(1); // 暫定的にストアID1のものを取得
    return NextResponse.json(infos);
  } catch (error) {
    console.error('出店情報の取得エラー:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * 新規出店情報の作成 (POST)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.storeId || typeof data.latitude === 'undefined') {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newInfo = await infoService.createOpeningInfo(data);
    return NextResponse.json(newInfo, { status: 201 });
  } catch (error) {
    console.error('出店情報の作成エラー:', error);
    return new NextResponse('Failed to create opening information', { status: 500 });
  }
}