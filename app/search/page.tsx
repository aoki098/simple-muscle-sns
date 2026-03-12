"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { Search, User, Loader2, Lock } from "lucide-react"; 
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
};

// 💡 配列をランダムにシャッフルする最強のアルゴリズム（Fisher-Yates shuffle）
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function SearchPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data: followData } = await supabase
        .from("follows")
        .select("following_id, status")
        .eq("follower_id", user.id);
        
      if (followData) {
        setFollowingIds(followData.filter(f => f.status === 'accepted').map(f => f.following_id));
        setPendingIds(followData.filter(f => f.status === 'pending').map(f => f.following_id));
      }

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, is_private")
        .neq("id", user.id)
        .limit(50); // 💡 最新の50人を取得
        
      if (profilesData) {
        // 💡 取得したユーザー一覧をランダムにシャッフルしてセットする！
        const randomizedUsers = shuffleArray(profilesData);
        setUsers(randomizedUsers as Profile[]);
      }
      
      setIsLoading(false);
    };

    fetchUsers();
  }, [router]);

  const toggleFollow = async (targetId: string, isPrivate: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    const isFollowing = followingIds.includes(targetId);
    const isPending = pendingIds.includes(targetId);

    if (isFollowing || isPending) {
      setFollowingIds(prev => prev.filter(id => id !== targetId));
      setPendingIds(prev => prev.filter(id => id !== targetId));
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: targetId });
    } else {
      const newStatus = isPrivate ? 'pending' : 'accepted';
      
      if (isPrivate) {
        setPendingIds(prev => [...prev, targetId]);
      } else {
        setFollowingIds(prev => [...prev, targetId]);
      }
      
      await supabase.from("follows").insert({ 
        follower_id: currentUserId, 
        following_id: targetId,
        status: newStatus
      });

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: targetId,
        actor_id: currentUserId,
        type: newStatus === "pending" ? "pending" : "accepted"
      });
      if (notifError) console.error("通知エラー:", notifError);
    }
  };

  // 💡 検索バーの文字に応じて表示するユーザーを切り替えるエンジン！
  const displayUsers = searchQuery.trim() === "" 
    ? users // 何も入力されていない時は、シャッフルされたランダムな全ユーザーを表示
    : users.filter(user => (user.username || "").toLowerCase().includes(searchQuery.toLowerCase())); // 入力時は関連するユーザーだけを抽出

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-black border-gray-800 text-gray-100 hover:bg-gray-900";
  const inputClass = theme === "light" ? "bg-white border-gray-300 focus:ring-blue-500" : "bg-gray-900 border-gray-700 focus:ring-blue-500 text-white";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full px-4 pt-20 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Search className="w-6 h-6" /> ユーザーを探す
        </h1>

        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 opacity-50" />
          </div>
          <input
            type="text"
            className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-shadow ${inputClass}`}
            placeholder="ユーザー名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="font-bold text-sm">ユーザーを探しています...</span>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="text-center py-10 opacity-70 font-bold">
            ユーザーが見つかりませんでした。
          </div>
        ) : (
          <div className="space-y-4">
            {displayUsers.map((user) => {
              const isFollowing = followingIds.includes(user.id);
              const isPending = pendingIds.includes(user.id);
              const isPrivate = user.is_private;

              return (
                <Link 
                  href={`/profile/${user.id}`} 
                  key={user.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-colors ${cardClass}`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 shrink-0 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="icon" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center">
                        <p className="font-bold truncate">{user.username || "名無し"}</p>
                        {isPrivate && <Lock className="w-3.5 h-3.5 ml-1.5 text-gray-500" strokeWidth={2.5} />}
                      </div>
                      {user.bio && <p className="text-xs opacity-70 mt-0.5 truncate">{user.bio}</p>}
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleFollow(user.id, isPrivate, e)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center justify-center ${
                      isFollowing 
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" 
                        : isPending
                        ? "border border-gray-400 text-gray-500 dark:border-gray-600 dark:text-gray-400"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }`}
                  >
                    {isFollowing ? "フォロー中" : isPending ? "リクエスト済" : isPrivate ? "🔒 リクエスト" : "➕ フォロー"}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}