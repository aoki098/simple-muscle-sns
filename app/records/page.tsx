"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RecordsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  
  // 認証状態の確認フラグ
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 未ログイン時はログインページへ
      if (!user) {
        router.push("/login");
        return;
      }
      
      setMyUserId(user.id);
      setIsAuthChecking(false);
    };
    fetchUser();
  }, [router]);

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";

  // 認証確認中はローディングUIを表示
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
      <div className="w-full px-4 pt-3">
        {myUserId && <PostList refreshKey={0} userId={myUserId} />}
      </div>
    </main>
  );
}