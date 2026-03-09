"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // 💡 追加！

export default function RecordsPage() {
  const { theme } = useTheme();
  const router = useRouter(); // 💡 追加！
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // 💡 門番の状態管理

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 💡 未ログインなら光の速さでログイン画面へ強制送還！！
      if (!user) {
        router.push("/login");
        return;
      }
      
      // 💡 ログインしていればIDをセットして、門番を開ける！
      setMyUserId(user.id);
      setIsAuthChecking(false);
    };
    fetchUser();
  }, [router]);

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";

  // 💡 確認が終わるまでは、画面を見せずにローディングだけ回す！
  if (isAuthChecking) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-gray-100'}`}>
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <span className="font-bold text-sm opacity-70">ログイン情報を確認中...</span>
      </div>
    );
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass}`}>
      {/* 💡 pt-20 を設定して、固定ヘッダーの下からリストが始まるように調整しました */}
      <div className="w-full px-4 pt-3">
        {myUserId && <PostList refreshKey={0} userId={myUserId} />}
      </div>
    </main>
  );
}