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

// 定数は外に出す（変更なし）
const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

export default function StoreMap() {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (!map || !isLoaded) return;
        // 2. マップにセット（これで表示されます）
        setMap(map);
    });
    //クリックしたところにピンを指す
    const [markerPos, setMarkerPos] = useState<{ lat: number, lng: number } | null>(null);
    {
    //     markerPos && (
    //         // ピンのデザイン
    //         <MarkerF
    //             position={markerPos}
    //             icon={{
    //                 url: "/pin_orange.png",  // publicフォルダに画像を置く
    //                 scaledSize: new google.maps.Size(40, 40), // サイズ調整
    //                 anchor: new google.maps.Point(20, 40), // 先端の位置調整
    //             }}
    //         />
        // )
    }

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            options={mapOption}
            center={center}
            zoom={14}
            onClick={(e) => {
                if (!e.latLng) return;
                setMarkerPos({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                });
            }}
        >
            {/* ★クリックされたらピン表示 */}
            {markerPos && (
                <MarkerF position={markerPos} />
            )}
        </GoogleMap>
    );
}
