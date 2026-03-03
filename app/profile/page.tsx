"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import { User, Activity, CalendarDays, UserCheck, Users, Ruler, Weight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ postsCount: 0, following: 0, followers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 身体データ編集用
  const [isBodyEditing, setIsBodyEditing] = useState(false);
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");

  // プロフィール編集用
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBio, setEditBio] = useState("");

  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // プロフィール情報の取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setEditHeight(profileData.height?.toString() || "");
        setEditWeight(profileData.weight?.toString() || "");
        setEditUsername(profileData.username || "");
        setEditAvatarUrl(profileData.avatar_url || "");
        setEditBio(profileData.bio || "");
      }

      // 💡 1. 自分の「投稿数」を数える
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // 💡 2. 自分が「フォローしている数（Following）」を数える
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      // 💡 3. 自分を「フォローしてくれている数（Followers）」を数える
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      // 💡 4. 数えた結果を画面の表示用の箱（Stats）にセットする！
      setStats({ 
        postsCount: postsCount || 0, 
        following: followingCount || 0, 
        followers: followersCount || 0 
      });
      
      setIsLoading(false);
    };
    fetchUserData();
  }, [router]);

  const handleChangeIcon = () => {
    const newUrl = window.prompt("新しいアイコン画像のURLを貼り付けてください🦍", editAvatarUrl);
    if (newUrl !== null) setEditAvatarUrl(newUrl);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    const updates = {
      username: editUsername,
      avatar_url: editAvatarUrl,
      bio: editBio,
      height: editHeight ? parseFloat(editHeight) : null,
      weight: editWeight ? parseFloat(editWeight) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (!error) {
      setProfile({ ...profile, ...updates });
      setIsBodyEditing(false);
      alert("✅ 保存しました！");
    } else {
      alert("❌ 失敗: " + error.message);
    }
    setIsSavingProfile(false);
  };

  const isRed = theme === "dark-red";
  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800";
  const inputClass = theme === "light" 
    ? "bg-white border-gray-300 text-black focus:border-blue-500" 
    : `bg-black/50 border-gray-600 text-white ${isRed ? "focus:border-red-500" : "focus:border-blue-500"}`;

  const btnOutlineClass = isRed 
    ? "text-red-500 border-red-500 hover:bg-red-900/30" 
    : "text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30";

  const btnSolidClass = isRed ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";

  if (isLoading && !profile) return <div className="min-h-screen flex items-center justify-center font-bold opacity-70 text-white">読み込み中...🦍</div>;

  // ... (中略：importやステート部分はそのまま)

  return (
    <main className={`min-h-screen p-4 transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="max-w-2xl mx-auto space-y-6 pt-20">
        
        {/* メインプロフィールカード */}
        <div className={`rounded-xl shadow-md border ${cardClass}`}>
          
          {/* 💡 追加：カード内の一番上に「プロフィール」の見出しと線を追加 */}
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              プロフィール
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* 左側：アイコンと変更ボタン */}
              <div className="flex flex-col items-center space-y-4 shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600 shadow-sm bg-gray-800 flex items-center justify-center">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <button 
                  onClick={handleChangeIcon}
                  className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors ${btnOutlineClass}`}
                >
                  アイコンを変更
                </button>
              </div>

              {/* 右側：上部に数字、下部に身体データ */}
              <div className="flex-1 w-full space-y-6">
                
                {/* 上部：投稿数・フォロー中・フォロワー */}
                <div className="flex justify-between text-center">
                  
                  {/* 投稿数（/recordsへ） */}
                  <Link href="/records" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.postsCount}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Posts</div>
                  </Link>

                  {/* 💡 変更：フォロー中（Following）を真ん中に移動！ */}
                  <Link href="/profile/following" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.following}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Following</div>
                  </Link>
                  
                  {/* 💡 変更：フォロワー（Followers）を右端に移動！ */}
                  <Link href="/profile/followers" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.followers}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Followers</div>
                  </Link>
                  
                </div>

                {/* 下部：身長・体重の表示/編集 */}
                <div className={`p-4 rounded-lg flex justify-around items-center ${theme === 'light' ? 'bg-gray-50' : 'bg-black/40 border border-gray-800'}`}>
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-[10px] opacity-60 font-bold">HEIGHT</p>
                      {isBodyEditing ? (
                        <input type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} className={`w-16 text-sm p-1 rounded border ${inputClass}`} />
                      ) : (
                        <p className="font-bold">{profile?.height || "---"} <span className="text-xs font-normal">cm</span></p>
                      )}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-700/30"></div>
                  <div className="flex items-center gap-3">
                    <Weight className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-[10px] opacity-60 font-bold">WEIGHT</p>
                      {isBodyEditing ? (
                        <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className={`w-16 text-sm p-1 rounded border ${inputClass}`} />
                      ) : (
                        <p className="font-bold">{profile?.weight || "---"} <span className="text-xs font-normal">kg</span></p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => isBodyEditing ? handleSaveProfile() : setIsBodyEditing(true)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-full border ${btnOutlineClass}`}
                  >
                    {isBodyEditing ? "保存" : "編集"}
                  </button>
                </div>
              </div>
            </div>

            {/* ユーザーネームと自己紹介 */}
            <div className="mt-8 space-y-4 pt-6 border-t border-gray-700/50">
              <div>
                <label className="block text-xs font-bold opacity-60 mb-1.5 uppercase tracking-widest">User Name</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={`w-full p-2.5 rounded-md border outline-none transition-colors ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold opacity-60 mb-1.5 uppercase tracking-widest">Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className={`w-full p-2.5 rounded-md border outline-none transition-colors resize-none ${inputClass}`}
                  placeholder="よろしくお願いします！"
                />
              </div>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSavingProfile} 
                className={`w-full py-3 text-white font-bold rounded-md shadow-md transition-all active:scale-95 ${btnSolidClass}`}
              >
                プロフィールを保存
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}