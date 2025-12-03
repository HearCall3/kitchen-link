// app/api/account/user/route.ts

import { NextResponse } from 'next/server';
import { AccountCreationService } from '@/components/services/AccountCreationService';

const accountService = new AccountCreationService();

/**
 * 一般ユーザーアカウントの作成 (POST)
 */
export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // 必須フィールドの簡易チェック
    if (!userData.nickname) {
      return new NextResponse('Nickname is required', { status: 400 });
    }
    
    const newAccount = await accountService.createUserAccount(userData);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('ユーザーアカウント作成エラー:', error);
    // Unique制約違反などのPrismaエラーハンドリングが必要
    return new NextResponse('Failed to create user account', { status: 500 });
  }
}