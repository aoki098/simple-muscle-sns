"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { 
  User, Loader2, Heart, MessageCircle, Send, MoreHorizontal, Trash2, Share2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Exercise = { name: string; weight: number; details: string };

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null; };
};

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
  image_url: string[] | string | null; 
  created_at: string;
  profiles: { username: string; avatar_url: string | null; is_private: boolean; } | null;
  likes: { user_id: string }[];
  comments: Comment[];
};

export default function PostList({ refreshKey, userId, singlePostId }: { refreshKey?: number; userId?: string; singlePostId?: string }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { theme } = useTheme();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 いらなくなったフォロー管理の筋肉（state）をごっそり削除しました！

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let acceptedFollowingIds: string[] = [];

      if (user) {
        setCurrentUserId(user.id);
        const { data: followData } = await supabase.from("follows").select("following_id, status").eq("follower_id", user.id);
        if (followData) {
          // 💡 タイムラインに表示するため、「フォロー承認済み」のIDだけを取得！
          acceptedFollowingIds = followData.filter(f => f.status === 'accepted').map(f => f.following_id);
        }
      }
      
      let query = supabase
        .from("posts")
        .select(`
          id, user_id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, image_url, created_at, 
          profiles(username, avatar_url, is_private),
          likes(user_id),
          comments(
            id, content, created_at, user_id, 
            profiles:user_id(username, avatar_url)
          )
        `)
        .order("created_at", { ascending: false });

      if (singlePostId) {
        query = query.eq("id", singlePostId);
      } else if (userId) {
        query = query.eq("user_id", userId);
      } else if (user) {
        query = query.in("user_id", [user.id, ...acceptedFollowingIds]);
      }

      const { data, error } = await query;
      if (data) {
        setPosts(data.map((p: any) => ({
          ...p,
          exercises: p.exercises || [],
          likes: p.likes || [],
          comments: p.comments || []
        })) as any);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, [refreshKey, userId, singlePostId]);

  const sendNotification = async (receiverId: string, type: string, postId?: string) => {
    if (!currentUserId || receiverId === currentUserId) return;
    await supabase.from("notifications").insert({ user_id: receiverId, actor_id: currentUserId, type, post_id: postId });
  };

  const toggleLike = async (postId: string, isLikedByMe: boolean, ownerId: string) => {
    if (!currentUserId) {
      alert("いいねするにはログインしてください");
      router.push("/login");
      return;
    }
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const newLikes = isLikedByMe ? p.likes.filter(l => l.user_id !== currentUserId) : [...p.likes, { user_id: currentUserId }];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
    if (isLikedByMe) await supabase.from("likes").delete().match({ user_id: currentUserId, post_id: postId });
    else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
      await sendNotification(ownerId, 'like', postId);
    }
  };

  const handleAddComment = async (postId: string, ownerId: string) => {
    if (!currentUserId) {
      alert("コメントするにはログインしてください");
      router.push("/login");
      return;
    }
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id: postId, user_id: currentUserId, content: commentText.trim() }])
      .select(`id, content, created_at, user_id, profiles:user_id(username, avatar_url)`)
      .single();
    if (!error && data) {
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, data as any] } : p));
      setCommentText("");
      await sendNotification(ownerId, 'comment', postId);
    }
    setIsSubmitting(false);
  };

  // 💡 toggleFollow 関数も丸ごと削除して超スッキリ！！

  const handleDelete = async (postId: string) => {
    if (!window.confirm("本当にこの記録を削除しますか？")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter(p => p.id !== postId));
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("✅ リンクをコピーしました！友達にシェアしよう！");
    } catch (err) {
      alert("❌ コピーに失敗しました");
    }
  };

  const cardClass = theme === "light" ? "bg-white text-gray-900 border-gray-200" : "bg-black text-gray-100 border-gray-800";
  const macroClass = theme === "light" ? "bg-gray-100 text-gray-800" : "bg-gray-900 text-gray-300";

  if (isLoading) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8" /></div>;
  if (posts.length === 0) return <div className="text-center py-10 opacity-70 font-bold">まだ記録がありません。</div>;

  return (
    <div className="space-y-0.5">
      {posts.map((post) => {
        const isLikedByMe = post.likes.some(l => l.user_id === currentUserId);
        const isMyPost = currentUserId === post.user_id;
        
        const rawImageUrls = Array.isArray(post.image_url) 
          ? post.image_url 
          : (typeof post.image_url === 'string' ? [post.image_url] : []);
        
        const imageUrls = rawImageUrls.filter(url => url && typeof url === 'string' && url.trim() !== "");

        return (
          <div 
            key={post.id} 
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button, a')) return;
              router.push(`/post/${post.id}`);
            }}
            className={`p-5 rounded-xl border shadow-md cursor-pointer transition-colors hover:bg-gray-800/30 ${cardClass}`}
          >
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-1 border-b border-gray-700/50 pb-2">
              <Link href={`/profile/${post.user_id}`} className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-500/30 bg-gray-800">
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-gray-400" />}
                </div>
                <span className="font-bold text-sm">{post.profiles?.username || "名無し"}</span>
              </Link>
              
              <div className="flex items-center gap-4 text-gray-500 relative">
                <span className="text-xs font-bold opacity-50">{post.date}</span>
                
                <button onClick={() => toggleLike(post.id, isLikedByMe, post.user_id)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <Heart className={`w-5 h-5 ${isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />
                  {post.likes.length > 0 && <span className={`text-xs font-bold ${isLikedByMe ? "text-red-500" : ""}`}>{post.likes.length}</span>}
                </button>
                
                <button onClick={() => setOpenCommentId(openCommentId === post.id ? null : post.id)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  {post.comments.length > 0 && <span className="text-xs font-bold text-blue-400">{post.comments.length}</span>}
                </button>

                <button onClick={(e) => {
                  e.stopPropagation();
                  handleShare(post.id);
                }}>
                  <Share2 className="w-5 h-5 hover:text-green-500 transition-colors" />
                </button>

                {/* 💡 自分の投稿の時だけ「･･･」を表示するように制限！ */}
                {isMyPost && (
                  <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} className="p-1 hover:bg-gray-700/30 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                )}

                {/* 💡 メニューの中身も「削除」だけになり、超スッキリ！ */}
                {isMyPost && openMenuId === post.id && (
                  <div className="absolute top-8 right-0 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button 
                      onClick={() => { handleDelete(post.id); setOpenMenuId(null); }} 
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 削除する
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* コンテンツエリア */}
            <div className="space-y-2">
              {post.exercises.length > 0 && (
                <div className="space-y-0">
                  <h3 className="text-[12px] font-bold opacity-50 uppercase tracking-tighter">筋トレ</h3>
                  {post.exercises.map((ex, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{ex.name}</span>
                        <div className="text-xs">
                          <span className="opacity-50 mr-1 text-[10px]">最大重量:</span>
                          <span className="font-black text-blue-400 text-sm">{ex.weight ? `${ex.weight}kg` : '-'}</span>
                        </div>
                      </div>
                      {ex.details && <p className="text-xs opacity-70 mt-1 text-gray-400">📝 {ex.details}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* 食事 */}
              {(post.meal_calories > 0 || post.meal_details) && (
                <div className="space-y-0">
                  <h3 className="text-[12px] font-bold opacity-50 uppercase tracking-tighter">食事</h3>
                  {post.meal_calories > 0 && (
                    <div className={`flex flex-wrap justify-between items-center w-full text-[11px] sm:text-xs font-bold p-3 rounded-lg gap-y-1 ${macroClass}`}>
                      <span>🍴 {post.meal_calories}kcal</span>
                      <span className="text-blue-600 dark:text-blue-400">P: {post.meal_protein}g</span>
                      <span className="text-orange-500 dark:text-orange-400">F: {post.meal_fat}g</span>
                      <span className="text-green-600 dark:text-green-400">C: {post.meal_carbs}g</span>
                    </div>
                  )}
                  {post.meal_details && (
                    <div className="pt-0">
                      <p className="text-sm opacity-90 whitespace-pre-wrap pl-3 border-l-2 border-green-500/50 leading-relaxed bg-gray-800/10 py-1.5 rounded-r">
                        {post.meal_details}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 画像グリッド */}
              {imageUrls.length > 0 && (
                <div className={`mt-2 rounded-xl overflow-hidden border ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-black/20'} ${imageUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
                  {imageUrls.map((url, idx) => {
                    if (imageUrls.length === 1) {
                      return <img key={idx} src={url} className="w-full h-auto object-contain max-h-[500px] mx-auto" alt="Post" />;
                    }
                    if (imageUrls.length === 3 && idx === 0) {
                      return <img key={idx} src={url} className="w-full h-full object-cover col-span-2 aspect-[2/1]" alt="Post" />;
                    }
                    return <img key={idx} src={url} className="w-full h-full object-cover aspect-square" alt="Post" />;
                  })}
                </div>
              )}
            </div>

            {/* コメントセクション */}
            {openCommentId === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex flex-col gap-1 p-2 bg-gray-800/40 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Link href={`/profile/${comment.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                          <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden shrink-0">
                            {comment.profiles?.avatar_url ? (
                              <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 m-1 text-gray-400" />
                            )}
                          </div>
                          <span className="font-bold text-xs text-blue-400">{comment.profiles?.username || "名無し"}</span>
                        </Link>
                        
                        <button 
                          onClick={() => setCommentText(`@${comment.profiles?.username} `)}
                          className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
                        >
                          返信
                        </button>
                      </div>
                      <p className="text-xs opacity-90 pl-7 leading-tight whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                  {post.comments.length === 0 && <p className="text-xs text-center opacity-40 py-2 italic">コメント</p>}
                </div>

                <div className="flex gap-2 items-end">
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="コメントを入力してください"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none h-10"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(post.id, post.user_id);
                      }
                    }}
                  />
                  <button 
                    disabled={isSubmitting || !commentText.trim()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddComment(post.id, post.user_id);
                    }} 
                    className="text-white bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 h-10"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}