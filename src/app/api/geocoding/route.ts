import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const apiKey = process.env.GOOGLE_GEOCODING_KEY;

  if (!lat || !lng) {
    return NextResponse.json({ error: '座標が必要です' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API Keyの設定が必要です' }, { status: 500 });
  }

  try {
    // Google Maps APIへリクエスト
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK') {
      // 一番詳細な住所を返す
      let address = data.results[0].formatted_address;
      address = address.replace(/^日本、/, '');

      return NextResponse.json({ address: address });
    } else {
      return NextResponse.json({ error: data.status }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}