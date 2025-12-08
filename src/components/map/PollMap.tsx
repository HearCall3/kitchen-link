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
    height: "400px",
};

const center = { lat: 35.681236, lng: 139.767125 };
const mapOption = { disableDefaultUI: true }

// 定数は外に出す（変更なし）
const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

// 円のスタイル設定
const circleOptions = {
    strokeColor: '#FF0000', // 線の色
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000', // 塗りつぶしの色
    fillOpacity: 0.2, // 塗りつぶしの透明度
};
interface PostMapProps {
    onDialogOpen: (data: string) => void;
}
export default function OpinionMap({ onDialogOpen }: PostMapProps) {
    const [clickPos, setClickPos] = useState<{ lat: number, lng: number } | null>(null);

    const handleOpinionTransition = () => {
        onDialogOpen("poll"); // ← ここでアンケート作成を開く
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [activeLabelLats, setActiveLabelLats] = useState<number[]>([]); const circleRefs = useRef<{ [lat: number]: google.maps.Circle }>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (!map || !isLoaded) return;
        // 2. マップにセット（これで表示されます）
        setMap(map);
    });

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <>
            <GoogleMap
                onClick={(e) => {
                    if (!e.latLng) return;
                    setClickPos({
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                    })
                }}
                mapContainerStyle={containerStyle}
                options={mapOption}
                center={center}
                zoom={14}

            >
                {/* アンケートの作成 */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ pointerEvents: 'auto' }}>
                    {clickPos && (
                        <OverlayView
                            position={clickPos}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <button
                                style={{
                                    background: 'white', padding: '8px 12px', borderRadius:
                                        '6px', border: '1px solid #ccc', whiteSpace: 'nowrap',
                                }}
                                onClick={handleOpinionTransition}
                            >
                                アンケート作成</button>
                        </OverlayView>
                    )}
                </div>
                {/* アンケートの回答のピン */}
                {/* ～ */}

                
            </GoogleMap>
        </>
    );
}
