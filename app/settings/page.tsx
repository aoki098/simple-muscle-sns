"use client";

import { useTheme } from "@/components/ThemeContext";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
// 💡 使わなくなった Sun, Flame, Droplet を削除しました
import { Settings, Lock, Palette, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [isPrivate, setIsPrivate] = useState(false);

  const panelClass = theme === "light" ? "bg-white text-gray-800" : "bg-black border border-gray-800 text-gray-200";
  const dividerClass = theme === "light" ? "border-gray-200" : "border-gray-800";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button onClick={onChange} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${checked ? 'bg-blue-600 justify-end' : 'bg-gray-500 justify-start'}`}>
      <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300"></div>
    </button>
  );

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24">
      <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        <Settings className="w-7 h-7 text-gray-500" />
        設定
      </h1>
      
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* --- 🔒 アカウント公開設定 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 flex items-center gap-2 ${dividerClass}`}>
            <Lock className="w-5 h-5 text-gray-500" />
            プライバシー
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-bold">非公開アカウント（鍵垢）</p>
              <p className="text-sm opacity-60 mt-1">オンにすると、フォロワー以外にはタイムラインが見えなくなります。</p>
            </div>
            <ToggleSwitch checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />
          </div>
        </div>

        {/* --- 🎨 テーマカラー設定 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 flex items-center gap-2 ${dividerClass}`}>
            <Palette className="w-5 h-5 text-gray-500" />
            テーマカラー
          </h2>
          {/* 💡 アイコンを削除し、「ライトモード」等の標準的な名前に変更！ */}
          <div className="space-y-3">
            <button onClick={() => setTheme("light")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "light" ? "bg-gray-200 border-gray-400 text-gray-900" : "bg-black text-gray-400 border-gray-800 hover:border-gray-600"}`}>
              ライトモード
            </button>
            <button onClick={() => setTheme("dark-red")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-red" ? "bg-red-950 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-black text-red-500 border-gray-800 hover:border-red-900"}`}>
              ダークモード（赤）
            </button>
            <button onClick={() => setTheme("dark-blue")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-blue" ? "bg-blue-950 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black text-blue-500 border-gray-800 hover:border-blue-900"}`}>
              ダークモード（青）
            </button>
          </div>
        </div>

        {/* --- 🚪 アカウント管理 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <button onClick={handleLogout} className="w-full py-3 bg-red-950 text-red-500 font-bold rounded-md hover:bg-red-900 border border-red-800 transition flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>

      </div>
    </main>
  );
}