"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
// 💡 追加：タイムラインで使うアイコンたちを呼び出す
import { Trash2, Heart, Flame, User, Loader2 } from "lucide-react";

type Exercise = { name: string; weight: number; details: string };

type Post = {
  id: string;
  user_id: string;
  date: string;
  exercises: Exercise[];
  meal_calories: number;
  meal_protein: number;
  meal_fat: number;
  meal_carbs: number;
  meal_details: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null; } | null;
  likes: { user_id: string }[];
};

export default function PostList({ refreshKey, userId }: { refreshKey: number; userId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      
      let query = supabase
        .from("posts")
        .select(`
          id, user_id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, created_at, 
          profiles(username, avatar_url),
          likes(user_id)
        `)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPosts(data as any);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, [refreshKey, userId]);

  const toggleLike = async (postId: string, isLikedByMe: boolean) => {
    if (!currentUserId) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const currentLikes = post.likes || [];
        const newLikes = isLikedByMe
          ? currentLikes.filter(l => l.user_id !== currentUserId)
          : [...currentLikes, { user_id: currentUserId }];
        return { ...post, likes: newLikes };
      }
      return post;
    }));

    if (isLikedByMe) {
      await supabase.from("likes").delete().match({ user_id: currentUserId, post_id: postId });
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
    }
  };

  const handleDelete = async (postId: string) => {
    // 💡 ゴリラを削除し、真面目なメッセージに
    if (!window.confirm("本当にこの記録を削除しますか？")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert(`❌ 削除エラー: ${error.message}`);
    } else {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const cardClass = theme === "light" ? "bg-white text-gray-900 border-gray-200" : "bg-black text-gray-100 border border-gray-800";
  const dateColor = theme === "light" ? "text-gray-500" : "text-gray-400";
  const macroClass = theme === "light" ? "bg-gray-100" : "bg-gray-900";

  // 💡 読み込み中のゴリラを「くるくる回るスピナー（Loader2）」に変更
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-10 opacity-70">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <span className="font-bold text-sm">読み込み中...</span>
    </div>
  );
  if (posts.length === 0) return <div className="text-center py-10 opacity-70 font-bold">まだ記録がありません。</div>;

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const safeLikes = post.likes || [];
        const isLikedByMe = safeLikes.some(like => like.user_id === currentUserId);
        const likeCount = safeLikes.length;
        const isMyPost = currentUserId === post.user_id;

        return (
          <div key={post.id} className={`p-5 rounded-xl shadow-md transition-colors duration-300 ${cardClass}`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                  {/* 💡 アイコン未設定時のゴリラを <User /> アイコンに変更 */}
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="icon" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                </div>
                <span className="font-bold text-sm">{post.profiles?.username || "名無し"}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`text-sm font-bold ${dateColor}`}>{post.date}</div>
                {isMyPost && (
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="この記録を削除"
                  >
                    {/* 💡 🗑️絵文字を <Trash2 /> に変更 */}
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {post.exercises && post.exercises.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold opacity-70 mb-2 uppercase tracking-wider">Workout</h3>
                <ul className="space-y-2">
                  {post.exercises.map((ex, idx) => (
                    <li key={idx} className="flex justify-between text-sm border-l-2 border-blue-500 pl-2">
                      <span className="font-bold">{ex.name}</span>
                      <span className="opacity-80">{ex.weight ? `${ex.weight}kg` : ''} {ex.details}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(post.meal_calories > 0 || post.meal_details) && (
              <div className="mb-4">
                <h3 className="text-xs font-bold opacity-70 mb-2 uppercase tracking-wider">Diet</h3>
                {post.meal_calories > 0 && (
                  <div className={`flex justify-between items-center text-xs font-bold p-2.5 rounded-md mb-2 ${macroClass}`}>
                    {/* 💡 🔥絵文字を <Flame /> に変更 */}
                    <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" />{post.meal_calories}kcal</span>
                    <span className="text-red-400">P: {post.meal_protein}g</span>
                    <span className="text-yellow-400">F: {post.meal_fat}g</span>
                    <span className="text-blue-400">C: {post.meal_carbs}g</span>
                  </div>
                )}
                {post.meal_details && <p className="text-sm whitespace-pre-wrap opacity-90 pl-1">{post.meal_details}</p>}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center">
              <button 
                onClick={() => toggleLike(post.id, isLikedByMe)}
                className={`flex items-center space-x-1.5 transition-transform active:scale-90 ${isLikedByMe ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
              >
                {/* 💡 ❤️🤍絵文字を <Heart /> に変更（isLikedByMeがtrueなら赤く塗りつぶす！） */}
                <Heart className={`w-6 h-6 ${isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />
                {likeCount > 0 && (
                  <span className={`font-bold text-sm ${isLikedByMe ? "text-red-500" : "text-gray-500"}`}>
                    {likeCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}