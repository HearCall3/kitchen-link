// src/actions/db_access.ts (Account IDに '03' を適用するように修正)
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

// ===================================================================
// ★ カウントアップ式カスタムID生成ロジック (User/Store/Account用) ★
// ===================================================================

const SEQUENCE_NAME_USER = 'user_seq';
const SEQUENCE_NAME_STORE = 'store_seq';
// ★ Account専用のシーケンス名を追加
const SEQUENCE_NAME_ACCOUNT = 'account_seq'; 
const COUNT_LENGTH = 8; // 連番部分の桁数

/**
 * データベースで連番を安全にインクリメントし、カスタムIDを生成する
 * @param seqName - 'user_seq', 'store_seq', or 'account_seq'
 * @param typeCode - '01' (User), '02' (Store), or '03' (Account)
 * @param tx - Prismaトランザクションクライアント
 * @returns [8桁の連番][2桁のタイプコード] の形式のカスタムID (String)
 */
async function getAndIncrementCustomId(seqName: typeof SEQUENCE_NAME_USER | typeof SEQUENCE_NAME_STORE | typeof SEQUENCE_NAME_ACCOUNT, typeCode: '01' | '02' | '03', tx: any): Promise<string> {
    
    // シーケンスを検索・インクリメント (各テーブル固有のシーケンスを使う)
    let sequence = await tx.sequence.findUnique({
        where: { name: seqName },
    });

    if (!sequence) {
        sequence = await tx.sequence.create({
            data: { name: seqName, count: 1 }
        });
    } else {
        sequence = await tx.sequence.update({
            where: { name: seqName },
            data: { count: { increment: 1 } }
        });
    }

    const currentCount = sequence.count;
    const paddedCount = String(currentCount).padStart(COUNT_LENGTH, '0');
    
    return `${paddedCount}${typeCode}`;
}

// ----------------------------------------------------------------------
// 1. 一般利用者（User）登録 (INSERT/UPDATE)
// ----------------------------------------------------------------------
export async function registerUser(formData: FormData, email: string) {
    const nickname = formData.get('nickname') as string;
    const genderId = safeParseInt(formData.get('gender'));
    const ageGroupId = safeParseInt(formData.get('age')); 
    const occupationId = safeParseInt(formData.get('occupation'));

    if (!nickname || !email) {
        return { error: 'ニックネームとメールアドレスは必須です。' };
    }
    
    try {
        const newUser = await prisma.$transaction(async (tx) => {
            
            // 1. Accountの存在確認
            const existingAccount = await tx.account.findUnique({
                where: { email: email },
            });

            if (existingAccount && existingAccount.userId) {
                return { error: 'このメールアドレスは、既に一般利用者（User）として登録済みです。' };
            }

            // 2. Userテーブルに登録
            const customUserId = await getAndIncrementCustomId(SEQUENCE_NAME_USER, '01', tx);
            
            const userData: Prisma.UserCreateInput = {
                userId: customUserId,
                nickname: nickname,
                introduction: null, 
            };
            if (genderId !== undefined) {
                userData.gender = { connect: { genderId: genderId } };
            }
            if (ageGroupId !== undefined) {
                userData.ageGroup = { connect: { ageGroupId: ageGroupId } };
            }
            if (occupationId !== undefined) {
                userData.occupation = { connect: { occupationId: occupationId } };
            }

            const user = await tx.user.create({ data: userData });

            // 3. Accountテーブルの処理 (新規作成 or 更新)
            if (existingAccount) {
                // 既存のAccountレコードを更新
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: {
                        userId: customUserId, // User IDを追記
                        accountType: existingAccount.storeId ? 'Both' : 'User' 
                    }
                });
            } else {
                // 新規Accountレコードを作成
                // ★ Account IDを専用シーケンスから生成 ('03' を適用)
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx); 
                
                await tx.account.create({
                    data: {
                        accountId: customAccountId, // ★ ID指定
                        email: email, 
                        accountType: 'User',
                        userId: customUserId, 
                    }
                });
            }
            
            return user;

        });

        revalidatePath('/'); 
        return { success: true, user: newUser };

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('nickname')) {
                 return { error: 'そのニックネームは既に使用されています。別のニックネームを選んでください。' };
            }
            return { error: '登録に失敗しました（データ重複エラー）。' };
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { error: '選択された性別、年齢層、または職業のデータが見つかりませんでした。入力値が正しいか確認してください。' };
        }
        console.error('User registration error:', error);
        return { error: '一般利用者アカウントの登録に失敗しました。詳細をログで確認してください。' };
    }
}

// ----------------------------------------------------------------------
// 2. ストア（Store）登録 (INSERT/UPDATE)
// ----------------------------------------------------------------------
export async function registerStore(formData: FormData, email: string) {
    const storeName = formData.get('storeName') as string;
    const introduction = formData.get('description') as string; 
    const locationName = formData.get('address') as string; 

    if (!storeName || !email) {
        return { error: '店舗名とメールアドレスは必須です。' };
    }
    
    try {
        const newStore = await prisma.$transaction(async (tx) => {
            
            // 1. Accountの存在確認
            const existingAccount = await tx.account.findUnique({
                where: { email: email },
            });

            if (existingAccount && existingAccount.storeId) {
                return { error: 'このメールアドレスは、既に出店者（Store）として登録済みです。' };
            }

            // 2. Storeテーブルに登録
            const customStoreId = await getAndIncrementCustomId(SEQUENCE_NAME_STORE, '02', tx);
            
            const store = await tx.store.create({
                data: {
                    storeId: customStoreId, // ★ ID指定
                    storeName: storeName,
                    introduction: introduction, 
                }
            });

            // 3. Accountテーブルの処理 (新規作成 or 更新)
            if (existingAccount) {
                // 既存のAccountレコードを更新
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: {
                        storeId: customStoreId, // Store IDを追記
                        accountType: existingAccount.userId ? 'Both' : 'Store'
                    }
                });
            } else {
                // 新規Accountレコードを作成
                // ★ Account IDを専用シーケンスから生成 ('03' を適用)
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx); 

                await tx.account.create({
                    data: {
                        accountId: customAccountId, // ★ ID指定
                        email: email, 
                        accountType: 'Store',
                        storeId: customStoreId, 
                    }
                });
            }


            // 4. StoreOpeningInformation に出店場所を仮登録
            await tx.storeOpeningInformation.create({
                data: {
                    storeId: customStoreId, 
                    locationName: locationName,
                    latitude: 35.6895, 
                    longitude: 139.6917, 
                    openingDate: new Date(), 
                }
            });
            
            return store;

        });

        revalidatePath('/');
        return { success: true, store: newStore };

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('store_name')) {
                 return { error: 'その店舗名は既に使用されています。別の店舗名を選んでください。' };
            }
            return { error: '登録に失敗しました（データ重複エラー）。' };
        }
        console.error('Store registration error:', error);
        return { error: '出店者アカウントの登録に失敗しました。詳細をログで確認してください。' };
    }
}

// ----------------------------------------------------------------------
// 3. ユーザーの存在確認 (認証コールバック用)
// ----------------------------------------------------------------------
export async function findUserByEmail(email: string) {
    try {
        const account = await prisma.account.findUnique({
            where: { email: email }, 
            select: { accountId: true }
        });
        
        return { exists: !!account };
        
    } catch (error) {
        console.error('Find user by email error:', error);
        return { exists: false, error: 'DB search failed' }; 
    }
}