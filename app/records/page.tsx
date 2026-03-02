"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
// 💡 追加：記録ページで使うアイコンたちを呼び出す
import { BarChart3, Loader2 } from "lucide-react";

export default function RecordsPage() {
  const { theme } = useTheme();
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
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
      {/* 💡 変更：見出しの絵文字を消して <BarChart3 /> に！ */}
      <h1 className={`text-2xl font-bold flex items-center justify-center gap-2 mb-6 transition-colors duration-300 ${headingColor}`}>
        <BarChart3 className="w-7 h-7 text-blue-500" />
        自分の記録
      </h1>

      {myUserId ? (
        <PostList refreshKey={0} userId={myUserId} />
      ) : (
        /* 💡 変更：読み込み中のゴリラを「くるくるスピナー（Loader2）」に！ */
        <div className="flex flex-col items-center justify-center py-10 opacity-70">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="font-bold text-sm">ユーザー情報を確認中...</span>
        </div>
      )}
    </main>
  );
}