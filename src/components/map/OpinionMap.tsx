'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";

import {
    GoogleMap,
    MarkerF,
    Circle,        // Circle をインポート
    useJsApiLoader,
    OverlayView
} from '@react-google-maps/api';

const containerStyle = {
    width: "100%",
    height: "400px",
};

const center = { lat: 35.681236, lng: 139.767125 };

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


interface OpinionMapProps {
    onDialogOpen: (data: string, clickPos: { lat: number, lng: number }) => void;

    opinions: (any[]);
}
export default function OpinionMap({ onDialogOpen, opinions}: OpinionMapProps) {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [extractedOpinions, setExtractedOpinions] = useState<string[]>([]);
    const [activeLabelLats, setActiveLabelLats] = useState<number[]>([]); const circleRefs = useRef<{ [lat: number]: google.maps.Circle }>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [clickPos, setClickPos] = useState<{ lat: number, lng: number } | null>(null);
    // DrawingManagerのインスタンスを保持するためのState（必要なら）
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);


    //自動表示ラベルを更新する関数 (onIdle / onLoad から呼ばれる)
    const updateVisibleLabels = useCallback((mapInstance: google.maps.Map) => {
        console.log("---- updateVisibleLabels ----");

        const bounds = mapInstance.getBounds();
        if (!bounds) return;

        // 範囲内のピンを絞り込み
        const visiblePins = opinions
            .filter(pin => {
                const pinLatLng = new window.google.maps.LatLng(pin.latitude, pin.longitude);
                return bounds.contains(pinLatLng);

            })
            .slice(0, MAX_VISIBLE_LABELS); // 上限数でカット
        console.log("→ MAX_VISIBLE_LABELS 適用後:" + visiblePins);

        // 絞り込んだピンの「lat」の配列で state を更新
        setActiveLabelLats(visiblePins.map(pin => pin.latitude));
    }, []);

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

    const toggleLabel = (lat: number) => {
        setActiveLabelLats(prev => {
            if (prev.includes(lat)) {
                // 含まれていれば消す（閉じる）
                return prev.filter(l => l !== lat);
            } else {
                // 含まれていなければ足す（開く）
                return [...prev, lat];
            }
        });
    };

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
            setExtractedOpinions(filteredOpinions);

            //描画した四角形を地図から消す (お好みで)
            newShape.setMap(null);

        });
        //【最重要】クリーンアップ関数

        return () => {
            newDrawingManager.setMap(null);
        };
    }, [map, isLoaded]); // mapが変わるたびに作り直す

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

                {map && opinions.map((data) => {

                    const isOpen = activeLabelLats.includes(data.latitude);

                    return (
                        <React.Fragment key={data.opinionId}>
                            <MarkerF
                                key={`marker-${data.latitude}-${isOpen}`}
                                position={{ lat: data.latitude, lng: data.longitude }}
                                onClick={() => toggleLabel(data.latitude)} // ★クリックでトグル
                                label={isOpen ? { text: data.commentText, color: "black", fontSize: "14px", fontWeight: "bold" } : undefined}
                            />

                            <Circle
                                onLoad={(circle) => {
                                    circleRefs.current[data.latitude] = circle;
                                }}
                                onUnmount={() => {
                                    // Reactのライフサイクルに合わせて地図から削除
                                    const c = circleRefs.current[data.latitude];
                                    if (c) c.setMap(null);
                                    delete circleRefs.current[data.latitude];
                                }}
                                center={{ lat: data.latitude, lng: data.longitude }}
                                radius={500}
                                options={{ ...circleOptions, clickable: false }}
                            />
                        </React.Fragment>
                    );
                })}
            </GoogleMap>

            <div style={{ padding: 20 }}>
                <h3>抽出された意見 ({extractedOpinions.length}件)</h3>
                <ul>
                    {extractedOpinions.map((op, i) => (
                        <li key={i}>{op}</li>
                    ))}
                </ul>
            </div>
        </>
    );
}