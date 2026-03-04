"use client";

import { useEffect, useState, useRef } from "react"; // 💡 useRefを追加！
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
import { User, Activity, CalendarDays, UserCheck, Users, Ruler, Weight, Loader2 } from "lucide-react"; // 💡 Loader2を追加！
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

  // 💡 画像アップロード用の筋肉（RefとState）
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

      const { count: postsCount } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);
      const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);

      setStats({ 
        postsCount: postsCount || 0, 
        following: followingCount || 0, 
        followers: followersCount || 0 
      });
      
      setIsLoading(false);
    };
    fetchUserData();
  }, [router]);

  // 💡 画像選択（エクスプローラ）を開く筋肉！
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 💡 選んだ画像をSupabaseにアップロードする筋肉！
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !userId) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // ファイル名が被らないように「ユーザーID/現在の時間.拡張子」にする
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      setIsUploadingImage(true);

      // ① Supabaseの「avatars」バケツに画像をアップロード！
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // ② アップロードした画像の「公開URL」を取得！
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // ③ 画面のアイコンURLを新しいものに書き換える（プレビュー）
      setEditAvatarUrl(publicUrl);
      
    } catch (error: any) {
      alert("❌ 画像のアップロードに失敗しました: " + error.message);
    } finally {
      setIsUploadingImage(false);
      // 同じ画像を連続で選べるように入力値をリセット
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    const updates = {
      username: editUsername,
      avatar_url: editAvatarUrl, // ここで先ほどアップロードした画像のURLが保存される！
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

  return (
    <main className={`min-h-screen p-4 transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="max-w-2xl mx-auto space-y-6 pt-20">
        
        <div className={`rounded-xl shadow-md border ${cardClass}`}>
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
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600 shadow-sm bg-gray-800 flex items-center justify-center relative group">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                  {/* アップロード中はローディングを重ねる */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* 💡 隠しファイル入力！ */}
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />

                <button 
                  onClick={handleImageClick}
                  disabled={isUploadingImage}
                  className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors flex items-center gap-1 ${
                    isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  } ${btnOutlineClass}`}
                >
                  {isUploadingImage ? "画像送信中..." : "アイコンを変更"}
                </button>
              </div>

              {/* 右側：上部に数字、下部に身体データ */}
              <div className="flex-1 w-full space-y-6">
                <div className="flex justify-between text-center">
                  <Link href="/records" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.postsCount}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Posts</div>
                  </Link>
                  <Link href="/profile/following" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.following}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Following</div>
                  </Link>
                  <Link href="/profile/followers" className="hover:opacity-70 transition-opacity block cursor-pointer">
                    <div className="text-xl font-extrabold">{stats.followers}</div>
                    <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Followers</div>
                  </Link>
                </div>

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
                className={`w-full py-3 text-white font-bold rounded-md shadow-md transition-all active:scale-95 ${
                  isSavingProfile ? 'opacity-70 cursor-not-allowed' : ''
                } ${btnSolidClass}`}
              >
                {isSavingProfile ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 保存中...</span>
                ) : "プロフィールを保存"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}