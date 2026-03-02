"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function LoginPage() {
  // 💡 追加：今が「ログイン画面」か「新規登録画面」かを管理するスイッチ
  const [isLoginMode, setIsLoginMode] = useState(true); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { theme } = useTheme();

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100 border border-gray-800";
  const inputClass = theme === "light" 
    ? "border-gray-300 focus:border-blue-500 text-gray-900" 
    : "bg-black border-gray-700 focus:border-blue-500 text-white";
  const buttonClass = theme === "dark-red" ? "bg-red-700 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-700";

  // 💡 統合された送信処理（青いメインのボタンを押した時だけ走る）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 空欄での送信を防ぐ
    setLoading(true);
    setMessage("");

    if (isLoginMode) {
      // --- ログインモードの時の処理 ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`❌ ログインエラー: ${error.message}`);
      } else {
        setMessage("✅ ログイン成功！ホームへ戻ります。");
        router.push("/");
        router.refresh();
      }
    } else {
      // --- 新規登録モードの時の処理 ---
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(`❌ 登録エラー: ${error.message}`);
      } else {
        // 登録に成功したら、そのままログイン状態にしてホーム画面へ飛ばす！
        setMessage("✅ 登録完了！ホームへ移動します🦍");
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <div className={`max-w-md w-full p-8 rounded-lg shadow-xl ${containerClass}`}>
        
        {/* 💡 画面のタイトルが切り替わる */}
        <h1 className="text-3xl font-extrabold text-center mb-8">
          {isLoginMode ? "🦍 マッスルログイン" : "🦍 新規アカウント作成"}
        </h1>
        
        {/* onSubmitで、上の handleSubmit が呼ばれる */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">メールアドレス</label>
            <input
              type="email"
              required
              className={`w-full p-3 rounded-md border transition-colors ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="muscle@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">パスワード</label>
            <input
              type="password"
              required
              minLength={6} // パスワードは最低6文字必要というルールを追加
              className={`w-full p-3 rounded-md border transition-colors ${inputClass}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md text-white font-bold transition-all shadow-lg ${buttonClass} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {/* 💡 青いメインボタンの文字も切り替わる */}
            {loading ? "通信中..." : isLoginMode ? "ログイン" : "新規登録してはじめる"}
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-3">
          {/* 💡 ここがモード切り替え用のボタン！押しても通信はせず、画面の見た目が変わるだけ */}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode); // モードを反転させる
              setMessage(""); // メッセージもリセット
              setEmail(""); // 入力欄もリセット
              setPassword("");
            }}
            disabled={loading}
            className="text-sm text-center opacity-70 hover:opacity-100 transition-opacity"
          >
            {isLoginMode ? (
              <>アカウントを持っていない方は <span className="underline font-bold text-blue-500">新規登録</span></>
            ) : (
              <>すでにアカウントをお持ちの方は <span className="underline font-bold text-blue-500">ログイン</span></>
            )}
          </button>
        </div>

        {message && (
          <div className={`mt-6 p-3 rounded-md text-sm text-center font-bold ${message.includes("❌") ? "bg-red-900/20 text-red-400" : "bg-green-900/20 text-green-400"}`}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}