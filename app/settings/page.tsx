"use client";

import { useTheme } from "@/components/ThemeContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // 入力された文字を管理する状態（最初は空っぽにしておきます）
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isPrivate, setIsPrivate] = useState(false);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);

  const panelClass = theme === "light" ? "bg-white text-gray-800" : "bg-black border border-gray-800 text-gray-200";
  const inputClass = theme === "light"
    ? "bg-gray-50 border-gray-300 focus:border-blue-500 text-gray-900"
    : "bg-black border-gray-700 focus:border-blue-500 text-white placeholder-gray-600";
  const dividerClass = theme === "light" ? "border-gray-200" : "border-gray-800";

  // 画面を開いた時に、すでに保存されているプロフィールを読み込む
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUsername(data.username || "");
          setBio(data.bio || "");
        }
      }
    };
    fetchProfile();
  }, []);

  // 💾 プロフィールを保存する関数
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage("");
    
    // 今ログインしているユーザーの情報を取得
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage("❌ ログインしていません");
      setIsSaving(false);
      return;
    }

    // Supabaseの profiles テーブルにデータを保存（上書き）
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id, // 誰のデータか紐付けるためのID
        username: username,
        bio: bio,
      });

    if (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } else {
      setMessage("✅ プロフィールを保存しました！");
    }
    
    setIsSaving(false);
    
    // 3秒後にメッセージを消す
    setTimeout(() => setMessage(""), 3000);
  };

  // 🚪 ログアウト関数（前回作ったもの）
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${checked ? 'bg-blue-600 justify-end' : 'bg-gray-500 justify-start'}`}
    >
      <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300"></div>
    </button>
  );

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24">
      <h1 className="text-2xl font-bold text-center mb-6">
        ⚙️ 設定・プロフィール
      </h1>
      
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* --- 👤 プロフィール設定 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>👤 プロフィール</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-gray-800"}`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="プロフィール画像" className="w-full h-full object-cover" />
                ) : (
                  "🦍"
                )}
              </div>
              <label className="cursor-pointer text-sm text-blue-500 font-bold px-3 py-1 border border-blue-500 rounded-md hover:bg-blue-600 hover:text-white transition">
                アイコンを変更
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">ユーザーネーム</label>
              <input 
                type="text" 
                value={username} // 入力された状態を連携
                onChange={(e) => setUsername(e.target.value)} // 文字を打つたびに状態を更新
                placeholder="筋トレ大好き太郎"
                className={`w-full rounded-md border p-2 transition-colors duration-300 ${inputClass}`} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">自己紹介</label>
              <textarea 
                rows={3}
                value={bio} // 入力された状態を連携
                onChange={(e) => setBio(e.target.value)} // 文字を打つたびに状態を更新
                placeholder="ベンチプレス100kg目指して頑張ります！"
                className={`w-full rounded-md border p-2 transition-colors duration-300 ${inputClass}`} 
              />
            </div>
            
            <button 
              onClick={handleSaveProfile} // クリックした時に保存関数を呼び出す
              disabled={isSaving}
              className={`w-full py-2 text-white font-bold rounded-md transition shadow-md ${isSaving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSaving ? "保存中..." : "プロフィールを保存"}
            </button>

            {/* 保存完了メッセージの表示 */}
            {message && (
              <p className={`text-center font-bold text-sm mt-2 ${message.includes("❌") ? "text-red-500" : "text-green-500"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* --- 🔒 アカウント公開設定（鍵垢） --- */}
        {/* ... 中略（変更なし） ... */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>🔒 プライバシー</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-bold">非公開アカウント（鍵垢）</p>
              <p className="text-sm opacity-60 mt-1">オンにすると、フォロワー以外にはタイムラインの投稿や記録が見えなくなります。</p>
            </div>
            <ToggleSwitch checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />
          </div>
        </div>

        {/* --- 🎨 テーマカラー設定 --- */}
        {/* ... 中略（変更なし） ... */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>🎨 テーマカラー</h2>
          <div className="space-y-3">
            <button onClick={() => setTheme("light")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "light" ? "bg-gray-200 border-gray-400 text-gray-900" : "bg-black text-gray-400 border-gray-800 hover:border-gray-600"}`}>
              🕊️ シンプルホワイト
            </button>
            <button onClick={() => setTheme("dark-red")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-red" ? "bg-red-950 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-black text-red-500 border-gray-800 hover:border-red-900"}`}>
              🔥 ダークモード（赤）
            </button>
            <button onClick={() => setTheme("dark-blue")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-blue" ? "bg-blue-950 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black text-blue-500 border-gray-800 hover:border-blue-900"}`}>
              💧 ダークモード（青）
            </button>
          </div>
        </div>

        {/* --- 🚪 アカウント管理 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <button 
            onClick={handleLogout} 
            className="w-full py-3 bg-red-950 text-red-500 font-bold rounded-md hover:bg-red-900 border border-red-800 transition"
          >
            🚪 ログアウト
          </button>
        </div>

      </div>
    </main>
  );
}