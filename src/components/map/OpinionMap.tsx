'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";
import './style.css';

import {
    GoogleMap,
    MarkerF,
    CircleF,        // Circle をインポート
    useJsApiLoader,
    OverlayView
} from '@react-google-maps/api';

const containerStyle = {
    width: "100%",
    height: "100%",
};

const center = { lat: 35.681236, lng: 139.767125 };

// 定数は外に出す（変更なし）
const libraries: ("geometry" | "drawing" | "places" | "visualization")[] = ["drawing", "geometry", "places"];

// 円のスタイル設定
const circleOptions = {
    strokeColor: '#ff9500ff', // 線の色
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#ff880056', // 塗りつぶしの色
    fillOpacity: 0.2, // 塗りつぶしの透明度
};

type filters = {
    tag: string | null;
    minLikes: number | null;
    dateFrom: Date | null;
    dateTo: Date | null;
    gender: string | null;
    occupation: string | null;
    ageRange: string | null;
};

interface OpinionMapProps {
    onDialogOpen: (data: string, clickPos: { lat: number, lng: number }) => void;
    opinions: (any[]);
    accountId: string;
    filter: filters;
    filterKeyword: string;
    onExtract: (data: string, opinions: any) => void;
}

export default function OpinionMap({ onDialogOpen, opinions, onExtract, accountId, filter, filterKeyword }: OpinionMapProps) {


    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [extractedOpinions, setExtractedOpinions] = useState<string[]>([]);
    const [activeLabelLats, setActiveLabelLats] = useState<number[]>([]); const circleRefs = useRef<{ [key: string]: google.maps.Circle }>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [clickPos, setClickPos] = useState<{ lat: number, lng: number } | null>(null);
    // DrawingManagerのインスタンスを保持するためのState（必要なら）
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);


    // 新しい状態として、意見データ全体を内部で管理するための state を追加
    // opinions prop は初期値として使用し、更新は internalOpinions で行う


    //自動表示ラベルを更新する関数 (onIdle / onLoad から呼ばれる)
    const updateVisibleLabels = useCallback((mapInstance: google.maps.Map) => {

        const bounds = mapInstance.getBounds();
        if (!bounds) return;

        // 範囲内のピンを絞り込み
        const visiblePins = opinions
            .filter(pin => {
                const pinLatLng = new window.google.maps.LatLng(pin.latitude, pin.longitude);
                return bounds.contains(pinLatLng);
            })
            .slice(0, MAX_VISIBLE_LABELS); // 上限数でカット

        // 絞り込んだピンの「lat」の配列で state を更新
        setActiveLabelLats(visiblePins.map(pin => pin.opinionId));
    }, [opinions]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        updateVisibleLabels(map);
    }, []);

    //地図操作完了時 (onIdle)
    const onIdle = useCallback(() => {
        if (map) {
            updateVisibleLabels(map);
        }
    }, [map, updateVisibleLabels]); // map が読み込まれたら実行
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map) updateVisibleLabels(map);
    }, [opinions, map, updateVisibleLabels]);

    const MAX_VISIBLE_LABELS = 5;


    const handleOpinionTransition = () => {
        if (clickPos) {
            onDialogOpen("post", clickPos);
        }
    }
    //コンポーネントではなくuseEffectでDrawingManagerを管理する
    useEffect(() => {
        if (!map || !isLoaded) return;

        // 1. マップがロードされたら DrawingManager を作成
        const newDrawingManager = new google.maps.drawing.DrawingManager({
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: [google.maps.drawing.OverlayType.RECTANGLE],
            },
        });

        // 2. マップにセット（これで表示されます）
        newDrawingManager.setMap(map);
        setDrawingManager(newDrawingManager); // 後でデータを取り出すとき用に保存

        google.maps.event.addListener(newDrawingManager, 'overlaycomplete', (e: any) => {

            // e.overlay に「今描かれた図形の実体」が入ってます
            const newShape = e.overlay;
            // 1. 描画された四角形から「範囲情報 (bounds)」を取得
            const bounds = newShape.getBounds();
            if (!bounds) return;

            // 2. opinionList (すべてのピン) を絞り込む
            const filteredOpinions = opinions
                .filter(pin => {
                    // ピンの座標
                    const pinLatLng = new window.google.maps.LatLng(pin.latitude, pin.longitude);

                    //ピンが範囲(bounds)に「含まれる(contains)」か判定
                    return bounds.contains(pinLatLng);
                })
                .map(pin => pin.commentText); // 5. 絞り込んだものから「意見(opinion)」だけを抜き出す

            //抽出した意見リストを state に保存
            onExtract("opinionExtract", filteredOpinions);

            //描画した四角形を地図から消す (お好みで)
            newShape.setMap(null);

        });
        //【最重要】クリーンアップ関数

        return () => {
            newDrawingManager.setMap(null);
        };
    }, [map, isLoaded]); // mapが変わるたびに作り直す

    if (!isLoaded) return <div>Loading...</div>;

    const filteredOpinions = opinions.filter((op) => {
        if (filter.tag && !op.tags.includes(filter.tag)) return false;
        if (filter.minLikes !== null && op.likeCount < filter.minLikes) return false;
        if (filter.gender && op.profile.gender !== filter.gender) return false;
        if (filter.occupation && op.profile.occupation !== filter.occupation) return false;
        if (filter.ageRange && op.profile.age !== filter.ageRange) return false;

        if (filter.dateFrom && new Date(op.postedAt) < filter.dateFrom) return false;
        if (filter.dateTo && new Date(op.postedAt) > filter.dateTo) return false;

        if (op.commentText && !op.commentText.includes(filterKeyword)) return false;
        return true;
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
                center={center}
                zoom={14}
                onLoad={onLoad}
                onIdle={onIdle}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: true,
                }
                }
            >
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
                                onClick={handleOpinionTransition}>
                                意見を投稿</button>
                        </OverlayView>
                    )}
                </div>

                {map && filteredOpinions.map((data) => {

                    const isOpen = activeLabelLats.includes(data.opinionId);
                    // 🚨 意見IDは postAnOpinionId フィールドを参照
                    const opinionId = data.postAnOpinionId;

                    // 文字数で枠の大きさを決める
                    const text = data.commentText;
                    const len = text.length;

                    let sizeClass = "bubble-sm";
                    if (len > 20) sizeClass = "bubble-md";
                    if (len > 50) sizeClass = "bubble-lg";
                    if (len > 90) sizeClass = "bubble-xl";

                    return (
                        <React.Fragment key={data.opinionId}>
                            <MarkerF
                                key={`marker-${data.opinionId}`}
                                position={{ lat: data.latitude, lng: data.longitude }}
                                label={isOpen ? { text: data.commentText, color: "black", fontSize: "14px", fontWeight: "bold" } : undefined}
                            />


                            {/* 吹き出し */}
                            {isOpen && (
                                <OverlayView
                                    position={{ lat: data.latitude, lng: data.longitude }}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                >
                                    <div className={`opinion-bubble ${sizeClass}`}>
                                        <div className="bubble-content">
                                            {data.commentText}
                                        </div>
                                    </div>
                                </OverlayView>
                            )}


                            <CircleF
                                key={data.opinionId}
                                center={{ lat: data.latitude, lng: data.longitude }}
                                radius={500}
                                onClick={() => onExtract("opinionClick", data)}
                                options={{ ...circleOptions, clickable: true }}
                            />
                        </React.Fragment>
                    );
                })}
            </GoogleMap>

            <div>
                <div>
                    <ul style={{ paddingLeft: 16 }}>
                        {extractedOpinions.map((op, i) => (
                            <li key={i} style={{ marginBottom: 8 }}>
                                {op}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    )
}