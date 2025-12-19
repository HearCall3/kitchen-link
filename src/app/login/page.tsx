"use client";

import { signIn } from "next-auth/react";
import styles from "./style.module.css";
// useSessionとuseEffectのロジックを削除しました

export default function LoginPage() {

  // useSessionの呼び出しを削除しました

  // useEffectブロックを削除しました

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneContent}>
        <h1 className={styles.title}>Kitchen Link</h1>

        <button
          className={styles.btn}
          // ログイン成功時にローカルストレージをセットする処理は、/userにリダイレクトされた後に行います
          onClick={() => signIn("google", { callbackUrl: "/user" })}
        >
          Googleでユーザーログイン
        </button>

        <button
          className={styles.btn}
          // ログイン成功時にローカルストレージをセットする処理は、/storeにリダイレクトされた後に行います
          onClick={() => signIn("google", { callbackUrl: "/store" })}
        >
          Googleで店舗ログイン
        </button>
      </div>
    </div>
  );
}