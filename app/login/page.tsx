"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { theme } = useTheme();

  // テーマに合わせたスタイル設定
  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100 border border-gray-800";
  const inputClass = theme === "light" 
    ? "border-gray-300 focus:border-blue-500 text-gray-900" 
    : "bg-black border-gray-700 focus:border-blue-500 text-white";
  const buttonClass = theme === "dark-red" ? "bg-red-700 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-700";

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } else {
      setMessage("✅ ログイン成功！ホームへ戻ります。");
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  // 新規登録処理
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } else {
      setMessage("✅ 登録完了！上の「ログイン」ボタンから中に入ってください🦍");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300">
      <div className={`max-w-md w-full p-8 rounded-lg shadow-xl ${containerClass}`}>
        <h1 className="text-3xl font-extrabold text-center mb-8">🦍 マッスルログイン</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
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
            {loading ? "通信中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-3">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="text-sm text-center opacity-70 hover:opacity-100 transition-opacity"
          >
            アカウントを持っていない方は <span className="underline font-bold text-blue-500">新規登録</span>
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