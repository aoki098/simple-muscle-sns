"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // 👤 ユーザーのプロフィール情報を保存する箱
  const [profile, setProfile] = useState<{username: string, avatarUrl: string | null} | null>(null);

  // 門番（ガード）＆プロフィール取得の処理
  useEffect(() => {
    const checkLoginAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // ログインしていなかったら弾き返す
        router.push("/login");
      } else {
        // ログインしていたら、Supabaseのprofilesテーブルから名前とアイコンを取得！
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setProfile({
            username: data.username,
            avatarUrl: data.avatar_url
          });
        }
        setIsLoading(false);
      }
    };
    checkLoginAndFetchProfile();
  }, [router]);

  const headingColor = theme === "light" ? "text-gray-800" : "text-white";

  if (isLoading) {
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24 relative">
      
      {/* ✨ 追加：画面左上のプロフィール表示エリア */}
      <div className="absolute top-6 left-4 flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-md ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="icon" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">🦍</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] opacity-70 ${headingColor}`}>ようこそ</span>
          <span className={`text-sm font-bold ${headingColor}`}>
            {profile?.username || "名無しトレーニー"}
          </span>
        </div>
      </div>

      {/* タイトルがアイコンと被らないように mt-8 (マージントップ) を追加しています */}
      <h1 className={`text-3xl font-extrabold text-center mt-8 mb-6 transition-colors duration-300 ${headingColor}`}>
        🏠 タイムライン
      </h1>

      <div>
        <PostList refreshKey={0} />
      </div>
    </main>
  );
}