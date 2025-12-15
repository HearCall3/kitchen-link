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
import { useSession } from "next-auth/react";

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

    const { data: session } = useSession();
    const currentAccountId = session?.user?.accountId;

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
        if (op.questionText && op.questionText.includes(filterKeyword)) return true;
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
                {filterdQuestions.map((q) => {

                    let hasAnswered = false;

                    console.group(`--- Question ID: ${q.questionId} ---`);
                    console.log(`1. Current Logged-in Account ID (currentAccountId):`, currentAccountId);
                    console.log(`2. All Answers for this Question (q.answers):`, q.answers);

                    // ★ 回答済み判定ロジック ★
                    if (currentAccountId && q.answers) {
                        const loggedInId = String(currentAccountId);

                        const isMatchFound = q.answers.some((answer: any) => {
                            // 厳密な文字列比較
                            return String(answer.accountId) === loggedInId;
                        });

                        if (isMatchFound) {
                            hasAnswered = true;
                        }
                    }

                    // ★ ピンのアイコン/スタイルを決定 (ロジックを反転) ★
                    const isUnanswered = !hasAnswered;

                    // 未回答の場合にカスタムアイコンを使用 (質問ピン)
                    const unansweredIcon = {
                        url: "/icon/poll.png",
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 40),
                    };

                    // ★ 回答済みの場合にカスタムアイコンを使用 (回答済みピン) ★
                    const answeredIcon = {

                        // ここのパスを指定します！！！！！！
                        url: "/answered_custom_pin.png", // ★ 任意の画像パスを指定 ★
                        
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 40),
                    };


                    const markerIcon = hasAnswered ?
                        answeredIcon : // 回答済みなら、新しいカスタムピン
                        unansweredIcon; // 未回答なら、/icon/poll.png
                        
                    return (
                        <MarkerF
                            key={q.questionId}
                            position={{
                                lat: Number(q.latitude),
                                lng: Number(q.longitude),
                            }}
                            icon={markerIcon} // 未回答ならカスタム、回答済みならデフォルト
                            label={{
                                text: q.questionText,
                                // 未回答ならカスタムスタイル、回答済みならデフォルトスタイル (白背景)
                                className: isUnanswered
                                    ? "bg-yellow-100 text-gray-800 px-2 py-1 rounded shadow font-bold"
                                    : "bg-white px-2 py-1 rounded shadow",
                            }}
                            onClick={() => onDialogOpen(q.questionId)}
                        />
                    );
                })}
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
