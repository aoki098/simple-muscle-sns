"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { User, Loader2, Heart, MessageCircle, Send, MoreHorizontal, Trash2, Share2, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Exercise = { name: string; weight: number; details: string };
type Comment = { id: string; user_id: string; content: string; created_at: string; profiles: { username: string; avatar_url: string | null; }; };
type Post = { id: string; user_id: string; date: string; exercises: Exercise[]; meal_calories: number; meal_protein: number; meal_fat: number; meal_carbs: number; meal_details: string; image_url: string[] | string | null; created_at: string; profiles: { username: string; avatar_url: string | null; is_private: boolean; } | null; likes: { user_id: string }[]; comments: Comment[]; };

export default function PostList({ refreshKey, userId, singlePostId, feedType = "following" }: { refreshKey?: number; userId?: string; singlePostId?: string; feedType?: "recommended" | "following" }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { theme } = useTheme();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setFetchError(null);
      const { data: { user } } = await supabase.auth.getUser();
      let acceptedFollowingIds: string[] = [];

      if (user) {
        setCurrentUserId(user.id);
        const { data: followData } = await supabase.from("follows").select("following_id, status").eq("follower_id", user.id);
        if (followData) {
          acceptedFollowingIds = followData.filter(f => f.status === 'accepted').map(f => f.following_id);
        }
      }
      
      let query = supabase
        .from("posts")
        .select(`
          id, user_id, date, exercises, meal_calories, meal_protein, meal_fat, meal_carbs, meal_details, image_url, created_at, 
          profiles(username, avatar_url, is_private),
          likes(user_id),
          comments(id, content, created_at, user_id, profiles:user_id(username, avatar_url))
        `)
        .order("created_at", { ascending: false });

      if (singlePostId) {
        query = query.eq("id", singlePostId);
      } else if (userId) {
        query = query.eq("user_id", userId);
      } else if (feedType === "following") {
        if (!user) {
          setPosts([]);
          setIsLoading(false);
          return;
        }
        query = query.in("user_id", [user.id, ...acceptedFollowingIds]);
      } else if (feedType === "recommended") {
        query = query.limit(100);
      }

      const { data, error } = await query;
      
      if (error) {
        setFetchError(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        let fetchedPosts = data;

        if (feedType === "recommended") {
          fetchedPosts = fetchedPosts.filter((p: any) => {
            // 💡 自分の投稿なら、自分が鍵垢でも「おすすめタブ」に表示する！！
            if (user && p.user_id === user.id) return true;

            // 💡 他人の投稿の場合は、鍵垢を除外する！
            const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            return profile?.is_private !== true;
          });

          if (fetchedPosts.length > 0) {
            const shuffled = [...fetchedPosts].sort(() => 0.5 - Math.random()).slice(0, 30);
            fetchedPosts = shuffled.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }
        }

        setPosts(fetchedPosts.map((p: any) => ({
          ...p,
          exercises: p.exercises || [],
          likes: p.likes || [],
          comments: p.comments || []
        })) as any);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, [refreshKey, userId, singlePostId, feedType]);

  const sendNotification = async (receiverId: string, type: string, postId?: string) => {
    if (!currentUserId || receiverId === currentUserId) return;
    await supabase.from("notifications").insert({ user_id: receiverId, actor_id: currentUserId, type, post_id: postId });
  };

  const toggleLike = async (postId: string, isLikedByMe: boolean, ownerId: string) => {
    if (!currentUserId) { alert("いいねするにはログインしてください"); router.push("/login"); return; }
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: isLikedByMe ? p.likes.filter(l => l.user_id !== currentUserId) : [...p.likes, { user_id: currentUserId }] } : p));
    if (isLikedByMe) await supabase.from("likes").delete().match({ user_id: currentUserId, post_id: postId });
    else { await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId }); await sendNotification(ownerId, 'like', postId); }
  };

  const handleAddComment = async (postId: string, ownerId: string) => {
    if (!currentUserId) { alert("コメントするにはログインしてください"); router.push("/login"); return; }
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    const { data, error } = await supabase.from("comments").insert([{ post_id: postId, user_id: currentUserId, content: commentText.trim() }]).select(`id, content, created_at, user_id, profiles:user_id(username, avatar_url)`).single();
    if (!error && data) {
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, data as any] } : p));
      setCommentText("");
      await sendNotification(ownerId, 'comment', postId);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("本当にこの記録を削除しますか？")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) setPosts(posts.filter(p => p.id !== postId));
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    try { await navigator.clipboard.writeText(url); alert("✅ リンクをコピーしました！友達にシェアしよう！"); } catch (err) { alert("❌ コピーに失敗しました"); }
  };

  const cardClass = theme === "light" ? "bg-white text-gray-900 border-gray-200" : "bg-black text-gray-100 border-gray-800";
  const macroClass = theme === "light" ? "bg-gray-100 text-gray-800" : "bg-gray-900 text-gray-300";

  if (isLoading) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8" /></div>;
  
  if (fetchError) {
    return (
      <div className="p-6 m-4 mt-10 bg-red-900/20 border border-red-500/50 rounded-xl text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-500 font-bold mb-2">データの読み込みに失敗しました</h3>
        <p className="text-xs opacity-70 mb-4 whitespace-pre-wrap">{fetchError}</p>
      </div>
    );
  }

  if (feedType === "following" && !currentUserId && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-blue-500" /></div>
        <h2 className="text-xl font-bold mb-2">ログインしてつながろう</h2>
        <p className="text-sm opacity-70 mb-8 leading-relaxed">ログインすると、お気に入りのトレーニーをフォローして<br/>このタブで記録をチェックできるようになります。</p>
        <button onClick={() => router.push('/login')} className="bg-blue-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-transform active:scale-95 w-full max-w-[240px]">ログイン / 新規登録</button>
      </div>
    );
  }

  if (posts.length === 0) return <div className="text-center py-10 opacity-70 font-bold">まだ記録がありません。</div>;

  return (
    <div className="space-y-0.5">
      {posts.map((post) => {
        const isLikedByMe = post.likes.some(l => l.user_id === currentUserId);
        const isMyPost = currentUserId === post.user_id;
        const rawImageUrls = Array.isArray(post.image_url) ? post.image_url : (typeof post.image_url === 'string' ? [post.image_url] : []);
        const imageUrls = rawImageUrls.filter(url => url && typeof url === 'string' && url.trim() !== "");

        return (
          <div key={post.id} onClick={(e) => { if ((e.target as HTMLElement).closest('button, a')) return; router.push(`/post/${post.id}`); }} className={`p-5 rounded-xl border shadow-md cursor-pointer transition-colors hover:bg-gray-800/30 ${cardClass}`}>
            <div className="flex justify-between items-center mb-1 border-b border-gray-700/50 pb-2">
              <Link href={`/profile/${post.user_id}`} className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-500/30 bg-gray-800">
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-gray-400" />}
                </div>
                <span className="font-bold text-sm">{post.profiles?.username || "名無し"}</span>
              </Link>
              
              <div className="flex items-center gap-4 text-gray-500 relative">
                <span className="text-xs font-bold opacity-50">{post.date}</span>
                <button onClick={() => toggleLike(post.id, isLikedByMe, post.user_id)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"><Heart className={`w-5 h-5 ${isLikedByMe ? "fill-red-500 text-red-500" : ""}`} />{post.likes.length > 0 && <span className={`text-xs font-bold ${isLikedByMe ? "text-red-500" : ""}`}>{post.likes.length}</span>}</button>
                <button onClick={() => setOpenCommentId(openCommentId === post.id ? null : post.id)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"><MessageCircle className="w-5 h-5" />{post.comments.length > 0 && <span className="text-xs font-bold text-blue-400">{post.comments.length}</span>}</button>
                <button onClick={(e) => { e.stopPropagation(); handleShare(post.id); }}><Share2 className="w-5 h-5 hover:text-green-500 transition-colors" /></button>
                {isMyPost && <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} className="p-1 hover:bg-gray-700/30 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>}
                {isMyPost && openMenuId === post.id && (
                  <div className="absolute top-8 right-0 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button onClick={() => { handleDelete(post.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-gray-700 flex items-center gap-2"><Trash2 className="w-4 h-4" /> 削除する</button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {post.exercises.length > 0 && (
                <div className="space-y-0"><h3 className="text-[12px] font-bold opacity-50 uppercase tracking-tighter">筋トレ</h3>
                  {post.exercises.map((ex, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex justify-between items-center"><span className="font-bold text-sm">{ex.name}</span><div className="text-xs"><span className="opacity-50 mr-1 text-[10px]">最大重量:</span><span className="font-black text-blue-400 text-sm">{ex.weight ? `${ex.weight}kg` : '-'}</span></div></div>
                      {ex.details && <p className="text-xs opacity-70 mt-1 text-gray-400">📝 {ex.details}</p>}
                    </div>
                  ))}
                </div>
              )}

              {(post.meal_calories > 0 || post.meal_details) && (
                <div className="space-y-0"><h3 className="text-[12px] font-bold opacity-50 uppercase tracking-tighter">食事</h3>
                  {post.meal_calories > 0 && (
                    <div className={`flex flex-wrap justify-between items-center w-full text-[11px] sm:text-xs font-bold p-3 rounded-lg gap-y-1 ${macroClass}`}>
                      <span>🍴 {post.meal_calories}kcal</span><span className="text-blue-600 dark:text-blue-400">P: {post.meal_protein}g</span><span className="text-orange-500 dark:text-orange-400">F: {post.meal_fat}g</span><span className="text-green-600 dark:text-green-400">C: {post.meal_carbs}g</span>
                    </div>
                  )}
                  {post.meal_details && <div className="pt-0"><p className="text-sm opacity-90 whitespace-pre-wrap pl-3 border-l-2 border-green-500/50 leading-relaxed bg-gray-800/10 py-1.5 rounded-r">{post.meal_details}</p></div>}
                </div>
              )}

              {imageUrls.length > 0 && (
                <div className={`mt-2 rounded-xl overflow-hidden border ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-800 bg-black/20'} ${imageUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
                  {imageUrls.map((url, idx) => {
                    if (imageUrls.length === 1) return <img key={idx} src={url} className="w-full h-auto object-contain max-h-[500px] mx-auto" alt="Post" />;
                    if (imageUrls.length === 3 && idx === 0) return <img key={idx} src={url} className="w-full h-full object-cover col-span-2 aspect-[2/1]" alt="Post" />;
                    return <img key={idx} src={url} className="w-full h-full object-cover aspect-square" alt="Post" />;
                  })}
                </div>
              )}
            </div>

            {openCommentId === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex flex-col gap-1 p-2 bg-gray-800/40 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Link href={`/profile/${comment.user_id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                          <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden shrink-0">{comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1 text-gray-400" />}</div>
                          <span className="font-bold text-xs text-blue-400">{comment.profiles?.username || "名無し"}</span>
                        </Link>
                        <button onClick={() => setCommentText(`@${comment.profiles?.username} `)} className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors">返信</button>
                      </div>
                      <p className="text-xs opacity-90 pl-7 leading-tight whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                  {post.comments.length === 0 && <p className="text-xs text-center opacity-40 py-2 italic">コメント</p>}
                </div>
                <div className="flex gap-2 items-end">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="コメントを入力してください" className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none h-10" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id, post.user_id); } }} />
                  <button disabled={isSubmitting || !commentText.trim()} onClick={(e) => { e.stopPropagation(); handleAddComment(post.id, post.user_id); }} className="text-white bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 h-10">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}