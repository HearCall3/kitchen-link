"use client";

import { useState } from "react";
import styles from "./style.module.css";

export default function UserProfilePage() {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [job, setJob] = useState("");

  return (
    <div className="phone-frame">
      <div className="phone-content">
        <h2 className={styles.title}>プロフィール設定</h2>

        <div className={styles.card}>
          {/* ニックネーム */}
          <div>
            <label className={styles.label}>ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例：たろう"
              className={styles.inputtext}
            />
          </div>

          {/* 性別 */}
          <div>
            <label className={styles.label}>性別</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.input}
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* 年代 */}
          <div>
            <label className={styles.label}>年代</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className={styles.input}
            >
              <option value="">選択してください</option>
              <option value="10s">10代</option>
              <option value="20s">20代</option>
              <option value="30s">30代</option>
              <option value="40s">40代</option>
              <option value="50s">50代以上</option>
            </select>
          </div>

          {/* 職業 */}
          <div>
            <label className={styles.label}>職業</label>
            <select
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className={styles.input}
            >
              <option value="">職業を選択</option>
              <option value="student">学生</option>
              <option value="company">会社員</option>
              <option value="freelancer">フリーランス</option>
              <option value="self-employed">自営業</option>
              <option value="part-time">アルバイト・パート</option>
              <option value="unemployed">無職</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* 保存ボタン */}
          <button className={styles.btn} onClick={() => alert("保存しました！")}>
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}