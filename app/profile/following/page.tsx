"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// 💡 1. ユーザーの型に「投稿数」「フォロワー数」「フォロー数」を追加！
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
};

export default function FollowingPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 自分がフォローしている人（following_id）のリストを取得
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        
        // そのIDを持つユーザーのプロフィールをごっそり取得
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .in("id", followingIds);
          
        if (profiles) {
          // 💡 2. ここが本番！全員分の「投稿数」「フォロワー数」「フォロー数」を並行してカウントする！
          const profilesWithCounts = await Promise.all(
            profiles.map(async (p) => {
              // 投稿数をカウント
              const { count: postsCount } = await supabase
                .from("posts")
                .select("*", { count: "exact", head: true })
                .eq("user_id", p.id);
                
              // フォロワー数をカウント
              const { count: followersCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", p.id);
                
              // フォロー数をカウント
              const { count: followingCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_id", p.id);
                
              return {
                ...p,
                posts_count: postsCount || 0,
                followers_count: followersCount || 0,
                following_count: followingCount || 0
              };
            })
          );
          
          setUsers(profilesWithCounts);
        }
      } else {
        setUsers([]); // 誰もフォローしていなければ空っぽにする
      }
      
      setIsLoading(false);
    };

    fetchFollowing();
  }, [router]);

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-black border-gray-800 text-gray-100 hover:bg-gray-900";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full max-w-2xl mx-auto px-4 pt-0">
        <div className="flex items-center mb-6">
          <Link href="/profile" className="mr-4 p-2 hover:bg-gray-700/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">フォロー中</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="font-bold text-sm">読み込み中...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 opacity-70 font-bold">まだ誰もフォローしていません。</div>
        ) : (
          <div className="space-y-0.5">
            {users.map((user) => (
              // 💡 3. カード全体を <Link> に変更して、押したらその人のプロフィールに飛ぶようにした！
              <Link 
                href={`/profile/${user.id}`} 
                key={user.id} 
                className={`block p-2 rounded-xl border shadow-sm transition-colors ${cardClass}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 shrink-0 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="icon" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{user.username || "名無し"}</p>
                    {user.bio && <p className="text-xs opacity-70 mt-0.5 truncate">{user.bio}</p>}
                    
                    {/* 💡 4. カウントした数字をここで表示！ */}
                    <div className="flex items-center space-x-3 mt-1.5 text-xs font-medium opacity-80">
                      <span><span className="font-bold">{user.posts_count}</span> 投稿</span>
                      <span><span className="font-bold">{user.followers_count}</span> フォロワー</span>
                      <span><span className="font-bold">{user.following_count}</span> フォロー中</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}