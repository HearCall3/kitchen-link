"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

export default function StoreProfileEditPage() {
    const router = useRouter();

    return (
        <div className={styles["phone-frame"]}>
            <div className={styles["phone-content"]}>
                {/* タイトル */}
                <h2 className={styles.title}>マイ投稿</h2>

                <div className={`home-button`}>
                    <button
                        className={styles.iconButton}
                        onClick={() => router.push("/")}
                        title="ホームに戻る"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}