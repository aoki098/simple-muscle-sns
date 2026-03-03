"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { Utensils, User, Loader2, Heart, MoreHorizontal, Trash2 } from "lucide-react";

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
  
  // 💡 どの投稿の三点メニューが開いているかを管理するState
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // 💡 追加：自分がフォローしている人（following_id）のリストを取得！
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        if (followData) {
          setFollowingIds(followData.map(f => f.following_id));
        }
      }
      
      let query = supabase
        .from("posts")
        .select(`
          id, user_id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, created_at, 
          profiles(username, avatar_url),
          likes(user_id)
        `)
        .order("created_at", { ascending: false });

      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (!error && data) setPosts(data as any);
      
      setIsLoading(false);
    };
    fetchPosts();
  }, [refreshKey, userId]);

  // 💡 追加：フォロー / フォロー解除 を実行する筋肉関数！
  const toggleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    const isFollowing = followingIds.includes(targetUserId);

    if (isFollowing) {
      // フォロー解除（画面を先に更新して、裏でSQLを削除）
      setFollowingIds(followingIds.filter(id => id !== targetUserId));
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: targetUserId });
    } else {
      // フォローする（画面を先に更新して、裏でSQLを追加）
      setFollowingIds([...followingIds, targetUserId]);
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetUserId });
    }
  };

  // ... (toggleLike と handleDelete はそのまま)

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
    if (!window.confirm("本当にこの記録を削除しますか？")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert(`❌ 削除エラー: ${error.message}`);
    } else {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const cardClass = theme === "light" ? "bg-white text-gray-900 border-gray-200" : "bg-black text-gray-100 border-gray-800";
  const dateColor = theme === "light" ? "text-gray-500" : "text-gray-400";
  const macroClass = theme === "light" ? "bg-gray-100" : "bg-gray-900";

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
          // 💡 修正： `< key=` を `<div key=` に直しました！
          <div key={post.id} className={`p-5 rounded-xl shadow-md transition-colors duration-300 border ${cardClass}`}>
            
            {/* 💡 カード上部：アイコン・名前と、右側のボタン群 */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-3">
              
              {/* 左側：アイコンと名前 */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="icon" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                </div>
                <span className="font-bold text-sm">{post.profiles?.username || "名無し"}</span>
              </div>
              
              {/* 右側：日付・ハート・三点リーダー */}
              <div className="flex items-center gap-3 relative">
                <div className={`text-sm font-bold ${dateColor}`}>{post.date}</div>

                {/* ハートボタン */}
                <button 
                  onClick={() => toggleLike(post.id, isLikedByMe)}
                  className={`flex items-center gap-1 transition-transform active:scale-90 ${isLikedByMe ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
                >
                  <Heart className={`w-5 h-5 ${isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />
                  {likeCount > 0 && <span className="font-bold text-sm">{likeCount}</span>}
                </button>

                {/* 三点リーダー（メニュー開閉） */}
                <button 
                  onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                  className="p-1.5 hover:bg-gray-700/50 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>

                {/* ドロップダウンメニュー */}
                {openMenuId === post.id && (
                  <div className="absolute top-8 right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    
                    {/* 💡 他人の投稿の場合のみ、フォロー/解除ボタンを表示！ */}
                    {!isMyPost && (
                      followingIds.includes(post.user_id) ? (
                        <button 
                          onClick={() => { toggleFollow(post.user_id); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          ➖ フォローを外す
                        </button>
                      ) : (
                        <button 
                          onClick={() => { toggleFollow(post.user_id); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
                        >
                          ➕ フォローする
                        </button>
                      )
                    )}

                    {/* 自分の投稿の時だけ「削除」を表示 */}
                    {isMyPost && (
                      <button 
                        onClick={() => { handleDelete(post.id); setOpenMenuId(null); }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-gray-700 border-t border-gray-700/50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> 投稿を削除する
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Workout */}
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

            {/* Diet */}
            {(post.meal_calories > 0 || post.meal_details) && (
              <div className="mb-4">
                <h3 className="text-xs font-bold opacity-70 mb-2 uppercase tracking-wider">Diet</h3>
                {post.meal_calories > 0 && (
                  <div className={`flex flex-wrap gap-2 justify-between items-center text-xs font-bold p-2.5 rounded-md mb-2 ${macroClass}`}>
                    
                    {/* 💡 ここを変更！ <Flame> を <Utensils> にする */}
                    <span className="flex items-center gap-1">
                      <Utensils className="w-4 h-4 text-gray-500" />{post.meal_calories}kcal
                    </span>
                    
                    <span className="text-red-400">P(タンパク質): {post.meal_protein}g</span>
                    <span className="text-yellow-400">F(脂質): {post.meal_fat}g</span>
                    <span className="text-blue-400">C(炭水化物): {post.meal_carbs}g</span>
                  </div>
                )}
                {post.meal_details && <p className="text-sm whitespace-pre-wrap opacity-90 pl-1">{post.meal_details}</p>}
              </div>
            )}
            
          {/* 💡 修正： `</` を `</div>` に直しました！ */}
          </div>
        );
      })}
    </div>
  );
}