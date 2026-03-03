"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function FollowersPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 💡 1. 自分をフォローしてくれている人（follower_id）のリストを取得
      const { data: follows } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (follows && follows.length > 0) {
        const followerIds = follows.map(f => f.follower_id);
        
        // 💡 2. そのIDを持つユーザーのプロフィールをごっそり取得！
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .in("id", followerIds);
          
        if (profiles) {
          setUsers(profiles);
        }
      } else {
        setUsers([]); // フォロワーがいなければ空っぽにする
      }
      
      setIsLoading(false);
    };

    fetchFollowers();
  }, [router]);

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-100";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full px-4 pt-20">
        <div className="flex items-center mb-6">
          <Link href="/profile" className="mr-4 p-2 hover:bg-gray-700/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">フォロワー</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="font-bold text-sm">読み込み中...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 opacity-70 font-bold">まだフォロワーがいません。</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${cardClass}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="icon" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{user.username || "名無し"}</p>
                    {user.bio && <p className="text-xs opacity-70 mt-0.5 line-clamp-1">{user.bio}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}