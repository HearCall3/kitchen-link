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
const libraries: ("geometry" | "drawing" | "places" | "visualization")[] = ["drawing", "geometry", "places"];

// 円のスタイル設定
const circleOptions = {
    strokeColor: '#FF0000', // 線の色
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000', // 塗りつぶしの色
    fillOpacity: 0.2, // 塗りつぶしの透明度
};

interface PostMapProps {
    onDialogOpen: (data: string, clickPos?: { lat: number, lng: number }) => void;
    questions: (any[]);
    filterKeyword: String;
}

export default function PollMap({ questions, filterKeyword, onDialogOpen }: PostMapProps) {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [clickPos, setClickPos] = useState<{ lat: number, lng: number } | null>(null);


    const handleOpinionTransition = () => {
        if (clickPos)
            onDialogOpen("poll", clickPos);
    }

    useEffect(() => {
        if (!map || !isLoaded) return;
        // 2. マップにセット（これで表示されます）
        setMap(map);
    });

    const filterdQuestions = questions.filter((op) => {
        if(op.questionText && op.questionText.includes(filterKeyword)) return true;
    })

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
              
                 {/* アンケート回答ピンアイコン todo */}
                {/* <MarkerF
                    key={`marker-${data.lat}-${isOpen}`}
                    position={{ lat: data.lat, lng: data.lon }}
                    onClick={() => toggleLabel(data.lat)}
                    label={isOpen ? { text: data.opinion, color: "black", fontSize: "14px", fontWeight: "bold" } : undefined}
                    icon={{
                        url: "/pin.png",        // 画像パス (public フォルダに置くのがおすすめ)
                        scaledSize: new google.maps.Size(40, 40), // サイズ調整
                        anchor: new google.maps.Point(20, 40),    // ピン先端を座標に合わせる
                    }}
                /> */}

                {/* アンケートの作成 アイコン作成todo*/}
                {filterdQuestions.map((q) => (
                    <MarkerF
                        key={q.questionId}
                        position={{
                            lat: Number(q.latitude),
                            lng: Number(q.longitude),
                        }}
                        label={{
                            text: q.questionText,
                            className: "bg-white px-2 py-1 rounded shadow",
                        }}
                         onClick={() => onDialogOpen(q.questionId)}
                    />
                ))}
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
                                アンケートを作成</button>
                        </OverlayView>
                    )}
                </div>
            </GoogleMap>
        </>
    );
}
