'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// FormDataから数値を安全にパースし、undefinedを返すユーティリティ
function safeParseInt(value: FormDataEntryValue | null): number | undefined {
    if (value === null || value === '') return undefined;
    const num = parseInt(value as string);
    return isNaN(num) ? undefined : num;
}

// 1. 追加 (CREATE) - 主キーが email になったため、userEmail を必須とする
export async function createAccount(userEmail: string, formData: FormData) { // ★修正: userEmail を追加
    const nickname = formData.get('nickname') as string;
    const accountType = formData.get('accountType') as string;
    const storeName = formData.get('storeName') as string;
    const introduction = formData.get('introduction') as string;

    const genderCode = safeParseInt(formData.get('genderCode'));
    const ageGroupCode = safeParseInt(formData.get('ageGroupCode'));
    const occupationCode = safeParseInt(formData.get('occupationCode'));

    // バリデーション: email も必須
    if (!userEmail || !nickname || !accountType) {
        return { error: 'Email, Nickname and Account Type are required.' };
    }

    try {
        const data: Prisma.AccountCreateInput = {
            // ★修正: 必須の email フィールドを追加
            email: userEmail, 
            
            nickname: nickname,
            accountType: accountType,
            introduction: introduction,
        };

        if (accountType === 'Vendor') {
            data.storeName = storeName;
        }

        if (accountType === 'User') {
            if (genderCode !== undefined) data.gender = { connect: { code: genderCode } };
            if (ageGroupCode !== undefined) data.ageGroup = { connect: { code: ageGroupCode } };
            if (occupationCode !== undefined) data.occupation = { connect: { code: occupationCode } };
        }

        await prisma.account.create({ data });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        // ★エラーの種類に応じてメッセージを返す（例：Email重複）
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             return { error: 'Account creation failed: Email or Nickname already exists.' };
        }
        console.error('Account creation error:', error);
        return { error: 'Failed to create account. Check logs for details.' };
    }
}

// ----------------------------------------------------------------------
// 2. 更新 (UPDATE) - 主キーが email なので、userEmail で検索
// ----------------------------------------------------------------------
export async function updateAccount(userEmail: string, formData: FormData) { // ★修正: userEmail を追加
    const introduction = formData.get('introduction') as string;
    const storeName = formData.get('storeName') as string; 
    
    const genderCode = safeParseInt(formData.get('genderCode'));
    const ageGroupCode = safeParseInt(formData.get('ageGroupCode'));
    const occupationCode = safeParseInt(formData.get('occupationCode'));

    // ★修正: id ではなく email で検索
    const existingAccount = await prisma.account.findUnique({
        where: { email: userEmail },
        select: { accountType: true }
    });

    if (!existingAccount) {
        return { error: 'Account not found for update.' };
    }

    const updateData: Prisma.AccountUpdateInput = {
        introduction: introduction,
    };

    // ... (User/Vendorの分岐ロジックは変更なし) ...
    if (existingAccount.accountType === 'Vendor') {
        updateData.storeName = storeName;
    } else if (existingAccount.accountType === 'User') {
        updateData.gender = genderCode !== undefined ? { connect: { code: genderCode } } : { disconnect: true };
        updateData.ageGroup = ageGroupCode !== undefined ? { connect: { code: ageGroupCode } } : { disconnect: true };
        updateData.occupation = occupationCode !== undefined ? { connect: { code: occupationCode } } : { disconnect: true };
    }

    try {
        await prisma.account.update({
            // ★修正: id ではなく email で更新
            where: { email: userEmail }, 
            data: updateData,
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Account update error:', error);
        return { error: 'Failed to update account. Check logs for details.' };
    }
}

// ----------------------------------------------------------------------
// 3. 削除 (DELETE) - 主キーが email なので、userEmail で削除
// ----------------------------------------------------------------------
export async function deleteAccount(userEmail: string) { // ★修正: id (number) ではなく userEmail (string) を引数に
    try {
        // ★修正: 依存するデータ削除時の where 句も email (string) に変更
        // Note: 外部キーは accountId フィールドを参照しているが、その型が String に変わった。
        await prisma.like.deleteMany({ where: { accountId: userEmail } });
        await prisma.comment.deleteMany({ where: { accountId: userEmail } });
        await prisma.location.deleteMany({ where: { accountId: userEmail } });

        // アカウントを削除
        await prisma.account.delete({
            // ★修正: id ではなく email で削除
            where: { email: userEmail },
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Account deletion error:', error);
        return { error: 'Failed to delete account. Check logs for details.' };
    }
}