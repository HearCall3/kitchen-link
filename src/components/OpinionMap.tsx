'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";

import {
    GoogleMap,
    MarkerF,
    InfoWindowF, // InfoWindow をインポート
    Circle,        // Circle をインポート
    type Libraries,
    DrawingManager,
    useJsApiLoader
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

interface myMarkerData {
    lat: number;
    lng: number;
    id: number;
};

interface testopinionData {
    lat: number,
    lon: number,
    opinion: string,
    radius: number;
};
const opinionList: testopinionData[] = [
    { "lat": 35.6895, "lon": 139.6917, "opinion": "新宿駅周辺は活気があります。", "radius": 850 },
    { "lat": 35.6580, "lon": 139.7016, "opinion": "渋谷のスクランブル交差点は有名です。", "radius": 950 },
    { "lat": 35.7148, "lon": 139.7745, "opinion": "上野動物園のパンダは人気者。", "radius": 700 },
    { "lat": 35.6812, "lon": 139.7671, "opinion": "東京駅丸の内口は美しい。", "radius": 900 },
    { "lat": 35.6631, "lon": 139.7340, "opinion": "六本木ヒルズからの眺めは絶景。", "radius": 780 },
    { "lat": 35.7000, "lon": 139.7780, "opinion": "秋葉原はアニメと電気街の聖地。", "radius": 650 },
    { "lat": 35.6295, "lon": 139.7738, "opinion": "お台場はデートスポットに最適。", "radius": 1100 },
    { "lat": 35.6738, "lon": 139.7100, "opinion": "原宿の竹下通りはいつも賑やか。", "radius": 820 },
    { "lat": 35.7289, "lon": 139.7109, "opinion": "池袋サンシャインシティは楽しい。", "radius": 730 },
    { "lat": 35.6453, "lon": 139.6787, "opinion": "世田谷公園は広々として気持ち良い。", "radius": 980 },
    { "lat": 35.7056, "lon": 139.7516, "opinion": "神田明神は歴史を感じる場所。", "radius": 550 },
    { "lat": 35.6940, "lon": 139.7031, "opinion": "都庁の展望台は無料で楽しめる。", "radius": 700 },
    { "lat": 35.6605, "lon": 139.7291, "opinion": "表参道は高級ブランド店が多い。", "radius": 600 },
    { "lat": 35.6898, "lon": 139.7407, "opinion": "皇居東御苑は静かで落ち着く。", "radius": 1050 },
    { "lat": 35.6171, "lon": 139.7300, "opinion": "品川駅は新幹線の玄関口。", "radius": 880 },
    { "lat": 35.7208, "lon": 139.7891, "opinion": "浅草寺は外国人観光客でいっぱい。", "radius": 750 },
    { "lat": 35.6025, "lon": 139.6990, "opinion": "目黒川の桜並木は美しい。", "radius": 630 },
    { "lat": 35.7380, "lon": 139.7045, "opinion": "王子駅周辺は落ち着いた雰囲気。", "radius": 500 },
    { "lat": 35.6790, "lon": 139.7500, "opinion": "銀座は日本の高級ショッピング街。", "radius": 920 },
    { "lat": 35.6700, "lon": 139.7850, "opinion": "月島のもんじゃ焼きは美味しい。", "radius": 580 }
]

export default function OpinionMap() {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries,
    });

    const [markers, setMarkers] = useState<myMarkerData>();
    const [extractedOpinions, setExtractedOpinions] = useState<string[]>([]);
    const [activeLabelLats, setActiveLabelLats] = useState<number[]>([]); const circleRefs = useRef<{ [lat: number]: google.maps.Circle }>({});
    const [map, setMap] = useState<google.maps.Map | null>(null);
    // DrawingManagerのインスタンスを保持するためのState（必要なら）
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);


    //自動表示ラベルを更新する関数 (onIdle / onLoad から呼ばれる)
    const updateVisibleLabels = useCallback((mapInstance: google.maps.Map) => {
        console.log("---- updateVisibleLabels ----");

        const bounds = mapInstance.getBounds();
        if (!bounds) return;

        // 範囲内のピンを絞り込み
        const visiblePins = opinionList
            .filter(pin => {
                const pinLatLng = new window.google.maps.LatLng(pin.lat, pin.lon);
                return bounds.contains(pinLatLng);


            })
            .slice(0, MAX_VISIBLE_LABELS); // 上限数でカット
        console.log("→ MAX_VISIBLE_LABELS 適用後:" + visiblePins);

        // 絞り込んだピンの「lat」の配列で state を更新
        setActiveLabelLats(visiblePins.map(pin => pin.lat));
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

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {

            const newMarker = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
                id: new Date().getTime() // とりあえずユニークなIDを付与
            }
            setMarkers(newMarker);
        };
    };

    const handleSurveyTransition = () => {

    }
    const handleOpinionTransition = () => {

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
            const filteredOpinions = opinionList
                .filter(pin => {
                    // ピンの座標
                    const pinLatLng = new window.google.maps.LatLng(pin.lat, pin.lon);

                    //ピンが範囲(bounds)に「含まれる(contains)」か判定
                    return bounds.contains(pinLatLng);
                })
                .map(pin => pin.opinion); // 5. 絞り込んだものから「意見(opinion)」だけを抜き出す

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
                onClick={handleMapClick}
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onLoad={onLoad}
                onIdle={onIdle}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: true,
                }}
            >
                {markers && (
                    <>
                        <MarkerF
                            key={markers?.id}
                            // `markerData` を `MarkerProps` (position) に変換
                            position={{ lat: markers.lat, lng: markers.lng }}
                        >
                            <InfoWindowF
                                position={{ lat: markers.lat, lng: markers.lng }}
                            >
                                <div>
                                    <button
                                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        onClick={handleSurveyTransition}
                                    >アンケート
                                    </button>
                                    <button
                                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        onClick={handleOpinionTransition}>
                                        意見</button>
                                </div>
                            </InfoWindowF>
                        </MarkerF>
                    </>
                )}

                {map && opinionList.map((data) => {

                    const isOpen = activeLabelLats.includes(data.lat);

                    return (
                        <React.Fragment key={data.lat}>
                            <MarkerF
                                key={`marker-${data.lat}-${isOpen}`}
                                position={{ lat: data.lat, lng: data.lon }}
                                onClick={() => toggleLabel(data.lat)} // ★クリックでトグル
                                label={isOpen ? { text: data.opinion, color: "black", fontSize: "14px", fontWeight: "bold" } : undefined}
                            />

                            <Circle
                                onLoad={(circle) => {
                                    circleRefs.current[data.lat] = circle;
                                }}
                                onUnmount={() => {
                                    // Reactのライフサイクルに合わせて地図から削除
                                    const c = circleRefs.current[data.lat];
                                    if (c) c.setMap(null);
                                    delete circleRefs.current[data.lat];
                                }}
                                center={{ lat: data.lat, lng: data.lon }}
                                radius={data.radius}
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