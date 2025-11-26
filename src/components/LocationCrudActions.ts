'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * 📍 出店情報（Location）の新規登録
 * @param userEmail ログインユーザーのメールアドレス (String)
 * @param formData フォームデータ
 */
export async function createLocation(userEmail: string, formData: FormData) {
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const openingDate = formData.get('openingDate') as string;
  const locationName = formData.get('locationName') as string;

  if (!userEmail || isNaN(latitude) || isNaN(longitude) || !openingDate) {
    return { success: false, message: '必須項目が不足しています。' };
  }

  try {
    const date = new Date(openingDate);

    await prisma.location.create({
      data: {
        accountId: userEmail, // ★メールアドレスを使用
        latitude: latitude,
        longitude: longitude,
        openingDate: date,
        locationName: locationName || null,
      },
    });

    revalidatePath('/');
    return { success: true, message: '出店情報を新規登録しました。' };
  } catch (error) {
    console.error('Create location error:', error);
    return { success: false, message: '出店情報の登録に失敗しました。' };
  }
}

// updateLocation, deleteLocation は Location ID を使うため、ここでは変更なし
// ただし、deleteLocation のみ再定義して、IDのみを引数に取るように修正

/**
 * 📍 出店情報（Location）の更新 (Location ID を使用)
 * @param formData フォームデータ
 */
export async function updateLocation(formData: FormData) {
  const locationId = parseInt(formData.get('locationId') as string);
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const openingDate = formData.get('openingDate') as string;
  const locationName = formData.get('locationName') as string;

  // バリデーション
  if (isNaN(locationId) || isNaN(latitude) || isNaN(longitude) || !openingDate) {
    return { success: false, message: '更新に必要な情報が不足しています。' };
  }

  try {
    const date = new Date(openingDate);

    await prisma.location.update({
      where: { id: locationId },
      data: {
        latitude: latitude,
        longitude: longitude,
        openingDate: date,
        locationName: locationName || null,
      },
    });

    revalidatePath('/');
    // ★修正: 成功オブジェクトを返す
    return { success: true, message: `出店ID ${locationId} の情報を更新しました。` }; 
  } catch (error) {
    console.error('Update location error:', error);
    // ★修正: 失敗オブジェクトを返す
    return { success: false, message: '出店情報の更新に失敗しました。IDが存在するか確認してください。' }; 
  }
}

/**
 * 📍 出店情報（Location）の削除 (Location ID を使用)
 * @param locationId 削除する出店ID
 */
export async function deleteLocation(locationId: number) {
  if (isNaN(locationId)) {
    return { success: false, message: '無効な出店IDです。' };
  }
  try {
    await prisma.location.delete({
      where: { id: locationId },
    });
    revalidatePath('/');
    return { success: true, message: `出店ID ${locationId} の情報を削除しました。` };
  } catch (error) {
    return { success: false, message: '出店情報の削除に失敗しました。IDが存在しない可能性があります。' };
  }
}