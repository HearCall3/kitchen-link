// components/services/StoreOpeningInformationService.ts

import prisma from '@/lib/prisma';
import { StoreOpeningInformation, Prisma } from '@prisma/client';

/**
 * 出店情報 (StoreOpeningInformation) のデータベース操作サービス
 */
export class StoreOpeningInformationService {
  /**
   * 新しい出店情報を作成
   * @param data 作成データ
   * @returns 作成された StoreOpeningInformation
   */
  async createOpeningInfo(data: Prisma.StoreOpeningInformationCreateInput): Promise<StoreOpeningInformation> {
    return prisma.storeOpeningInformation.create({ data });
  }

  /**
   * ストアIDで出店情報を取得
   * @param storeId ストアID
   * @returns StoreOpeningInformation の配列
   */
  async getOpeningsByStoreId(storeId: number): Promise<StoreOpeningInformation[]> {
    return prisma.storeOpeningInformation.findMany({
      where: { storeId: storeId },
      orderBy: { openingDate: 'desc' },
      include: { store: true },
    });
  }

  /**
   * 出店情報IDで単一の出店情報を取得
   * @param id 出店情報ID
   * @returns StoreOpeningInformation または null
   */
  async getOpeningInfoById(id: number): Promise<StoreOpeningInformation | null> {
    return prisma.storeOpeningInformation.findUnique({
      where: { storeOpeningInformationId: id },
    });
  }

  /**
   * 出店情報を更新
   * @param id 更新対象の出店情報ID
   * @param data 更新データ
   * @returns 更新された StoreOpeningInformation
   */
  async updateOpeningInfo(id: number, data: Prisma.StoreOpeningInformationUpdateInput): Promise<StoreOpeningInformation> {
    return prisma.storeOpeningInformation.update({
      where: { storeOpeningInformationId: id },
      data,
    });
  }

  /**
   * 出店情報を削除
   * @param id 削除対象の出店情報ID
   * @returns 削除された StoreOpeningInformation
   */
  async deleteOpeningInfo(id: number): Promise<StoreOpeningInformation> {
    return prisma.storeOpeningInformation.delete({
      where: { storeOpeningInformationId: id },
    });
  }
}