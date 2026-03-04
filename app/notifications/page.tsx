"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { Bell, User, Loader2, Check, X, Heart } from "lucide-react"; // 💡 Heart追加！
import { useRouter } from "next/navigation";

// 💡 通知の種類をまとめられるように型をパワーアップ！
type NotificationItem = {
  id: string; // 通知ごとのユニークなID
  type: "pending" | "accepted" | "like"; // 💡 いいね(like)を追加！
  actor: { id: string; username: string; avatar_url: string | null }; // アクションを起こした人
  postContext?: string; // いいねされた投稿のチラ見せテキスト
  postId?: string; // いいねされた投稿のID
};

export default function NotificationsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      let allNotifications: NotificationItem[] = [];

      // ==========================================
      // ① フォロー＆リクエストの通知を取得する筋肉
      // ==========================================
      const { data: followsData } = await supabase
        .from("follows")
        .select("follower_id, status")
        .eq("following_id", user.id);

      if (followsData && followsData.length > 0) {
        const followerIds = followsData.map(f => f.follower_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", followerIds);
          
        if (profilesData) {
          const followNotifs = profilesData.map(profile => {
            const followInfo = followsData.find(f => f.follower_id === profile.id);
            return {
              id: `follow_${profile.id}`,
              type: (followInfo?.status || "accepted") as "pending" | "accepted",
              actor: profile
            };
          });
          allNotifications = [...allNotifications, ...followNotifs];
        }
      }

      // ==========================================
      // ② いいね（Heart）の通知を取得する筋肉！！
      // ==========================================
      // まず「自分の投稿」を全部取得する
      const { data: myPosts } = await supabase
        .from("posts")
        .select("id, exercises, meal_details")
        .eq("user_id", user.id);

      if (myPosts && myPosts.length > 0) {
        const myPostIds = myPosts.map(p => p.id);
        
        // 自分の投稿についた「いいね」を、押した人のプロフィールごと取得！
        // ※自分自身の「いいね」は通知に出さないように .neq で弾く！
        const { data: likesData } = await supabase
          .from("likes")
          .select(`
            id, post_id, 
            profiles (id, username, avatar_url)
          `)
          .in("post_id", myPostIds)
          .neq("user_id", user.id);

        if (likesData && likesData.length > 0) {
          const likeNotifs = likesData.map((like: any) => {
            // どの投稿へのいいねか分かるように、投稿の中身を少しだけ抽出
            const targetPost = myPosts.find(p => p.id === like.post_id);
            let context = "あなたの投稿";
            if (targetPost) {
              if (targetPost.exercises && targetPost.exercises.length > 0) {
                context = `「${targetPost.exercises[0].name}」などの記録`;
              } else if (targetPost.meal_details) {
                context = `食事の記録`;
              }
            }

            return {
              id: `like_${like.id}`,
              type: "like" as const,
              actor: like.profiles,
              postContext: context,
              postId: like.post_id
            };
          });
          allNotifications = [...allNotifications, ...likeNotifs];
        }
      }

      // 全部まとめてセット！（とりあえずUIの都合上、まとめて表示します）
      setNotifications(allNotifications);
      setIsLoading(false);
    };

    fetchNotifications();
  }, [router]);

  const handleAccept = async (followerId: string) => {
    if (!currentUserId) return;
    
    setNotifications(prev => prev.map(n => 
      n.id === `follow_${followerId}` ? { ...n, type: "accepted" } : n
    ));

    await supabase
      .from("follows")
      .update({ status: "accepted" })
      .match({ follower_id: followerId, following_id: currentUserId });
  };

  const handleDecline = async (followerId: string) => {
    if (!currentUserId) return;
    
    setNotifications(prev => prev.filter(n => n.id !== `follow_${followerId}`));

    await supabase
      .from("follows")
      .delete()
      .match({ follower_id: followerId, following_id: currentUserId });
  };

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-100";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full px-4 pt-20 max-w-2xl mx-auto">
        
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <Bell className="w-6 h-6" /> 通知
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="font-bold text-sm">読み込み中...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 opacity-60 font-bold bg-gray-500/5 rounded-xl border border-gray-500/10">
            まだ通知はありません。
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${cardClass}`}>
                
                <Link href={`/profile/${item.actor.id}`} className="flex items-center space-x-3 overflow-hidden hover:opacity-70 transition-opacity">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 shrink-0 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                    {item.actor.avatar_url ? (
                      <img src={item.actor.avatar_url} alt="icon" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="font-bold truncate">{item.actor.username || "名無し"}</p>
                    
                    {/* 💡 状態によってメッセージを完璧に切り分ける！ */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.type === "pending" && (
                        <p className="text-xs opacity-60 truncate">フォローをリクエストしています</p>
                      )}
                      {item.type === "accepted" && (
                        <p className="text-xs opacity-60 truncate">あなたをフォローしました！</p>
                      )}
                      {item.type === "like" && (
                        <>
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          <p className="text-xs opacity-60 truncate">
                            {item.postContext} にいいねしました
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {/* リクエスト中（pending）の時だけ承認・拒否ボタンを出す */}
                {item.type === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(item.actor.id)}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center transition-transform active:scale-90 shadow-md"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleDecline(item.actor.id)}
                      className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 flex items-center justify-center transition-transform active:scale-90"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}