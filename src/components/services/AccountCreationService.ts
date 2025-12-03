// components/services/AccountCreationService.ts
// 統合アカウントを単一のトランザクションで作成するサービス

import prisma from '@/lib/prisma';
import { Account, User, Store, Prisma } from '@prisma/client';

export class AccountCreationService {
  /**
   * 一般ユーザーアカウントを作成します。
   * (UserテーブルとAccountテーブルに同時にレコードを挿入)
   * @param userData Userテーブルの作成データ (nickname, introduction, 外部キー)
   * @returns 作成された Account レコード
   */
  async createUserAccount(userData: Prisma.UserCreateInput): Promise<Account> {
    return prisma.$transaction(async (tx) => {
      // 1. User レコードを作成
      const user = await tx.user.create({ data: userData });

      // 2. Account レコードを作成し、Userに紐付ける
      const account = await tx.account.create({
        data: {
          accountType: 'User',
          user: { connect: { userId: user.userId } },
        },
      });

      return account;
    });
  }

  /**
   * ストアアカウントを作成します。
   * (StoreテーブルとAccountテーブルに同時にレコードを挿入)
   * @param storeData Storeテーブルの作成データ (storeName, storeUrl, introduction)
   * @returns 作成された Account レコード
   */
  async createStoreAccount(storeData: Prisma.StoreCreateInput): Promise<Account> {
    return prisma.$transaction(async (tx) => {
      // 1. Store レコードを作成
      const store = await tx.store.create({ data: storeData });

      // 2. Account レコードを作成し、Storeに紐付ける
      const account = await tx.account.create({
        data: {
          accountType: 'Store',
          store: { connect: { storeId: store.storeId } },
        },
      });

      return account;
    });
  }
}