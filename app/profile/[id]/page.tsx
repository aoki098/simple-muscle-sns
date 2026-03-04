"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { ArrowLeft, User, Loader2, Lock } from "lucide-react"; // 💡 Lock（南京錠）追加！
import { useParams, useRouter } from "next/navigation";
import PostList from "@/components/PostList";

// 💡 Profile型に is_private を追加！
type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
};

export default function UserProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { theme } = useTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false); // 💡 リクエスト中（保留）の状態を追加！
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMe, setIsMe] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);

      // 1. ログイン中の自分の情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (user.id === id) setIsMe(true);

        // 相手へのフォロー状態（承認済みか、リクエスト中か）をチェック！
        if (user.id !== id) {
          const { data: followData } = await supabase
            .from("follows")
            .select("status")
            .match({ follower_id: user.id, following_id: id })
            .single();
            
          if (followData) {
            if (followData.status === "accepted") setIsFollowing(true);
            if (followData.status === "pending") setIsPending(true);
          }
        }
      }

      // 2. 相手のプロフィール情報（is_private含む）を取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, is_private")
        .eq("id", id)
        .single();
      if (profileData) setProfile(profileData as Profile);

      // 3. 相手の各種カウントを取得（※承認済みのフォロワーだけ数える）
      const { count: postsCount } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", id);
      const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id).eq("status", "accepted");
      const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id).eq("status", "accepted");

      setStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      });

      setIsLoading(false);
    };

    if (id) fetchUserData();
  }, [id]);

  // 💡 リクエスト制に対応した究極のフォロー機能！
  const handleToggleFollow = async () => {
    if (!currentUserId || !profile) {
      router.push("/login");
      return;
    }

    if (isFollowing || isPending) {
      // フォロー解除 or リクエスト取り消し
      setIsFollowing(false);
      setIsPending(false);
      if (isFollowing) {
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      }
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: id });
    } else {
      // 新規フォロー（相手が鍵垢ならpending、公開ならaccepted）
      const newStatus = profile.is_private ? "pending" : "accepted";
      
      if (profile.is_private) {
        setIsPending(true); // リクエスト済みにする（フォロワー数は増やさない）
      } else {
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 })); // 即フォローなので数字を増やす
      }
      
      await supabase.from("follows").insert({ 
        follower_id: currentUserId, 
        following_id: id,
        status: newStatus
      });
    }
  };

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-100";
  const cardClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-100";

  if (isLoading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${containerClass}`}>
      <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
      <span className="font-bold">ユーザー情報を読み込み中...</span>
    </div>
  );

  if (!profile) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${containerClass}`}>
      <p className="font-bold mb-4">ユーザーが見つかりませんでした。</p>
      <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">戻る</button>
    </div>
  );

  // 💡 投稿を見れるかどうかの判定（自分が本人の場合、相手が公開垢の場合、自分がフォロー済みの場合）
  const canViewPosts = isMe || !profile.is_private || isFollowing;

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass} pb-24`}>
      <div className="w-full px-4 pt-20 max-w-2xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-700/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* 💡 ヘッダーの名前の横にも南京錠！ */}
          <h1 className="text-xl font-bold truncate flex items-center">
            {profile.username}
            {profile.is_private && <Lock className="w-4 h-4 ml-1.5 text-gray-500" strokeWidth={2.5} />}
          </h1>
        </div>

        {/* プロフィールカード */}
        <div className={`p-6 rounded-xl border shadow-md mb-8 ${cardClass}`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border border-gray-500/30 shrink-0 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="icon" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              {/* 💡 ここにも南京錠！ */}
              <h2 className="text-2xl font-bold flex items-center">
                {profile.username || "名無し"}
                {profile.is_private && <Lock className="w-5 h-5 ml-2 text-gray-500" strokeWidth={2.5} />}
              </h2>
              {profile.bio && <p className="text-sm opacity-80 mt-1 whitespace-pre-wrap">{profile.bio}</p>}
            </div>
          </div>

          {/* 統計データ */}
          <div className="flex space-x-6 mb-6">
            <div className="text-center"><span className="block font-bold text-xl">{stats.posts}</span><span className="text-xs opacity-70">投稿</span></div>
            <div className="text-center"><span className="block font-bold text-xl">{stats.followers}</span><span className="text-xs opacity-70">フォロワー</span></div>
            <div className="text-center"><span className="block font-bold text-xl">{stats.following}</span><span className="text-xs opacity-70">フォロー中</span></div>
          </div>

          {/* 💡 ボタンの表示が4パターンに進化！ */}
          {!isMe && (
            <button 
              onClick={handleToggleFollow}
              className={`w-full py-2.5 rounded-lg font-bold transition-transform active:scale-95 border ${
                isFollowing 
                  ? "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700" 
                  : isPending
                  ? "bg-transparent text-gray-500 border-gray-400 dark:text-gray-400 dark:border-gray-600"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
            >
              {isFollowing ? "フォロー中" : isPending ? "⏳ リクエスト済" : profile.is_private ? "🔒 リクエスト" : "➕ フォローする"}
            </button>
          )}
        </div>

        {/* 💡 過去の記録（見れる権限があるかチェック！） */}
        <div className="mb-4">
          {canViewPosts ? (
            <>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">過去の記録</h3>
              <PostList refreshKey={0} userId={id} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-80 bg-gray-500/10 rounded-2xl border border-gray-500/20">
              <Lock className="w-12 h-12 mb-4 text-gray-400" />
              <p className="font-bold text-lg mb-1">このアカウントは非公開です</p>
              <p className="text-sm text-center px-4">写真や過去の記録を見るには<br/>フォローリクエストを送信してください。</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}