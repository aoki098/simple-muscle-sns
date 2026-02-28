"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";

export default function RecordsPage() {
  const { theme } = useTheme();
  // 自分のIDを保存する箱
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    // 画面を開いた時に、自分が誰なのか（ID）を確認する
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const headingColor = theme === "light" ? "text-gray-800" : "text-white";

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24">
      <h1 className={`text-2xl font-bold text-center mb-6 transition-colors duration-300 ${headingColor}`}>
        📊 自分の記録
      </h1>

      {/* 自分のIDが分かったら、PostListにIDを渡して表示させる！ */}
      {myUserId ? (
        <PostList refreshKey={0} userId={myUserId} />
      ) : (
        <div className="text-center py-10 opacity-70 font-bold">ユーザー情報を確認中...🦍</div>
      )}
    </main>
  );
}