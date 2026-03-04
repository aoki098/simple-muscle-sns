"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { Utensils, User, Loader2, Heart, MoreHorizontal, Trash2, Lock } from "lucide-react";
import Link from "next/link";

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
  image_url: string | null; // 💡 ① 画像URLを保存する箱を追加！
  created_at: string;
  profiles: { username: string; avatar_url: string | null; is_private: boolean; } | null;
  likes: { user_id: string }[];
};

export default function PostList({ refreshKey, userId }: { refreshKey: number; userId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { theme } = useTheme();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      let currentFollowingIds: string[] = [];

      if (user) {
        setCurrentUserId(user.id);
        
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id, status")
          .eq("follower_id", user.id);
          
        if (followData) {
          const accepted = followData.filter(f => f.status === 'accepted').map(f => f.following_id);
          const pending = followData.filter(f => f.status === 'pending').map(f => f.following_id);
          
          setFollowingIds(accepted);
          setPendingIds(pending);
          currentFollowingIds = accepted; 
        }
      }
      
      // 💡 ② select文に image_url を追加！
      let query = supabase
        .from("posts")
        .select(`
          id, user_id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, image_url, created_at, 
          profiles(username, avatar_url, is_private),
          likes(user_id)
        `)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (user) {
        const targetIds = [user.id, ...currentFollowingIds];
        query = query.in("user_id", targetIds);
      }

      const { data, error } = await query;
      if (!error && data) setPosts(data as any);
      
      setIsLoading(false);
    };
    
    fetchPosts();
  }, [refreshKey, userId]);

  const toggleFollow = async (targetUserId: string, isPrivate: boolean = false) => {
    if (!currentUserId) return;

    const isFollowing = followingIds.includes(targetUserId);
    const isPending = pendingIds.includes(targetUserId);

    if (isFollowing || isPending) {
      setFollowingIds(prev => prev.filter(id => id !== targetUserId));
      setPendingIds(prev => prev.filter(id => id !== targetUserId));
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: targetUserId });
    } else {
      const newStatus = isPrivate ? 'pending' : 'accepted';
      
      if (isPrivate) {
        setPendingIds(prev => [...prev, targetUserId]);
      } else {
        setFollowingIds(prev => [...prev, targetUserId]);
      }
      
      await supabase.from("follows").insert({ 
        follower_id: currentUserId, 
        following_id: targetUserId,
        status: newStatus
      });
    }
  };

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
        const isPrivate = post.profiles?.is_private || false;

        return (
          <div key={post.id} className={`p-5 rounded-xl shadow-md transition-colors duration-300 border ${cardClass}`}>
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-3">
              
              <Link href={`/profile/${post.user_id}`} className="flex items-center space-x-3 hover:opacity-70 transition-opacity">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="icon" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                </div>
                
                <div className="flex items-center">
                  <span className="font-bold text-sm">{post.profiles?.username || "名無し"}</span>
                  {isPrivate && (
                    <Lock className="w-3.5 h-3.5 ml-1.5 text-gray-500" strokeWidth={2.5} />
                  )}
                </div>
              </Link>
              
              <div className="flex items-center gap-3 relative">
                <div className={`text-sm font-bold ${dateColor}`}>{post.date}</div>

                <button 
                  onClick={() => toggleLike(post.id, isLikedByMe)}
                  className={`flex items-center gap-1 transition-transform active:scale-90 ${isLikedByMe ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
                >
                  <Heart className={`w-5 h-5 ${isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />
                  {likeCount > 0 && <span className="font-bold text-sm">{likeCount}</span>}
                </button>

                <button 
                  onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                  className="p-1.5 hover:bg-gray-700/50 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>

                {openMenuId === post.id && (
                  <div className="absolute top-8 right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    
                    {!isMyPost && (
                      followingIds.includes(post.user_id) ? (
                        <button 
                          onClick={() => { toggleFollow(post.user_id, isPrivate); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          ➖ フォローを外す
                        </button>
                      ) : pendingIds.includes(post.user_id) ? (
                        <button 
                          onClick={() => { toggleFollow(post.user_id, isPrivate); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-gray-400 hover:bg-gray-700 transition-colors"
                        >
                          ⏳ リクエスト送信済み
                        </button>
                      ) : (
                        <button 
                          onClick={() => { toggleFollow(post.user_id, isPrivate); setOpenMenuId(null); }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
                        >
                          {isPrivate ? "🔒 鍵垢にリクエスト" : "➕ フォローする"}
                        </button>
                      )
                    )}

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
            
            {/* 💡 ③ ここに追加！画像URLがあれば表示する筋肉！ */}
            {post.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-700/50">
                <img src={post.image_url} alt="Post image" className="w-full h-auto object-cover max-h-96" loading="lazy" />
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}