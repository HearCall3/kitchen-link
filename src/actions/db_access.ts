// src/actions/db_access.ts
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
const SEQUENCE_NAME_ACCOUNT = 'account_seq'; 
const SEQUENCE_NAME_OPENING = 'opening_info_seq'; 
const SEQUENCE_NAME_OPINION = 'opinion_seq';      
const SEQUENCE_NAME_QUESTION = 'question_seq';    

const COUNT_LENGTH = 8; // 連番部分の桁数

/**
 * データベースで連番を安全にインクリメントし、カスタムIDを生成する
 */
async function getAndIncrementCustomId(seqName: string, typeCode: string, tx: any): Promise<string> {
    
    // シーケンスを検索・インクリメント
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
// 1. 一般利用者（User）登録 (INSERT/UPDATE) - ロジックは前回通り
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
            
            const existingAccount = await tx.account.findUnique({
                where: { email: email },
            });

            if (existingAccount && existingAccount.userId) {
                return { error: 'このメールアドレスは、既に一般利用者（User）として登録済みです。' };
            }

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

            if (existingAccount) {
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: {
                        userId: customUserId,
                        accountType: existingAccount.storeId ? 'Both' : 'User' 
                    }
                });
            } else {
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx); 
                
                await tx.account.create({
                    data: {
                        accountId: customAccountId,
                        email: email, 
                        accountType: 'User',
                        userId: customUserId, 
                    }
                });
            }
            
            return user;

        });

        revalidatePath('/db'); 
        return { success: true, user: newUser };

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('nickname')) {
                 return { error: 'そのニックネームは既に使用されています。別のニックネームを選んでください。' };
            }
            if (error.meta && (error.meta.target as string[]).includes('email')) {
                 return { error: 'このメールアドレスは既に他のアカウントで使用されています。' };
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
// 2. ストア（Store）登録 (INSERT/UPDATE) - ロジックは前回通り
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
            
            const existingAccount = await tx.account.findUnique({
                where: { email: email },
            });

            if (existingAccount && existingAccount.storeId) {
                return { error: 'このメールアドレスは、既に出店者（Store）として登録済みです。' };
            }

            const customStoreId = await getAndIncrementCustomId(SEQUENCE_NAME_STORE, '02', tx);
            
            const store = await tx.store.create({
                data: {
                    storeId: customStoreId, 
                    storeName: storeName,
                    introduction: introduction, 
                }
            });
            
            // StoreOpeningInformation ID生成
            const customOpeningId = await getAndIncrementCustomId(SEQUENCE_NAME_OPENING, '04', tx);

            if (existingAccount) {
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: {
                        storeId: customStoreId, 
                        accountType: existingAccount.userId ? 'Both' : 'Store'
                    }
                });
            } else {
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx); 

                await tx.account.create({
                    data: {
                        accountId: customAccountId, 
                        email: email, 
                        accountType: 'Store',
                        storeId: customStoreId, 
                    }
                });
            }

            // StoreOpeningInformation に出店場所を仮登録
            await tx.storeOpeningInformation.create({
                data: {
                    storeOpeningInformationId: customOpeningId, // ★ ID指定
                    storeId: customStoreId, 
                    locationName: locationName,
                    latitude: 35.6895, 
                    longitude: 139.6917, 
                    openingDate: new Date(), 
                }
            });
            
            return store;

        });

        revalidatePath('/db');
        return { success: true, store: newStore };

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('store_name')) {
                 return { error: 'その店舗名は既に使用されています。別の店舗名を選んでください。' };
            }
            if (error.meta && (error.meta.target as string[]).includes('email')) {
                 return { error: 'このメールアドレスは既に他のアカウントで使用されています。' };
            }
            return { error: '登録に失敗しました（データ重複エラー）。' };
        }
        console.error('Store registration error:', error);
        return { error: '出店者アカウントの登録に失敗しました。詳細をログで確認してください。' };
    }
}


// ----------------------------------------------------------------------
// 3. 更新 (UPDATE) - IDをStringに変更し、User/Storeの更新に集中
// ----------------------------------------------------------------------
// IDの型を number から string に変更
export async function updateAccount(id: string, formData: FormData) {
    // フォームデータから取得
    const introduction = formData.get('introduction') as string;
    const storeName = formData.get('storeName') as string; 
    
    // マスタIDは Int のまま
    const genderId = safeParseInt(formData.get('genderCode'));
    const ageGroupCode = safeParseInt(formData.get('ageGroupCode'));
    const occupationCode = safeParseInt(formData.get('occupationCode'));

    const existingAccount = await prisma.account.findUnique({
        where: { accountId: id }, // accountId は string
        select: { accountType: true, userId: true, storeId: true }
    });

    if (!existingAccount) {
        return { error: 'Account not found for update.' };
    }
    
    try {
        await prisma.$transaction(async (tx) => {
            
            // User or Both の場合、Userテーブルを更新
            if (existingAccount.userId) {
                
                const userData: Prisma.UserUpdateInput = {
                    introduction: introduction, // Userテーブルのintroductionを更新
                };

                // マスタデータ接続/切断ロジック
                if (genderId !== undefined) {
                    userData.gender = { connect: { genderId: genderId } };
                } 
                if (ageGroupCode !== undefined) {
                    userData.ageGroup = { connect: { ageGroupId: ageGroupCode } };
                } 
                if (occupationCode !== undefined) {
                    userData.occupation = { connect: { occupationId: occupationCode } };
                }

                await tx.user.update({
                    where: { userId: existingAccount.userId },
                    data: userData,
                });
            }

            // Store or Both の場合、Storeテーブルを更新
            if (existingAccount.storeId) {
                await tx.store.update({
                    where: { storeId: existingAccount.storeId },
                    data: {
                        storeName: storeName, // StoreテーブルのstoreNameを更新
                        introduction: introduction, // Storeテーブルのintroductionを更新
                    },
                });
            }
            
            // ★ Accountテーブル自体には更新は不要 (introductionがないため)
            // AccountUpdateInputのエラーを回避するため、ここでは何も実行しない
            
        }); // $transaction end

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        // P2002 (重複) と P2025 (レコードが見つからない) のエラーハンドリングを修正
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             if (error.meta && (error.meta.target as string[]).includes('store_name')) {
                 return { error: '更新に失敗: その店舗名は既に使用されています。' };
             }
             return { error: '更新に失敗: データ重複エラーが発生しました。' };
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { error: '更新に失敗: 選択されたマスタデータIDが存在しません。' };
        }
        
        console.error('Account update error:', error);
        return { error: 'アカウント情報の更新に失敗しました。詳細をログで確認してください。' };
    }
}

// ----------------------------------------------------------------------
// 4. 削除 (DELETE) - ロジックは前回通り
// ----------------------------------------------------------------------
export async function deleteAccount(id: string) {
    
    const existingAccount = await prisma.account.findUnique({
        where: { accountId: id }, 
        select: { userId: true, storeId: true }
    });

    if (!existingAccount) {
        return { error: 'Account not found for deletion.' };
    }
    
    try {
        await prisma.$transaction(async (tx) => {
            // 1. 依存するトランザクションデータを削除
            await tx.pressLike.deleteMany({ where: { accountId: id } }); 
            await tx.questionAnswer.deleteMany({ where: { accountId: id } });
            await tx.postAnOpinion.deleteMany({ where: { accountId: id } });

            // 2. 関連する User/Store テーブルを削除
            if (existingAccount.userId) {
                await tx.user.delete({ where: { userId: existingAccount.userId } });
            }
            if (existingAccount.storeId) {
                await tx.storeOpeningInformation.deleteMany({ where: { storeId: existingAccount.storeId } });
                await tx.question.deleteMany({ where: { storeId: existingAccount.storeId } }); 
                await tx.store.delete({ where: { storeId: existingAccount.storeId } });
            }

            // 3. Account を削除
            await tx.account.delete({
                where: { accountId: id },
            });
        });


        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Account deletion error:', error);
        return { error: 'アカウントの削除に失敗しました。関連するデータの問題を確認してください。' };
    }
}