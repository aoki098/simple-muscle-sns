"use client";

import { useTheme } from "@/components/ThemeContext";
import { useState, useEffect } from "react"; // 💡 useEffect を追加！
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Settings, Lock, Palette, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [isPrivate, setIsPrivate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // 自分のIDを保持する筋肉
  const [isLoading, setIsLoading] = useState(true); // 読み込み中の状態管理

  const panelClass = theme === "light" ? "bg-white text-gray-800" : "bg-black border border-gray-800 text-gray-200";
  const dividerClass = theme === "light" ? "border-gray-200" : "border-gray-800";

  // 💡 ① 画面を開いた時に、自分の鍵垢設定をDBから取ってくる筋肉！
  useEffect(() => {
    const fetchPrivacySetting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("is_private")
          .eq("id", user.id)
          .single();
          
        if (data) {
          setIsPrivate(data.is_private || false);
        }
      }
      setIsLoading(false);
    };

    fetchPrivacySetting();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 💡 ② スイッチを押した時に、DBを更新する筋肉！
  const handleTogglePrivacy = async () => {
    if (!userId || isLoading) return;

    // 先に画面のスイッチを切り替える（サクサク動かすため）
    const newValue = !isPrivate;
    setIsPrivate(newValue);

    // 裏でSupabaseのデータを書き換える！
    const { error } = await supabase
      .from("profiles")
      .update({ is_private: newValue })
      .eq("id", userId);

    if (error) {
      console.error("更新エラー:", error);
      setIsPrivate(!newValue); // エラーが起きたら元に戻す
      alert("設定の更新に失敗しました。");
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <button 
      onClick={onChange} 
      disabled={disabled}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${checked ? 'bg-blue-600 justify-end' : 'bg-gray-500 justify-start'}`}
    >
      <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300"></div>
    </button>
  );

  return (
    <main className="min-h-screen py-0 px-4 transition-colors duration-300 pb-24">
      <h1 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2 pt-00">
        <Settings className="w-6 h-6 text-gray-500" />
        設定
      </h1>
      
      <div className="max-w-xl mx-auto space-y-3">
        
        {/* --- 🔒 アカウント公開設定 --- */}
        <div className={`py-3 px-3 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-2 border-b pb-2 flex items-center gap-2 ${dividerClass}`}>
            <Lock className="w-5 h-5 text-gray-500" />
            プライバシー
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-bold">非公開アカウント（鍵垢）</p>
              <p className="text-sm opacity-60 mt-1">オンにすると、フォロワー以外にはタイムラインが見えなくなります。</p>
            </div>
            {/* 💡 先ほど作った関数を渡す！ */}
            <ToggleSwitch 
              checked={isPrivate} 
              onChange={handleTogglePrivacy} 
              disabled={isLoading}
            />
          </div>
        </div>

        {/* --- 🎨 テーマカラー設定 --- */}
        <div className={`p-4 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 flex items-center gap-2 ${dividerClass}`}>
            <Palette className="w-5 h-5 text-gray-500" />
            テーマカラー
          </h2>
          <div className="space-y-2">
            <button onClick={() => setTheme("light")} className={`w-full py-2.5 font-bold rounded-md transition border ${theme === "light" ? "bg-gray-200 border-gray-400 text-gray-900" : "bg-black text-gray-400 border-gray-800 hover:border-gray-600"}`}>
              ライトモード
            </button>
            <button onClick={() => setTheme("dark-red")} className={`w-full py-2.5 font-bold rounded-md transition border ${theme === "dark-red" ? "bg-red-950 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-black text-red-500 border-gray-800 hover:border-red-900"}`}>
              ダークモード（赤）
            </button>
            <button onClick={() => setTheme("dark-blue")} className={`w-full py-2.5 font-bold rounded-md transition border ${theme === "dark-blue" ? "bg-blue-950 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black text-blue-500 border-gray-800 hover:border-blue-900"}`}>
              ダークモード（青）
            </button>
          </div>
        </div>

        {/* --- 🚪 アカウント管理 --- */}
        <div className={`p-3 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <button onClick={handleLogout} className="w-full py-2.5 bg-red-950 text-red-500 font-bold rounded-md hover:bg-red-900 border border-red-800 transition flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>

      </div>
    </main>
  );
}