"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
import { Loader2 } from "lucide-react";

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

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass}`}>
      {/* 💡 pt-20 を設定して、固定ヘッダーの下からリストが始まるように調整しました */}
      <div className="w-full px-4 pt-20">

        {/* 💡 ここにあった大きな <h1>自分の記録</h1> は削除しました！ */}

        {myUserId ? (
          <PostList refreshKey={0} userId={myUserId} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="font-bold text-sm">ユーザー情報を確認中...</span>
          </div>
        )}
      </div>
    </main>
  );
}