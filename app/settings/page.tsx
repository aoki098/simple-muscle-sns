"use client";

import { useTheme } from "@/components/ThemeContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // 📸 追加：アップロード用に「選んだ画像ファイル」を一時保存する箱
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isPrivate, setIsPrivate] = useState(false);

  const panelClass = theme === "light" ? "bg-white text-gray-800" : "bg-black border border-gray-800 text-gray-200";
  const inputClass = theme === "light"
    ? "bg-gray-50 border-gray-300 focus:border-blue-500 text-gray-900"
    : "bg-black border-gray-700 focus:border-blue-500 text-white placeholder-gray-600";
  const dividerClass = theme === "light" ? "border-gray-200" : "border-gray-800";

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setUsername(data.username || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || null);
        }
      }
    };
    fetchProfile();
  }, []);

  // 💾 プロフィール＆画像を保存する関数
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage("");
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage("❌ ログインしていません");
      setIsSaving(false);
      return;
    }

    let newAvatarUrl = avatarUrl; // 基本は今のURLのまま

    // 📸 もし新しい画像が選ばれていたら、Supabaseストレージにアップロード！
    if (avatarFile) {
      // ファイル名が被らないようにランダムな数字をつける
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // avatarsバケツに画像をアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setMessage(`❌ 画像の保存に失敗しました: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }

      // 成功したら、その画像の「公開URL」を取得する
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      newAvatarUrl = publicUrl; // 新しいURLに書き換え！
    }

    // テキストと画像URLを profiles テーブルに保存
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username,
        bio: bio,
        avatar_url: newAvatarUrl, // ここがポイント！
      });

    if (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } else {
      setMessage("✅ プロフィールを保存しました！");
      setAvatarUrl(newAvatarUrl); // 画面の表示も最新にする
      setAvatarFile(null); // ファイルの選択状態をリセット
    }
    
    setIsSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

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
      <h1 className="text-2xl font-bold text-center mb-6">⚙️ 設定・プロフィール</h1>
      
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* --- 👤 プロフィール設定 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>👤 プロフィール</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-gray-800"}`}>
                {/* プレビュー表示の切り替え */}
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} alt="プレビュー" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
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
                    if (file) setAvatarFile(file); // 選んだファイルを箱に入れる
                  }}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">ユーザーネーム</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full rounded-md border p-2 transition-colors duration-300 ${inputClass}`} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">自己紹介</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={`w-full rounded-md border p-2 transition-colors duration-300 ${inputClass}`} />
            </div>
            
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`w-full py-2 text-white font-bold rounded-md transition shadow-md ${isSaving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSaving ? "保存中..." : "プロフィールを保存"}
            </button>

            {message && (
              <p className={`text-center font-bold text-sm mt-2 ${message.includes("❌") ? "text-red-500" : "text-green-500"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* --- 🔒 アカウント公開設定 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>🔒 プライバシー</h2>
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
          <h2 className={`font-bold mb-4 border-b pb-2 ${dividerClass}`}>🎨 テーマカラー</h2>
          <div className="space-y-3">
            <button onClick={() => setTheme("light")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "light" ? "bg-gray-200 border-gray-400 text-gray-900" : "bg-black text-gray-400 border-gray-800 hover:border-gray-600"}`}>🕊️ シンプルホワイト</button>
            <button onClick={() => setTheme("dark-red")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-red" ? "bg-red-950 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-black text-red-500 border-gray-800 hover:border-red-900"}`}>🔥 ダークモード（赤）</button>
            <button onClick={() => setTheme("dark-blue")} className={`w-full py-3 font-bold rounded-md transition border ${theme === "dark-blue" ? "bg-blue-950 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-black text-blue-500 border-gray-800 hover:border-blue-900"}`}>💧 ダークモード（青）</button>
          </div>
        </div>

        {/* --- 🚪 アカウント管理 --- */}
        <div className={`p-6 rounded-lg shadow-md transition-colors duration-300 ${panelClass}`}>
          <button onClick={handleLogout} className="w-full py-3 bg-red-950 text-red-500 font-bold rounded-md hover:bg-red-900 border border-red-800 transition">
            🚪 ログアウト
          </button>
        </div>

      </div>
    </main>
  );
}