'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";

import {
    GoogleMap,
    MarkerF,
    InfoWindowF, // InfoWindow をインポート
    Circle,        // Circle をインポート
    type Libraries,
    useJsApiLoader,
    OverlayView
} from '@react-google-maps/api';

const containerStyle = {
    width: "100%",
    height: "100%",
};

const center = { lat: 35.681236, lng: 139.767125 };
const mapOption = { disableDefaultUI: true }

interface storeProps {
    schedule: (any[]);
    filterKeyword: string;
}
// 定数は外に出す（変更なし）
const libraries: ("geometry" | "drawing" | "places" | "visualization")[] = ["drawing", "geometry", "places"];
export default function StoreMap({ schedule, filterKeyword }: storeProps) {

    const [storeOpen, setStoreOpen] = useState<any>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (!map || !isLoaded) return;
        //マップにセット
        setMap(map);
    });

    const filterSchedule = schedule.filter((op) => {
        if (op.storeName && op.storeName.includes(filterKeyword)) return true;
    })

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <>
            <GoogleMap
                mapContainerStyle={containerStyle}
                options={mapOption}
                center={center}
                zoom={14}
            >
                {filterSchedule.map((q) => (
                    <MarkerF
                        key={q.id}
                        position={{
                            lat: Number(q.location.lat),
                            lng: Number(q.location.lng),
                        }}
                        // icon={{
                        //      url: "/pin_orange.png",  // publicフォルダに画像を置く
                        //      scaledSize: new google.maps.Size(40, 40), // サイズ調整
                        //      anchor: new google.maps.Point(20, 40), // 先端の位置調整
                        // }}
                        label={{
                            text: q.storeName,
                        }}
                        onClick={() => setStoreOpen(q)}
                    />
                ))}
            </GoogleMap>
            {storeOpen &&
                <>
                    {console.log(storeOpen)}
                    <p>店の名前：{storeOpen.storeName}</p>
                    <p>Id：{storeOpen.id}</p>
                    <p>座標：{storeOpen.location.lat}</p>
                    <p>座標：{storeOpen.location.lng}</p>
                    <p>出店日：{storeOpen.data}</p>
                </>
            }
        </>
    );
}
