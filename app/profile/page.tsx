"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
// 💡 追加：使うSVGアイコンたちを呼び出す！
import { User, Activity, CalendarDays, UserCheck, Users } from "lucide-react";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ postsCount: 0, following: 0, followers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isBodyEditing, setIsBodyEditing] = useState(false);
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");

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

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({ postsCount: postsCount || 0, following: 0, followers: 0 });
      setIsLoading(false);
    };
    fetchUserData();
  }, [router]);

  const handleChangeIcon = () => {
    const newUrl = window.prompt("新しいアイコン画像のURLを貼り付けてください🦍", editAvatarUrl);
    if (newUrl !== null) setEditAvatarUrl(newUrl);
  };

  const handleSaveBodyMetrics = async () => {
    if (!userId) return;
    setIsLoading(true);
    const updates = {
      height: editHeight ? parseFloat(editHeight) : null,
      weight: editWeight ? parseFloat(editWeight) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (!error) {
      setProfile({ ...profile, ...updates });
      setIsBodyEditing(false);
    } else {
      alert("❌ 更新に失敗しました: " + error.message);
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    const updates = {
      username: editUsername,
      avatar_url: editAvatarUrl,
      bio: editBio,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (!error) {
      setProfile({ ...profile, ...updates });
      alert("✅ プロフィールを保存しました！🦍");
    } else {
      alert("❌ 更新に失敗しました: " + error.message);
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

  const btnSolidClass = isRed 
    ? "bg-red-600 hover:bg-red-700" 
    : "bg-blue-600 hover:bg-blue-700";

  const btnEditClass = isRed
    ? "text-red-400 hover:text-red-300 bg-red-900/30"
    : "text-blue-400 hover:text-blue-300 bg-blue-900/30";

  if (isLoading && !profile) return <div className="min-h-screen flex items-center justify-center font-bold opacity-70">読み込み中...🦍</div>;

  return (
    <main className={`min-h-screen p-4 transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="max-w-md mx-auto space-y-6 pt-2">
        
        <div className={`p-6 rounded-xl shadow-md border ${cardClass}`}>
          {/* 💡 絵文字を消して <User /> アイコンに変更 */}
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-gray-700/50 pb-3">
            <User className="w-5 h-5 text-gray-500" />
            プロフィール
          </h2>

          <div className="flex items-center space-x-6 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300 shadow-sm bg-gray-200 flex items-center justify-center shrink-0">
              {editAvatarUrl ? (
                <img src={editAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" /> /* 💡 ゴリラマークから変更 */
              )}
            </div>
            <button 
              onClick={handleChangeIcon}
              className={`px-4 py-1.5 text-sm font-bold border rounded-md transition-colors ${btnOutlineClass}`}
            >
              アイコンを変更
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold opacity-80 mb-1.5">ユーザーネーム</label>
              <input 
                type="text" 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)}
                className={`w-full p-2.5 rounded-md border outline-none transition-colors ${inputClass}`}
                placeholder="ふぉn"
              />
            </div>
            <div>
              <label className="block text-sm font-bold opacity-80 mb-1.5">自己紹介</label>
              <textarea 
                value={editBio} 
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                className={`w-full p-2.5 rounded-md border outline-none transition-colors resize-none ${inputClass}`}
                placeholder="よろしくお願いします！"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveProfile} 
            disabled={isSavingProfile} 
            className={`w-full mt-6 py-3 text-white font-bold rounded-md shadow-md transition-all active:scale-95 ${btnSolidClass}`}
          >
            {isSavingProfile ? "保存中..." : "プロフィールを保存"}
          </button>
        </div>

        {/* 💡 実績の各項目にもアイコンを追加！ */}
        <div className="flex justify-between items-center text-center p-4 rounded-xl shadow-md bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-gray-700/50">
          <div className="flex-1">
            <CalendarDays className="w-5 h-5 mx-auto mb-1 opacity-70" />
            <div className="text-xs opacity-80 font-bold mb-1">記録日数</div>
            <div className="text-2xl font-extrabold">{stats.postsCount}</div>
          </div>
          <div className="w-px h-10 bg-gray-600/50"></div>
          <div className="flex-1">
            <UserCheck className="w-5 h-5 mx-auto mb-1 opacity-70" />
            <div className="text-xs opacity-80 font-bold mb-1">フォロー</div>
            <div className="text-2xl font-extrabold">{stats.following}</div>
          </div>
          <div className="w-px h-10 bg-gray-600/50"></div>
          <div className="flex-1">
            <Users className="w-5 h-5 mx-auto mb-1 opacity-70" />
            <div className="text-xs opacity-80 font-bold mb-1">フォロワー</div>
            <div className="text-2xl font-extrabold">{stats.followers}</div>
          </div>
        </div>

        <div className={`p-5 rounded-xl shadow-md border ${cardClass}`}>
          {/* 💡 絵文字を消して <Activity /> アイコンに変更 */}
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 border-b border-gray-700/50 pb-2">
            <Activity className="w-5 h-5 text-gray-500" />
            現在のボディデータ
          </h2>
          <div className="flex justify-between items-center mb-4 pb-2">
            {!isBodyEditing ? (
              <button onClick={() => setIsBodyEditing(true)} className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${btnEditClass}`}>
                編集する
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={() => setIsBodyEditing(false)} className="text-sm text-gray-400 font-bold px-3 py-1 transition-colors">キャンセル</button>
                <button onClick={handleSaveBodyMetrics} disabled={isLoading} className="text-sm text-green-400 hover:text-green-300 font-bold px-3 py-1 bg-green-900/30 rounded-full transition-colors">
                  {isLoading ? "保存中..." : "保存する"}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-around items-center text-center py-2">
            <div className="space-y-2">
              <div className="text-sm opacity-70 font-bold">身長 (cm)</div>
              {isBodyEditing ? (
                <input 
                  type="number" 
                  value={editHeight} 
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="171" 
                  className={`w-20 p-2 text-center rounded-md outline-none transition-colors ${inputClass}`}
                />
              ) : (
                <div className="text-3xl font-extrabold">{profile?.height ? profile.height : "---"}</div>
              )}
            </div>
            <div className="w-px h-12 bg-gray-700/50"></div>
            <div className="space-y-2">
              <div className="text-sm opacity-70 font-bold">体重 (kg)</div>
              {isBodyEditing ? (
                <input 
                  type="number" 
                  value={editWeight} 
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="59" 
                  className={`w-20 p-2 text-center rounded-md outline-none transition-colors ${inputClass}`}
                />
              ) : (
                <div className="text-3xl font-extrabold">{profile?.weight ? profile.weight : "---"}</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}