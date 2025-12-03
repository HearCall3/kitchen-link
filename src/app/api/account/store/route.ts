// app/api/account/store/route.ts

import { NextResponse } from 'next/server';
import { AccountCreationService } from '@/components/services/AccountCreationService';

const accountService = new AccountCreationService();

/**
 * ストアアカウントの作成 (POST)
 */
export async function POST(request: Request) {
  try {
    const storeData = await request.json();
    
    // 必須フィールドの簡易チェック
    if (!storeData.storeName) {
      return new NextResponse('Store name is required', { status: 400 });
    }
    
    const newAccount = await accountService.createStoreAccount(storeData);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('ストアアカウント作成エラー:', error);
    return new NextResponse('Failed to create store account', { status: 500 });
  }
}