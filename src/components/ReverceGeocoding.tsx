'use client';

import { useState, useEffect } from 'react';

type Props = {
  lat: number;
  lng: number;
};

export default function ReverceGeoooding({ lat, lng }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 座標が変わったら住所を取得しにいく
  useEffect(() => {
    const fetchAddress = async () => {
      setLoading(true);
      try {
        // 自分のNext.jsサーバーにリクエスト (Googleではない)
        const res = await fetch(`../api/geocoding?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        if (res.ok) {
          setAddress(data.address);
        } else {
          console.error("住所取得エラー:", data.error);
          setAddress("住所が見つかりませんでした");
        }
      } catch (error) {
        console.error("通信エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      fetchAddress();
    }
  }, [lat, lng]);

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h3 className="font-bold text-gray-700 mb-2">現在の住所</h3>
      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : (
        <p className="text-lg">{address || "---"}</p>
      )}
    </div>
  );
}