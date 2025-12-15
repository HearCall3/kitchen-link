// src/app/login/LoginContent.tsx (修正後)
"use client";

import { signIn } from "next-auth/react";
import styles from "./style.module.css";

export default function LoginContent() {
  return (
    <>
      <h1 className={styles.title}>Kitchen Link</h1>

      <button
        className={styles.btn}
        onClick={() => signIn("google", { callbackUrl: "/" })} 
      >
        Googleでユーザーログイン
      </button>

      <button
        className={styles.btn}
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        Googleで店舗ログイン
      </button>
    </>
  );
}