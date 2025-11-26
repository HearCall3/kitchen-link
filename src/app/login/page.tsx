"use client";
import { signIn } from "next-auth/react";
import "./style.css";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-frame">
        <h1>KitchenLink ログイン</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/user" })}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full transition-colors"
        >
          Googleでログイン
        </button>



        <p>ログインするとKitchenLinkの機能を利用できます</p>
      </div>
    </div>
  );
}
