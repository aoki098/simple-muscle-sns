"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";

type Exercise = { name: string; weight: number; details: string };

type Post = {
  id: string;
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
          id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, created_at, 
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

  // ❤️ いいねボタンを押したときの処理（エラー防止策を追加！）
  const toggleLike = async (postId: string, isLikedByMe: boolean) => {
    if (!currentUserId) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        // 💡 誰もいいねしていない時（null）の対策として「|| []」を追加
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

  const cardClass = theme === "light" ? "bg-white text-gray-900 border-gray-200" : "bg-black text-gray-100 border border-gray-800";
  const dateColor = theme === "light" ? "text-gray-500" : "text-gray-400";
  const macroClass = theme === "light" ? "bg-gray-100" : "bg-gray-900";

  if (isLoading) return <div className="text-center py-10 opacity-70 font-bold">読み込み中...🦍</div>;
  if (posts.length === 0) return <div className="text-center py-10 opacity-70 font-bold">まだ記録がありません。</div>;

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        // null対策を追加して安全にカウント
        const safeLikes = post.likes || [];
        const isLikedByMe = safeLikes.some(like => like.user_id === currentUserId);
        const likeCount = safeLikes.length;

        return (
          <div key={post.id} className={`p-5 rounded-xl shadow-md transition-colors duration-300 ${cardClass}`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="icon" className="w-full h-full object-cover" /> : "🦍"}
                </div>
                <span className="font-bold text-sm">{post.profiles?.username || "名無しトレーニー"}</span>
              </div>
              <div className={`text-sm font-bold ${dateColor}`}>{post.date}</div>
            </div>

            {post.exercises && post.exercises.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold opacity-70 mb-2 uppercase tracking-wider">Workout</h3>
                <ul className="space-y-2">
                  {post.exercises.map((ex, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
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
                  <div className={`flex justify-between text-xs font-bold p-2 rounded-md mb-2 ${macroClass}`}>
                    <span>🔥 {post.meal_calories}kcal</span>
                    <span className="text-red-400">P: {post.meal_protein}g</span>
                    <span className="text-yellow-400">F: {post.meal_fat}g</span>
                    <span className="text-blue-400">C: {post.meal_carbs}g</span>
                  </div>
                )}
                {post.meal_details && <p className="text-sm whitespace-pre-wrap opacity-90">{post.meal_details}</p>}
              </div>
            )}

            {/* 💡 ここが修正版の「いいねボタン」！ */}
            <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center">
              <button 
                onClick={() => toggleLike(post.id, isLikedByMe)}
                className={`flex items-center space-x-1.5 transition-transform active:scale-90 ${isLikedByMe ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
              >
                <span className="text-xl">{isLikedByMe ? "❤️" : "🤍"}</span>
                {/* 0の時は何も表示せず、1以上の時だけ数字を表示する */}
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