"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function LoginPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setMessage("");

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(`❌ ログインエラー: ${error.message}`);
      } else {
        setMessage("✅ ログイン成功！ホームへ戻ります。");
        router.push("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(`❌ 登録エラー: ${error.message}`);
      } else {
        setMessage("✅ 登録完了！ホームへ移動します");
        router.push("/");
      }
    }
    setLoading(false);
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setMessage("");
    
    // ※ここにテスト用アカウントの情報を設定します
    const { error } = await supabase.auth.signInWithPassword({ 
      email: "test@example.com", 
      password: "password123" 
    });

    if (error) {
      setMessage(`❌ テストログイン失敗: ${error.message}`);
    } else {
      setMessage("✅ テストアカウントでログインしました！");
      router.push("/");
    }
    setLoading(false);
  };

  return (
    // 💡 ここが修正ポイント！ pb-24 md:pb-40 を追加して、下からグッと持ち上げています！
    <main className="min-h-screen flex items-center justify-center px-4 pb-24 md:pb-40 transition-colors duration-300">
      <div className={`max-w-md w-full p-8 rounded-lg shadow-xl ${containerClass}`}>
        
        <h1 className="text-2xl font-extrabold text-center mb-8">
          {isLoginMode ? "ログイン" : "新規アカウント作成"}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">メールアドレス</label>
            <input
              type="email"
              required
              className={`w-full p-3 rounded-md border transition-colors ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mail@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
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
            {loading ? "通信中..." : isLoginMode ? "ログイン" : "新規登録してはじめる"}
          </button>
        </form>

        {isLoginMode && (
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 text-xs opacity-60 ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
                  または
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className={`w-full py-3 rounded-md font-bold transition-all shadow-sm border-2 ${
                theme === 'light' 
                  ? 'border-gray-300 hover:bg-gray-100 text-gray-800' 
                  : 'border-gray-700 hover:bg-gray-800 text-gray-200'
              } flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              テストアカウントでログイン
            </button>
            <p className="text-[10px] text-center mt-2 opacity-50">
              ※採用担当者様はこちらからワンタップでお試しいただけます。
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode); 
              setMessage(""); 
              setEmail(""); 
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