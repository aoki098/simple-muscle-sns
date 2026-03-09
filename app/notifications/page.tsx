"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { Bell, User, Loader2, Check, X, Heart, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  type: "pending" | "accepted" | "like" | "comment";
  actor: { id: string; username: string; avatar_url: string | null } | null;
  postContext?: string;
  postId?: string;
  is_read: boolean;
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

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id, type, is_read, post_id,
          actor:profiles!actor_id(id, username, avatar_url),
          post:posts!notifications_post_id_fkey(exercises, meal_details)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedNotifs = data.map((n: any) => {
          let context = "あなたの投稿";
          if (n.post) {
            if (n.post.exercises && n.post.exercises.length > 0) {
              context = `「${n.post.exercises[0].name}」などの記録`;
            } else if (n.post.meal_details) {
              context = `食事の記録`;
            }
          }

          const actorData = Array.isArray(n.actor) ? n.actor[0] : n.actor;

          return {
            id: n.id,
            type: n.type,
            actor: actorData || { id: "", username: "退会したユーザー", avatar_url: null },
            postContext: context,
            postId: n.post_id,
            is_read: n.is_read
          };
        });
        setNotifications(formattedNotifs);
      }

      setIsLoading(false);

      // 💡 ここが「未読のバッジを消し去る（消化する）」最強エンジンです！！
      // 画面の描画（ローディング終了）を優先しつつ、裏側で「未読（is_read: false）のものだけ」を狙い撃ちで既読に変えます！
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false); // 👈 無駄なアップデートを避ける完璧なフォーム！
    };

    fetchNotifications();
  }, [router]);

  const handleAccept = async (notifId: string, followerId: string) => {
    if (!currentUserId || !followerId) return;
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, type: "accepted" } : n));
    await supabase.from("follows").update({ status: "accepted" }).match({ follower_id: followerId, following_id: currentUserId });
  };

  const handleDecline = async (notifId: string, followerId: string) => {
    if (!currentUserId || !followerId) return;
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    await supabase.from("follows").delete().match({ follower_id: followerId, following_id: currentUserId });
    await supabase.from("notifications").delete().eq("id", notifId);
  };

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-100";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full px-4 pt-0 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <Bell className="w-6 h-6" /> 通知
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="font-bold text-sm">読み込み中...</span></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 opacity-60 font-bold bg-gray-500/5 rounded-xl border border-gray-500/10">まだ通知はありません。</div>
        ) : (
          <div className="space-y-1">
            {notifications.map((item) => (
              // 💡 item.is_read が false だった場合（新着）は、カードの枠が青く光って新着アピールしてくれます！
              <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${cardClass} ${!item.is_read ? 'border-blue-500/50 bg-blue-500/5' : ''}`}>
                
                <Link 
                  href={
                    (item.type === "like" || item.type === "comment") && item.postId 
                      ? `/post/${item.postId}` 
                      : `/profile/${item.actor?.id}`
                  } 
                  className="flex items-center space-x-3 overflow-hidden hover:opacity-70 transition-opacity flex-1"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 shrink-0 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                    {item.actor?.avatar_url ? <img src={item.actor.avatar_url} alt="icon" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="font-bold truncate">{item.actor?.username || "名無し"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.type === "pending" && <p className="text-xs opacity-60 truncate">フォローをリクエストしています</p>}
                      {item.type === "accepted" && <p className="text-xs opacity-60 truncate">あなたをフォローしました！</p>}
                      {item.type === "like" && (
                        <>
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          <p className="text-xs opacity-60 truncate">{item.postContext} にいいねしました</p>
                        </>
                      )}
                      {item.type === "comment" && (
                        <>
                          <MessageCircle className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                          <p className="text-xs opacity-60 truncate">{item.postContext} にコメントしました</p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {item.type === "pending" && item.actor?.id && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleAccept(item.id, item.actor!.id)} className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center shadow-md transition-transform active:scale-90"><Check className="w-6 h-6" /></button>
                    <button onClick={() => handleDecline(item.id, item.actor!.id)} className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 flex items-center justify-center transition-transform active:scale-90"><X className="w-5 h-5" /></button>
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