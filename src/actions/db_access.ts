// src/actions/db_access.ts (全機能を実装し、User/StoreのCRUD)
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * メールアドレスをSHA-256でハッシュ化する関数
 * 大文字・小文字を区別しない検索を可能にするため、メールアドレスを小文字に変換してからハッシュ化します。
 * @param email ハッシュ化するメールアドレス
 * @returns ハッシュ化されたメールアドレス文字列
 */
function hashEmail(email: string): string {
    // メールアドレスは小文字に変換してからハッシュ化することで、大文字・小文字を区別しない検索を可能にする
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

/**
 * FormDataから数値を安全にパースし、undefinedを返すユーティリティ関数
 * 数値でない場合や空文字列の場合はundefinedを返します。
 * @param value FormDataから取得した値
 * @returns パースされた数値またはundefined
 */
function safeParseInt(value: FormDataEntryValue | null): number | undefined {
    if (value === null || value === '') return undefined;
    const num = parseInt(value as string);
    return isNaN(num) ? undefined : num;
}

// ===================================================================
// ★ カウントアップ式カスタムID生成ロジックと定数
// ===================================================================

/**
 * ユーザー用のシーケンス名定数
 * IDの末尾に'01'を付与してユーザーIDを生成します。
 */
const SEQUENCE_NAME_USER = 'user_seq';      // 01

/**
 * ストア用のシーケンス名定数
 * IDの末尾に'02'を付与してストアIDを生成します。
 */
const SEQUENCE_NAME_STORE = 'store_seq';    // 02

/**
 * アカウント用のシーケンス名定数
 * IDの末尾に'03'を付与してアカウントIDを生成します。
 */
const SEQUENCE_NAME_ACCOUNT = 'account_seq';// 03

/**
 * 出店情報用のシーケンス名定数
 * IDの末尾に'04'を付与して出店情報IDを生成します。
 */
const SEQUENCE_NAME_OPENING = 'opening_info_seq'; // 04

/**
 * 意見投稿用のシーケンス名定数
 * IDの末尾に'05'を付与して意見IDを生成します。
 */
const SEQUENCE_NAME_OPINION = 'opinion_seq';      // 05

/**
 * アンケート用のシーケンス名定数
 * IDの末尾に'06'を付与してアンケートIDを生成します。
 */
const SEQUENCE_NAME_QUESTION = 'question_seq';    // 06

/**
 * カスタムIDのカウント部分の桁数
 * カウントを8桁のゼロ埋め文字列に変換します。
 */
const COUNT_LENGTH = 8;

/**
 * データベースで連番を安全にインクリメントし、カスタムIDを生成する関数
 * トランザクション内でシーケンスを検索・インクリメントし、カウントをゼロ埋めしてタイプコードを付与します。
 * これにより、テーブルごとにユニークなIDを生成し、競合を防ぎます。
 * @param seqName シーケンス名（例: 'user_seq'）
 * @param typeCode IDの末尾に付与するタイプコード（例: '01'）
 * @param tx トランザクションクライアント
 * @returns 生成されたカスタムID文字列
 */
async function getAndIncrementCustomId(seqName: string, typeCode: string, tx: any): Promise<string> {

    // シーケンスを検索・インクリメント (トランザクション内で実行)
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
// 1. 一般利用者（User）CRUD
// ----------------------------------------------------------------------

/**
 * 一般利用者（User）を作成する関数
 * メールアドレスをハッシュ化し、既存のアカウントを確認した上で、UserレコードとAccountレコードを作成または更新します。
 * トランザクションを使用することで、データの一貫性を確保します。
 * @param formData ユーザー作成フォームデータ
 * @param email ユーザーのメールアドレス
 * @returns 成功時はユーザーオブジェクト、エラー時はエラーメッセージ
 */
export async function createUser(formData: FormData, email: string) {
    const hashedEmail = hashEmail(email); // ★ 追加: ハッシュ化 ★
    console.log(`[DB] START: Creating User for email: ${hashedEmail}`);
    const nickname = formData.get('nickname') as string;
    const genderId = safeParseInt(formData.get('gender'));
    const ageGroupId = safeParseInt(formData.get('age'));
    const occupationId = safeParseInt(formData.get('occupation'));

    if (!nickname || !email) {
        return { error: 'ニックネームとメールアドレスは必須です。' };
    }

    try {
        const newUser = await prisma.$transaction(async (tx) => {
            // 既存のアカウントをチェック（同じメールアドレスでUserが既に登録されていないか確認）
            const existingAccount = await tx.account.findUnique({ where: { email: hashedEmail } });
            if (existingAccount && existingAccount.userId) {
                return { error: 'このメールアドレスは、既に一般利用者（User）として登録済みです。' };
            }

            // カスタムIDを生成（ユーザー用）
            const customUserId = await getAndIncrementCustomId(SEQUENCE_NAME_USER, '01', tx);
            console.log(`[DB] Generated User ID: ${customUserId}`);

            // Userデータを作成（性別、年齢層、職業はオプションで関連付け）
            const userData: Prisma.UserCreateInput = { userId: customUserId, nickname: nickname, introduction: null };
            if (genderId !== undefined) { userData.gender = { connect: { genderId: genderId } }; }
            if (ageGroupId !== undefined) { userData.ageGroup = { connect: { ageGroupId: ageGroupId } }; }
            if (occupationId !== undefined) { userData.occupation = { connect: { occupationId: occupationId } }; }

            const user = await tx.user.create({ data: userData });

            // Accountレコードの作成または更新（ハイブリッドアカウント対応）
            if (existingAccount) {
                // 既存のアカウントがある場合、userIdを追加してアカウントタイプを更新
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: { userId: customUserId, accountType: existingAccount.storeId ? 'Both' : 'User' }
                });
            } else {
                // 新規アカウント作成
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx);
                await tx.account.create({
                    data: { accountId: customAccountId, email: hashedEmail, accountType: 'User', userId: customUserId }
                });
            }
            return user;
        });

        revalidatePath('/db');
        return { success: true, user: newUser };

    } catch (error) {
        console.error('User creation failed:', error);
        // Prisma固有のエラーハンドリング（ユニーク制約違反など）
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('nickname')) { return { error: 'そのニックネームは既に使用されています。' }; }
            if (error.meta && (error.meta.target as string[]).includes('email')) { return { error: 'このメールアドレスは既に他のアカウントで使用されています。' }; }
        }
        // 外部キー制約違反（性別、年齢層、職業のIDが存在しない場合）
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { error: '選択された性別、年齢層、または職業のデータが見つかりませんでした。入力値が正しいか確認してください。' };
        }
        return { error: '一般利用者アカウントの登録に失敗しました。' };
    } finally {
        console.log(`[DB] END: Creating User.`);
    }
}

/** 1-B. 利用者更新 (User Update) */
export async function updateUser(accountId: string, formData: FormData) {
    console.log(`[DB] START: Updating User for Account ID: ${accountId}`);
    const nickname = formData.get('nickname') as string;
    const genderName = formData.get('genderName') as string;
    const ageGroupName = formData.get('ageGroupName') as string;
    const occupationName = formData.get('occupationName') as string;

    // アカウントIDからuserIdを取得（Userが存在するか確認）
    const existingAccount = await prisma.account.findUnique({
        where: { accountId: accountId }, // Stringのまま使用
        select: { userId: true }
    });

    if (!existingAccount || !existingAccount.userId) {
        return { error: 'Userアカウント情報が見つかりません。' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // マスタデータ名（例: "男性"）からIDを取得（トランザクションクライアントtxを使用）
            const genderId = await getMasterIdByName(tx, 'Gender', genderName);
            const ageGroupId = await getMasterIdByName(tx, 'AgeGroup', ageGroupName);
            const occupationId = await getMasterIdByName(tx, 'Occupation', occupationName);

            // 更新するデータを構築（IDが取得できた場合のみ関連付け）
            const userData: Prisma.UserUpdateInput = {
                nickname: nickname,
            };

            // IDが取得できた場合のみconnect句を設定
            if (genderId !== null) { userData.gender = { connect: { genderId: genderId } }; }
            if (ageGroupId !== null) { userData.ageGroup = { connect: { ageGroupId: ageGroupId } }; }
            if (occupationId !== null) { userData.occupation = { connect: { occupationId: occupationId } }; }

            // Userテーブルを更新
            await tx.user.update({
                where: { userId: existingAccount.userId! }, // userIdもString型
                data: userData,
            });
            console.log(`[DB] User ID ${existingAccount.userId} updated.`);
        });

        return { success: true };

    } catch (error) {
        // エラーハンドリング（Prismaエラーなど）
        console.error('User update failed:', error);
        return { error: '利用者アカウント情報の更新に失敗しました。' };
    } finally {
        console.log(`[DB] END: Updating User.`);
    }
}

/** 1-C. 利用者削除 (User Delete - プロファイル解除) */
export async function deleteUser(accountId: string) {
    console.log(`[DB] START: Deleting User Profile for Account ID: ${accountId}`);

    // アカウント情報を取得（userIdとstoreIdを確認してハイブリッドアカウントか判定）
    const account = await prisma.account.findUnique({
        where: { accountId: accountId },
        select: { userId: true, storeId: true, accountType: true }
    });

    if (!account || !account.userId) {
        return { error: 'Userアカウント情報が見つかりません。' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const isHybrid = account.storeId !== null; // ハイブリッドアカウント（UserとStoreの両方を持つ）か判定

            // Userに紐づく依存データを削除（外部キー制約を満たすため）
            await tx.pressLike.deleteMany({ where: { accountId: accountId } }); // いいね
            await tx.questionAnswer.deleteMany({ where: { accountId: accountId } }); // アンケート回答
            await tx.postAnOpinion.deleteMany({ where: { accountId: accountId } }); // 意見投稿
            console.log(`[DB] Deleted dependencies for Account ID ${accountId}.`);

            // Userレコードを削除
            await tx.user.delete({ where: { userId: account.userId! } });
            console.log(`[DB] Deleted User ID ${account.userId}.`);

            // Accountレコードの更新または削除（ハイブリッドの場合はStoreのみに変更、新規の場合は削除）
            if (isHybrid) {
                await tx.account.update({
                    where: { accountId: accountId },
                    data: { userId: null, accountType: 'Store' } // Storeのみに変更
                });
                console.log(`[DB] Account ID ${accountId} updated to Store.`);
            } else {
                await tx.account.delete({ where: { accountId: accountId } }); // アカウント削除
                console.log(`[DB] Deleted Account ID ${accountId}.`);
            }
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('User deletion failed:', error);
        return { error: '利用者アカウントの削除に失敗しました。' };
    } finally {
        console.log(`[DB] END: Deleting User Profile.`);
    }
}


// ----------------------------------------------------------------------
// 2. ストア（Store）CRUD
// ----------------------------------------------------------------------

/**
 * ストア（Store）を作成する関数
 * メールアドレスをハッシュ化し、既存のアカウントを確認した上で、StoreレコードとAccountレコードを作成または更新します。
 * トランザクションを使用することで、データの一貫性を確保します。
 * @param formData ストア作成フォームデータ
 * @param email ストアのメールアドレス
 * @returns 成功時はストアオブジェクト、エラー時はエラーメッセージ
 */
export async function createStore(formData: FormData, email: string) {
    console.log(`[DB] START: Creating Store for email: ${email}`);
    const storeName = formData.get('storeName') as string;
    const introduction = formData.get('description') as string;
    const storeUrl = (formData.get('storeUrl') as string) || null;
    // ハッシュ値を使用
    const hashedEmail = hashEmail(email);


    if (!storeName || !email) {
        return { error: '店舗名とメールアドレスは必須です。' };
    }

    try {
        const newStore = await prisma.$transaction(async (tx) => {
            // 既存のアカウントをチェック（同じメールアドレスでStoreが既に登録されていないか確認）
            const existingAccount = await tx.account.findUnique({ where: { email: hashedEmail } });
            if (existingAccount && existingAccount.storeId) {
                return { error: 'このメールアドレスは、既に出店者（Store）として登録済みです。' };
            }

            // カスタムIDを生成（ストア用）
            const customStoreId = await getAndIncrementCustomId(SEQUENCE_NAME_STORE, '02', tx);
            console.log(`[DB] Generated Store ID: ${customStoreId}`);

            // Storeレコードを作成
            const store = await tx.store.create({
                data: { storeId: customStoreId, storeName: storeName, introduction: introduction, storeUrl: storeUrl }
            });

            // StoreOpeningInformationの仮登録は削除済み

            // Accountレコードの作成または更新（ハイブリッドアカウント対応）
            if (existingAccount) {
                // 既存のアカウントがある場合、storeIdを追加してアカウントタイプを更新
                await tx.account.update({
                    where: { accountId: existingAccount.accountId },
                    data: { storeId: customStoreId, accountType: existingAccount.userId ? 'Both' : 'Store' }
                });
            } else {
                // 新規アカウント作成
                const customAccountId = await getAndIncrementCustomId(SEQUENCE_NAME_ACCOUNT, '03', tx);
                await tx.account.create({
                    data: { accountId: customAccountId, email: hashedEmail, accountType: 'Store', storeId: customStoreId }
                });
            }

            return store;
        });

        revalidatePath('/db');
        return { success: true, store: newStore };

    } catch (error) {
        console.error('Store creation failed:', error);
        // Prisma固有のエラーハンドリング（ユニーク制約違反など）
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('store_name')) { return { error: 'その店舗名は既に使用されています。' }; }
            if (error.meta && (error.meta.target as string[]).includes('email')) { return { error: 'このメールアドレスは既に他のアカウントで使用されています。' }; }
        }
        return { error: '出店者アカウントの登録に失敗しました。' };
    } finally {
        console.log(`[DB] END: Creating Store.`);
    }
}

/** 2-B. ストア更新 (Store Update) */
export async function updateStore(accountId: string, formData: FormData) {
    console.log(`[DB] START: Updating Store for Account ID: ${accountId}`);
    const introduction = formData.get('introduction') as string;
    const storeName = formData.get('storeName') as string;
    const storeUrl = (formData.get('storeUrl') as string) || null;

    // アカウントIDからstoreIdを取得（Storeが存在するか確認）
    const existingAccount = await prisma.account.findUnique({
        where: { accountId: accountId },
        select: { storeId: true }
    });

    if (!existingAccount || !existingAccount.storeId) {
        return { error: 'Storeアカウント情報が見つかりません。' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 更新するデータオブジェクトを構築
            const storeData: Prisma.StoreUpdateInput = {
                storeName: storeName,
                introduction: introduction,
                // ★ 修正 2: storeUrl をデータに追加 ★
                storeUrl: storeUrl,
            };

            // Storeテーブルを更新
            await tx.store.update({
                // storeId は Account テーブルから取得したものを使用
                where: { storeId: existingAccount.storeId! },
                // ★ 修正 3: 構築したデータオブジェクトを使用 ★
                data: storeData,
            });
            console.log(`[DB] Store ID ${existingAccount.storeId} updated.`);
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Store update failed:', error);
        // ユニーク制約違反のエラーハンドリング
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            if (error.meta && (error.meta.target as string[]).includes('store_name')) { return { error: '更新に失敗: その店舗名は既に使用されています。' }; }
        }
        return { error: '出店者アカウント情報の更新に失敗しました。' };
    } finally {
        console.log(`[DB] END: Updating Store.`);
    }
}

/** 2-C. ストア削除 (Store Delete - プロファイル解除) */
export async function deleteStore(accountId: string) {
    console.log(`[DB] START: Deleting Store Profile for Account ID: ${accountId}`);

    // アカウント情報を取得（userIdとstoreIdを確認してハイブリッドアカウントか判定）
    const account = await prisma.account.findUnique({
        where: { accountId: accountId },
        select: { userId: true, storeId: true, accountType: true }
    });

    if (!account || !account.storeId) {
        return { error: 'Storeアカウント情報が見つかりません。' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const isHybrid = account.userId !== null; // ハイブリッドアカウント（UserとStoreの両方を持つ）か判定
            const storeIdToDelete = account.storeId!;

            // Storeに紐づく依存データを削除（外部キー制約を満たすため）
            await tx.storeOpeningInformation.deleteMany({ where: { storeId: storeIdToDelete } }); // 出店情報
            console.log(`[DB] Deleted dependencies for Store ID ${storeIdToDelete}.`);

            // Storeレコードを削除
            await tx.store.delete({ where: { storeId: storeIdToDelete } });
            console.log(`[DB] Deleted Store ID ${storeIdToDelete}.`);

            // Accountレコードの更新または削除（ハイブリッドの場合はUserのみに変更、新規の場合は削除）
            if (isHybrid) {
                await tx.account.update({
                    where: { accountId: accountId },
                    data: { storeId: null, accountType: 'User' } // Userのみに変更
                });
                console.log(`[DB] Account ID ${accountId} updated to User.`);
            } else {
                await tx.account.delete({ where: { accountId: accountId } }); // アカウント削除
                console.log(`[DB] Deleted Account ID ${accountId}.`);
            }
        });

        revalidatePath('/db');
        return { success: true };

    } catch (error) {
        console.error('Store deletion failed:', error);
        return { error: '出店者アカウントの削除に失敗しました。' };
    } finally {
        console.log(`[DB] END: Deleting Store Profile.`);
    }
}


// ----------------------------------------------------------------------
// 3. 意見投稿（Opinion）CRUD
// ----------------------------------------------------------------------

/**
 * 意見投稿を作成する関数
 * アカウントID、コメント、緯度経度、タグを基にPostAnOpinionとOpinionTagsレコードを作成します。
 * トランザクションを使用することで、意見とタグの関連付けが確実に作成されます。
 * @param formData 意見作成フォームデータ
 * @returns 成功時は意見オブジェクト、エラー時はエラーメッセージ
 */
export async function createOpinion(formData: FormData) {
    console.log(`[DB] START: Creating Opinion.`);
    const accountId = formData.get('accountId') as string;
    const commentText = formData.get('commentText') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const tagValue = formData.get('tagValue') as string;

    if (!accountId || !commentText || isNaN(latitude) || isNaN(longitude)) {
        return { error: 'アカウントID、コメント、および緯度経度は必須です。' };
    }

    try {
        const newOpinion = await prisma.$transaction(async (tx) => {
            // アカウントの存在確認
            const existingAccount = await tx.account.findUnique({ where: { accountId: accountId } });
            if (!existingAccount) { return { error: '指定されたアカウントIDは存在しません。' }; }

            // TagテーブルからtagValueに対応するTag IDを検索
            const tag = await tx.tag.findFirst({
                where: { tagName: tagValue },
                select: { tagId: true }
            });

            if (!tag) {
                return { error: '指定されたタグが見つかりませんでした。タグマスタを確認してください。' };
            }

            // カスタムIDを生成（意見用）
            const customOpinionId = await getAndIncrementCustomId(SEQUENCE_NAME_OPINION, '05', tx);

            // PostAnOpinionレコードを作成
            const opinion = await tx.postAnOpinion.create({
                data: {
                    postAnOpinionId: customOpinionId,
                    accountId: accountId,
                    commentText: commentText,
                    latitude: latitude,
                    longitude: longitude,
                    postedAt: new Date(),
                }
            });

            // OpinionTagsテーブルにレコードを挿入（意見とタグを紐づけ）
            await tx.opinionTags.create({
                data: {
                    postAnOpinionId: customOpinionId,
                    tagId: tag.tagId,
                }
            });

            return opinion;
        });

        revalidatePath('/db/opinion');
        return { success: true, opinion: newOpinion };

    } catch (error) {
        console.error('Opinion creation failed:', error);
        return { error: '意見投稿の作成に失敗しました。' };
    } finally {
        console.log(`[DB] END: Creating Opinion.`);
    }
}

/** 3-B. 意見更新 (Opinion Update) */
export async function updateOpinion(id: string, formData: FormData) {
    console.log(`[DB] START: Updating Opinion ID: ${id}`);
    const commentText = formData.get('commentText') as string;

    if (!commentText) {
        return { error: 'コメントテキストは必須です。' };
    }

    try {
        // 意見のコメントを更新（他のフィールドは変更しない）
        const updatedOpinion = await prisma.postAnOpinion.update({
            where: { postAnOpinionId: id },
            data: { commentText: commentText }
        });

        revalidatePath('/db/opinion');
        return { success: true, opinion: updatedOpinion };

    } catch (error) {
        console.error('Opinion update failed:', error);
        return { error: '意見投稿の更新に失敗しました。' };
    } finally {
        console.log(`[DB] END: Updating Opinion.`);
    }
}

/** 3-C. 意見削除 (Opinion Delete) */
export async function deleteOpinion(id: string) {
    console.log(`[DB] START: Deleting Opinion ID: ${id}`);

    try {
        await prisma.$transaction(async (tx) => {
            // 意見に紐づく依存データを削除（外部キー制約を満たすため）
            await tx.pressLike.deleteMany({ where: { postAnOpinionId: id } }); // いいね
            await tx.opinionTags.deleteMany({ where: { postAnOpinionId: id } }); // タグ関連
            console.log(`[DB] Deleted dependencies for Opinion ID ${id}.`);

            // 意見投稿本体を削除
            const deletedOpinion = await tx.postAnOpinion.delete({
                where: { postAnOpinionId: id },
            });
            console.log(`[DB] Deleted Opinion ID ${id}.`);
            return deletedOpinion;
        });

        revalidatePath('/db/opinion');
        return { success: true };
    } catch (error) {
        console.error('Opinion deletion failed:', error);
        return { error: '意見投稿の削除に失敗しました。' };
    } finally {
        console.log(`[DB] END: Deleting Opinion.`);
    }
}

/** 3-D. 全意見の取得 (Get All Opinions with User Info) */
export async function getAllOpinions() {
    console.log(`[DB] START: Fetching all Opinions.`);
    try {
        // PostAnOpinionテーブルから全レコードを取得（新しい順にソート）
        const opinions = await prisma.postAnOpinion.findMany({
            orderBy: { postedAt: 'desc' }, // 新しい順にソート
            select: {
                postAnOpinionId: true,
                commentText: true,
                latitude: true,
                longitude: true,
                postedAt: true,
                // 作成者情報（Account -> User -> Master Data）を結合して取得
                account: {
                    select: {
                        user: {
                            select: {
                                nickname: true,
                                introduction: true,
                                gender: { select: { genderName: true } },
                                ageGroup: { select: { ageGroupName: true } },
                                occupation: { select: { occupationName: true } }
                            }
                        },
                        // ハイブリッドアカウントの場合、店舗名を取得
                        store: {
                            select: { storeName: true }
                        }
                    }
                },
                // いいねの数を取得（カウント用）
                likes: {
                    select: { accountId: true }
                },
                // タグ情報を取得
                opinionTags: {
                    select: {
                        tag: {
                            select: { tagName: true }
                        }
                    }
                }
            }
        });

        // クライアント側で扱いやすい形式にデータを加工
        const processedOpinions = opinions.map(o => {
            let creatorName = '匿名ユーザー'; // デフォルトの作成者名
            let profile = { gender: '', age: '', occupation: '' }; // プロフィールデータ用のオブジェクト

            // ユーザー情報（一般利用者）を優先して処理
            if (o.account?.user?.nickname) {
                // デバッグログ（開発時のみ）
                console.log("--- DEBUG OPINION PROFILE ---");
                console.log("Nickname:", o.account.user.nickname);
                console.log("Gender Data:", o.account.user.gender);
                console.log("AgeGroup Data:", o.account.user.ageGroup);
                console.log("Occupation Data:", o.account.user.occupation);
                console.log("-----------------------------");

                creatorName = o.account.user.nickname;

                // ユーザー属性の値を抽出（未設定の場合は'未設定'）
                profile.gender = o.account.user.gender?.genderName || '未設定';
                profile.age = o.account.user.ageGroup?.ageGroupName || '未設定';
                profile.occupation = o.account.user.occupation?.occupationName || '未設定';
            }
            // ユーザー情報がなく、ストア情報がある場合（店舗アカウント）
            else if (o.account?.store?.storeName) {
                creatorName = o.account.store.storeName + ' (店舗)';
                profile = { gender: '店舗', age: '', occupation: '' }; // 店舗の場合は属性をクリア
            }

            return {
                opinionId: o.postAnOpinionId,
                commentText: o.commentText,
                latitude: o.latitude,
                longitude: o.longitude,
                postedAt: o.postedAt,
                likeCount: o.likes.length, // いいねの数
                creatorName: creatorName,
                tags: o.opinionTags.map(ot => ot.tag.tagName), // タグ名の配列
                profile: profile // 処理されたプロフィール情報
            };
        });

        console.log(`[DB] END: Fetched ${opinions.length} Opinions.`);
        return { success: true, opinions: processedOpinions };

    } catch (error) {
        console.error('Fetching opinions failed:', error);
        return { success: false, error: '意見リストの取得に失敗しました。' };
    }
}


// ----------------------------------------------------------------------
// 4. アンケート（Question）と回答（Answer）
// ----------------------------------------------------------------------

/**
 * アンケートを作成する関数
 * ストアID、質問文、選択肢、位置情報を基にQuestionレコードを作成します。
 * トランザクションを使用することで、ストアの存在確認とデータ作成を一貫して行います。
 * @param formData アンケート作成フォームデータ
 * @returns 成功時は質問オブジェクト、エラー時はエラーメッセージ
 */
export async function createQuestion(formData: FormData) {
    console.log(`[DB] START: Creating Question.`);
    const accountId = formData.get('accountId') as string;
    const storeId = formData.get('storeId') as string;
    const questionText = formData.get('questionText') as string;
    const option1Text = formData.get('option1Text') as string;
    const option2Text = formData.get('option2Text') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);

    if (!accountId || !storeId || !questionText || !option1Text || !option2Text || isNaN(latitude) || isNaN(longitude)) {
        return { error: '必須フィールドが不足しています。' };
    }

    try {
        const newQuestion = await prisma.$transaction(async (tx) => {
            // ストアの存在確認
            const existingAccount = await tx.account.findUnique({ where: { accountId: accountId } });
            if (!existingAccount) { return { error: '指定されたアカウントIDは存在しません。' }; }

            // カスタムIDを生成（アンケート用）
            const customQuestionId = await getAndIncrementCustomId(SEQUENCE_NAME_QUESTION, '06', tx);

            // Questionレコードを作成
            const question = await tx.question.create({
                data: {
                    questionId: customQuestionId,
                    accountId: accountId,
                    questionText: questionText,
                    option1Text: option1Text,
                    option2Text: option2Text,
                    latitude: latitude,
                    longitude: longitude,
                }
            });
            return question;
        });

        revalidatePath('/db/questions-and-answers');
        return { success: true, question: newQuestion };

    } catch (error) {
        console.error('Questionnaire creation failed:', error);
        return { error: 'アンケートの作成に失敗しました。' };
    } finally {
        console.log(`[DB] END: Creating Question.`);
    }
}

/** 4-B. アンケート回答 (Question Answer) */
export async function answerQuestion(formData: FormData) {
    console.log(`[DB] START: Answering Question.`);
    const accountId = formData.get('accountId') as string;
    const questionId = formData.get('questionId') as string;
    const selectedOptionNumber = safeParseInt(formData.get('selectedOptionNumber'));

    if (!accountId || !questionId || selectedOptionNumber === undefined) {
        return { error: 'アカウントID、アンケートID、選択肢番号は必須です。' };
    }

    // 選択肢番号のバリデーション（1または2のみ許可）
    if (selectedOptionNumber !== 1 && selectedOptionNumber !== 2) {
        return { error: '選択肢番号は1または2である必要があります。' };
    }

    try {
        // 複合主キーのレコードをupsert（更新または新規作成）
        const answer = await prisma.questionAnswer.upsert({
            where: {
                // 複合主キーの指定（accountId_questionId）
                accountId_questionId: {
                    accountId: accountId,
                    questionId: questionId,
                },
            },
            update: { selectedOptionNumber: selectedOptionNumber, answeredAt: new Date() }, // 既存の場合更新
            create: { // 新規の場合作成
                accountId: accountId,
                questionId: questionId,
                selectedOptionNumber: selectedOptionNumber,
                answeredAt: new Date(),
            },
        });

        revalidatePath('/db/questions-and-answers');
        return { success: true, answer: answer };

    } catch (error) {
        console.error('Question answer failed:', error);
        // 外部キー制約違反（アカウントまたは質問が存在しない場合）
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { error: '指定されたアカウントIDまたはアンケートIDが存在しません。' };
        }
        return { error: 'アンケート回答の処理に失敗しました。' };
    } finally {
        console.log(`[DB] END: Answering Question.`);
    }
}

/** 4-C. 全アンケートの取得 (Get All Questions with Store Name) */
export async function getAllQuestions() {
    console.log(`[DB] START: Fetching all Questions.`);
    try {
        // Questionテーブルから全レコードを取得（新しい順にソート）
        const questions = await prisma.question.findMany({
            orderBy: { questionId: 'desc' }, // 新しい順にソート
            select: {
                questionId: true,
                questionText: true,
                option1Text: true,
                option2Text: true,
                latitude: true,
                longitude: true,
                // Accountテーブルを結合してアカウント情報を取得
                account: {
                    select: { accountId: true }
                },
                // 回答数をカウントするためにanswersを含める
                answers: {
                    select: { accountId: true, selectedOptionNumber: true }
                }
            }
        });

        // クライアント側で扱いやすい形式にデータを加工
        const processedQuestions = questions.map(q => {
            const totalAnswers = q.answers.length;
            // 各選択肢の回答数をカウント
            const option1Count = q.answers.filter(a => a.selectedOptionNumber === 1).length;
            const option2Count = q.answers.filter(a => a.selectedOptionNumber === 2).length;

            return {
                questionId: q.questionId,
                questionText: q.questionText,
                option1Text: q.option1Text,
                option2Text: q.option2Text,
                accountId: q.account.accountId, // 修正: storeName を削除
                latitude: q.latitude,
                longitude: q.longitude,
                totalAnswers: totalAnswers,
                option1Count: option1Count,
                option2Count: option2Count,
                answers: q.answers, // 詳細な回答データも含める
            };
        });

        console.log(`[DB] END: Fetched ${questions.length} Questions.`);
        return { success: true, questions: processedQuestions };

    } catch (error) {
        console.error('Fetching questions failed:', error);
        return { success: false, error: 'アンケートリストの取得に失敗しました。' };
    }
}

/** 4-d. アンケート回答の集計結果取得 (Get Poll Results) */
export async function getQuestionAnswerCounts(questionId: string) {
    console.log(`[DB] START: Fetching answer counts for Question ID: ${questionId}`);
    try {
        // QuestionAnswerテーブルをselectedOptionNumberでグループ化してカウント
        const counts = await prisma.questionAnswer.groupBy({
            by: ['selectedOptionNumber'],
            where: {
                questionId: questionId,
            },
            _count: {
                selectedOptionNumber: true,
            },
        });

        // 結果を整理（選択肢1と2のカウントを取得）
        const result = {
            count1: counts.find(c => c.selectedOptionNumber === 1)?._count.selectedOptionNumber || 0,
            count2: counts.find(c => c.selectedOptionNumber === 2)?._count.selectedOptionNumber || 0,
        };

        console.log(`[DB] END: Fetched counts: Option1=${result.count1}, Option2=${result.count2}`);
        return { success: true, counts: result };

    } catch (error) {
        console.error('Fetching question answer counts failed:', error);
        return { success: false, error: '回答数の取得に失敗しました。' };
    }
}


// ----------------------------------------------------------------------
// 5. いいね操作 (PressLike)
// ----------------------------------------------------------------------

/**
 * いいね操作をトグルする関数
 * 指定されたアカウントと意見の組み合わせで、いいねが存在すれば削除、存在しなければ作成します。
 * トランザクションは使用せず、個別のクエリで処理します。
 * @param accountId いいねを行うアカウントID
 * @param opinionId 対象の意見ID
 * @returns 成功時はいいね状態とカウント、エラー時はエラーメッセージ
 */
export async function toggleLike(accountId: string, opinionId: string) {
    console.log(`[DB] START: Toggling Like.`);
    console.log(`[DB DEBUG] Account ID: ${accountId}`);
    console.log(`[DB DEBUG] Opinion ID: ${opinionId}`);
    if (!accountId || !opinionId) {
        return { error: 'アカウントIDと意見IDは必須です。' };
    }

    // 複合主キーの命名規則に従い、スキーマの@@id([postAnOpinionId, accountId])から命名
    const compositeWhere = {
        postAnOpinionId_accountId: {
            accountId: accountId,
            postAnOpinionId: opinionId,
        }
    };

    try {
        let isLiked: boolean; // トグル後の状態を保持

        // 既存のいいねがあるかチェック
        const existingLike = await prisma.pressLike.findUnique({
            where: compositeWhere,
        });

        if (existingLike) {
            // いいねが存在する場合: 削除（アンライク）
            await prisma.pressLike.delete({ where: compositeWhere });
            isLiked = false; // 削除したので、新しい状態は「いいねなし」
            console.log(`[DB] Like removed by Account ${accountId}.`);
        } else {
            // いいねが存在しない場合: 作成（ライク）
            await prisma.pressLike.create({
                data: {
                    postAnOpinionId: opinionId,
                    accountId: accountId,
                    likedAt: new Date(),
                },
            });
            isLiked = true; // 作成したので、新しい状態は「いいねあり」
            console.log(`[DB] Like added by Account ${accountId}.`);
        }

        // 更新後のいいね数を集計（この意見IDに絞ってカウント）
        const newLikeCount = await prisma.pressLike.count({
            where: {
                postAnOpinionId: opinionId,
            },
        });

        // キャッシュ無効化は必要に応じて残す
        // revalidatePath('/db/like');

        // クライアントが必要な情報のみを返す
        return {
            success: true,
            isLiked: isLiked,
            likeCount: newLikeCount
        };

    } catch (error) {
        console.error('Toggle Like failed:', error);
        // P2025エラーの場合、AccountまたはOpinionが存在しない可能性
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { error: 'いいね対象の意見またはアカウントIDが存在しません。' };
        }
        return { error: 'いいね操作に失敗しました。' };
    } finally {
        console.log(`[DB] END: Toggling Like.`);
    }
}

// ----------------------------------------------------------------------
// 6. 出店スケジュール (Store Opening Information) CRUD
// ----------------------------------------------------------------------

/**
 * 出店スケジュール登録用のデータインターフェース
 */
interface RegisterScheduleData {
    storeId: string; // ストアID
    latitude: number; // 緯度
    longitude: number; // 経度
    scheduledDate: string; // 出店予定日（YYYY-MM-DD形式）
}

/**
 * 出店スケジュール用のシーケンス名定数
 * 論理的な名前に変更（またはSEQUENCE_NAME_OPENINGを再利用）
 */
const SEQUENCE_NAME_SCHEDULE = 'store_opening_info_seq'; // 論理的な名前に変更

/**
 * 出店スケジュールのタイプコード定数
 * StoreOpeningInformationのType Codeを'04'と仮定
 */
const SCHEDULE_TYPE_CODE = '04'; // StoreOpeningInformationのType Code

/** 6-A. 出店スケジュール登録 (StoreOpeningInformation Create) */
export async function registerStoreSchedule(data: RegisterScheduleData) {
    const { storeId, latitude, longitude, scheduledDate } = data;
    console.log(`[DB] START: Registering Store Schedule for Store ID: ${storeId}`);

    if (!storeId || !scheduledDate || isNaN(latitude) || isNaN(longitude)) {
        return { success: false, error: '必須データ（ストアID、日付、座標）が不足しています。' };
    }

    try {
        const newSchedule = await prisma.$transaction(async (tx) => {
            // 既存のstoreId存在チェックは省略（トランザクション内でストア確認を行う場合に追加）

            // 日付形式のバリデーション
            const dateObj = new Date(scheduledDate);
            if (isNaN(dateObj.getTime())) {
                return { error: '無効な日付形式です。' };
            }

            // カスタムIDの生成（SEQUENCE_NAME_OPENING/'04'を使用）
            const customScheduleId = await getAndIncrementCustomId(SEQUENCE_NAME_OPENING, '04', tx);
            console.log(`[DB] Generated Schedule ID: ${customScheduleId}`);

            // StoreOpeningInformationレコードを作成
            const schedule = await tx.storeOpeningInformation.create({
                data: {
                    storeOpeningInformationId: customScheduleId,
                    storeId: storeId,
                    latitude: latitude,
                    longitude: longitude,
                    // scheduledDate -> openingDateに修正
                    openingDate: dateObj,
                    locationName: null, // locationNameはオプションとしてnullを許容
                },
            });

            return schedule;
        });

        // 成功時の処理
        revalidatePath('/');
        return { success: true, schedule: newSchedule };

    } catch (error) {
        console.error('Store schedule registration failed:', error);
        return { success: false, error: '出店スケジュールの登録に失敗しました。' };
    } finally {
        console.log(`[DB] END: Registering Store Schedule.`);
    }
}

/** 6-B. 全出店スケジュール取得 (Get All Store Schedules) */
export async function getAllStoreSchedules() {
    console.log(`[DB] START: Fetching all Store Schedules.`);
    try {
        // StoreOpeningInformationテーブルから全レコードを取得（古い日付から新しい日付へソート）
        const schedules = await prisma.storeOpeningInformation.findMany({
            orderBy: { openingDate: 'asc' }, // 古い日付から新しい日付へソート
            select: {
                storeOpeningInformationId: true,
                latitude: true,
                longitude: true,
                openingDate: true,
                locationName: true,
                // ストア名を取得するためにStoreテーブルを結合
                store: {
                    select: {
                        storeName: true,
                        storeId: true,
                        storeUrl: true,
                        introduction: true
                    }
                }
            }
        });

        // クライアント側で扱いやすい形式に加工
        const processedSchedules = schedules.map(s => ({
            id: s.storeOpeningInformationId,
            storeName: s.store.storeName,
            storeId: s.store.storeId,
            date: s.openingDate.toISOString().split('T')[0], // 日付のみ（YYYY-MM-DD）
            location: { lat: s.latitude, lng: s.longitude }, // 位置情報をオブジェクト化
            locationName: s.locationName,
            storeDetails: {
                storeUrl: s.store.storeUrl,
                introduction: s.store.introduction,
            }
        }));

        console.log(`[DB] END: Fetched ${schedules.length} Store Schedules.`);
        return { success: true, schedules: processedSchedules };

    } catch (error) {
        console.error('Fetching store schedules failed:', error);
        return { success: false, error: '出店スケジュールリストの取得に失敗しました。' };
    }
}

// ----------------------------------------------------------------------
// 7. ユーザーの存在確認 (認証コールバック用)
// ----------------------------------------------------------------------

/**
 * 認証コールバック用にID情報を含めた戻り値の型
 * ユーザーの存在確認結果を表すインターフェース
 */
interface FindUserDetailsResult {
    success: boolean; // クエリ成功フラグ
    exists: boolean; // ユーザーの存在フラグ
    error?: string; // エラー時のメッセージ
    accountId?: string | null; // アカウントID
    userId?: string | null; // ユーザーID
    storeId?: string | null; // ストアID
}

/**
 * メールアドレスからユーザーの詳細情報を取得する関数（認証コールバック用）
 * ハッシュ化されたメールアドレスでAccountテーブルを検索し、関連するID情報を返します。
 * @param email 検索するメールアドレス
 * @returns ユーザー詳細情報の結果オブジェクト
 */
export async function findUserByEmail(email: string): Promise<FindUserDetailsResult> {
    const hashedEmail = hashEmail(email);
    console.log(`[DEBUG AUTH] Hashed Email: ${hashedEmail}`);

    try {
        // Accountテーブルからメールアドレスで検索
        const account = await prisma.account.findUnique({
            where: { email: hashedEmail },
            select: {
                accountId: true,
                userId: true,
                storeId: true,
            }
        });

        console.log("findUserByEmail (Details) is finish!!!!!!!!");

        const exists = !!account; // アカウントが存在するか判定

        if (!exists || !account) {
            // アカウントが存在しない場合
            return { success: true, exists: false, accountId: null, userId: null, storeId: null };
        }

        // アカウントが存在する場合、詳細情報を返す
        return {
            success: true,
            exists: exists,
            accountId: account.accountId,
            userId: account.userId,
            storeId: account.storeId,
        };

    } catch (error) {
        console.error('Find user by email error:', error);
        return { success: false, exists: false, error: 'DB search failed' };
    }
}

// ----------------------------------------------------------------------
// 8. Account詳細の取得 (JWT格納用)
// ----------------------------------------------------------------------

/**
 * メールアドレスからアカウントの詳細情報を取得する関数（JWT格納用）
 * Accountテーブルの全カラムではなく、必要な情報（accountId, userId, storeId, accountType）を選択して取得します。
 * @param email 検索するメールアドレス
 * @returns アカウント詳細情報またはnull
 */
export async function findAccountDetailsByEmail(email: string) {
    const hashedEmail = hashEmail(email);
    console.log(`[DEBUG AUTH] Hashed Email (Details): ${hashedEmail}`);

    try {
        // Accountテーブルから必要な情報を選択して取得
        const account = await prisma.account.findUnique({
            where: { email: hashedEmail },
            select: {
                accountId: true,
                userId: true,
                storeId: true,
                accountType: true // アカウントタイプも含める
            }
        });

        return account;

    } catch (error) {
        console.error('Find account details error:', error);
        return null;
    }
}


// ----------------------------------------------------------------------
// 9. マスタデータ取得
// ----------------------------------------------------------------------

/**
 * 全タグを取得する関数
 * Tagテーブルから全レコードを取得し、クライアント側で扱いやすい形式（value/label）に加工します。
 * @returns 成功時はタグリスト、エラー時はエラーメッセージ
 */
export async function getAllTags() {
    console.log(`[DB] START: Fetching all Tags.`);
    try {
        // Tagテーブルから全レコードを取得（ID順にソート）
        const tags = await prisma.tag.findMany({
            select: {
                tagId: true,
                tagName: true,
            },
            orderBy: { tagId: 'asc' },
        });

        console.log(`[DB] END: Fetched ${tags.length} Tags.`);
        // クライアント側で扱いやすいよう、tagNameをvalue/labelとして利用する
        const formattedTags = tags.map(t => ({
            value: t.tagName,
            label: t.tagName,
        }));

        return { success: true, tags: formattedTags };

    } catch (error) {
        console.error('Fetching tags failed:', error);
        return { success: false, error: 'タグリストの取得に失敗しました。' };
    }
}

// ----------------------------------------------------------------------
// 10. アカウントデータ取得
// ----------------------------------------------------------------------

/**
 * アカウントIDからUserとStoreの詳細情報を取得する関数
 * Accountレコードを取得し、関連するUserとStoreの情報を結合して返します。
 * ハイブリッドアカウントの場合、両方の情報が含まれます。
 * @param accountId 検索するアカウントID
 * @returns 成功時はアカウント詳細情報、エラー時はエラーメッセージ
 */
export async function getUserAndStoreDetails(accountId: string) {
    console.log(`[DB] START: Fetching User/Store Details for Account ID: ${accountId}`);
    if (!accountId) {
        return { success: false, error: 'アカウントIDが指定されていません。' };
    }

    try {
        // Accountレコードを取得し、関連するUserとStoreの情報を取得（結合）
        const account = await prisma.account.findUnique({
            where: { accountId: accountId },
            select: {
                accountId: true,
                email: true,
                accountType: true,
                // Userテーブルの全カラムではなく、必要なカラムとマスタデータの名前を選択
                user: {
                    select: {
                        userId: true,
                        nickname: true,
                        introduction: true,
                        gender: { select: { genderName: true } },
                        ageGroup: { select: { ageGroupName: true } },
                        occupation: { select: { occupationName: true } },
                    }
                },
                // Storeテーブルの全カラムを取得
                store: true,
            },
        });

        if (!account) {
            return { success: false, error: '指定されたアカウントIDは見つかりませんでした。' };
        }

        console.log(`[DB] END: Fetched details for Account ID: ${accountId}`);
        return { success: true, account };

    } catch (error) {
        console.error('Fetching account details failed:', error);
        return { success: false, error: 'アカウント詳細情報の取得に失敗しました。' };
    }
}

/**
 * マスタテーブルの名前からIDを取得する関数
 * Gender, AgeGroup, Occupationテーブルから名前でIDを検索します。
 * トランザクションクライアントを使用することで、トランザクション内での使用が可能になります。
 * @param client Prismaクライアントまたはトランザクションクライアント
 * @param modelName マスタテーブルのモデル名
 * @param name 検索する名前
 * @returns 見つかったIDまたはnull
 */
async function getMasterIdByName(client: PrismaClient | any, modelName: 'Gender' | 'AgeGroup' | 'Occupation', name: string) {
    if (!name) return null;

    // フィールド名のマッピング
    const fieldMap = {
        Gender: 'genderName',
        AgeGroup: 'ageGroupName',
        Occupation: 'occupationName',
    };
    const fieldName = fieldMap[modelName];

    // 検索条件の構築
    const whereClause: any = {};
    whereClause[fieldName] = name;

    // PrismaClientのインスタンスから、キャメルケースのモデル名を取得します。
    // 例: client.gender.findFirst(...)
    const modelAccessor = modelName.charAt(0).toLowerCase() + modelName.slice(1); // 'Gender' -> 'gender'

    // マスタテーブルから名前で検索
    const record = await client[modelAccessor].findFirst({
        where: whereClause,
        // IDフィールド名もmodelKeyに合わせて修正
        select: { [`${modelAccessor}Id`]: true },
    });

    return record ? record[`${modelAccessor}Id`] : null;
}