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

// 1. 追加 (INSERT)
export async function createAccount(formData: FormData) {
    const nickname = formData.get('nickname') as string;
    const accountType = formData.get('accountType') as string;
    const storeName = formData.get('storeName') as string;
    const introduction = formData.get('introduction') as string;

    const genderCode = safeParseInt(formData.get('genderCode'));
    const ageGroupCode = safeParseInt(formData.get('ageGroupCode'));
    const occupationCode = safeParseInt(formData.get('occupationCode'));

    if (!nickname || !accountType) {
        return { error: 'Nickname and Account Type are required.' };
    }

    try {
        const data: Prisma.AccountCreateInput = {
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
        console.error('Account creation error:', error);
        return { error: 'Failed to create account. Check logs for details.' };
    }
}

// 2. 更新 (UPDATE)
export async function updateAccount(id: number, formData: FormData) {
    const introduction = formData.get('introduction') as string;
    const storeName = formData.get('storeName') as string; 
    
    const genderCode = safeParseInt(formData.get('genderCode'));
    const ageGroupCode = safeParseInt(formData.get('ageGroupCode'));
    const occupationCode = safeParseInt(formData.get('occupationCode'));

    const existingAccount = await prisma.account.findUnique({
        where: { id: id },
        select: { accountType: true }
    });

    if (!existingAccount) {
        return { error: 'Account not found for update.' };
    }

    const updateData: Prisma.AccountUpdateInput = {
        introduction: introduction,
    };

    if (existingAccount.accountType === 'Vendor') {
        updateData.storeName = storeName;
    } else if (existingAccount.accountType === 'User') {
        updateData.gender = genderCode !== undefined ? { connect: { code: genderCode } } : { disconnect: true };
        updateData.ageGroup = ageGroupCode !== undefined ? { connect: { code: ageGroupCode } } : { disconnect: true };
        updateData.occupation = occupationCode !== undefined ? { connect: { code: occupationCode } } : { disconnect: true };
    }


    try {
        await prisma.account.update({
            where: { id: id },
            data: updateData,
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Account update error:', error);
        return { error: 'Failed to update account. Check logs for details.' };
    }
}

// 3. 削除 (DELETE)
export async function deleteAccount(id: number) {
    try {
        // 依存するデータを先に削除 (Likes, Comments, Locations)
        await prisma.like.deleteMany({ where: { accountId: id } });
        await prisma.comment.deleteMany({ where: { accountId: id } });
        await prisma.location.deleteMany({ where: { accountId: id } });

        // アカウントを削除
        await prisma.account.delete({
            where: { id: id },
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Account deletion error:', error);
        return { error: 'Failed to delete account due to related data issues.' };
    }
}