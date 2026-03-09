"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User, Search, Bell } from "lucide-react"; 
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function Header() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 💡 ログイン状態を記憶する門番の筋肉！
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchHeaderData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 💡 ユーザーがいれば、門番のガードを解く！
        setIsLoggedIn(true);

        // 1. プロフィール画像の取得
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setAvatarUrl(profileData.avatar_url);
        }

        // 2. 未読通知の取得
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } else {
        // 💡 ユーザーがいなければ、ガードを固める！
        setIsLoggedIn(false);
      }
    };
    
    fetchHeaderData();
  }, [pathname]);

  const isTimeline = pathname === "/";
  const isRecords = pathname === "/records";
  
  const showHeaderBar = isTimeline || isRecords;
  
  const headerBgClass = theme === "light" ? "bg-white/95 border-gray-200" : "bg-black/95 border-gray-800";
  const textColorClass = theme === "light" ? "text-gray-900" : "text-white";
  const iconHoverClass = theme === "light" ? "hover:bg-gray-200" : "hover:bg-gray-800";

  return (
    <header className={`fixed top-0 left-0 w-full z-50 h-[72px] transition-colors duration-300 ${
      showHeaderBar ? `border-b ${headerBgClass} backdrop-blur-md` : "pointer-events-none"
    }`}>
      
      {/* 💡 左側：自分のプロフィールアイコン */}
      <div className="absolute top-4 left-4 pointer-events-auto z-10">
        {/* 💡 行き先ガード：未ログインなら /login へ飛ばす！ */}
        <Link 
          href={isLoggedIn ? "/profile" : "/login"} 
          className="w-10 h-10 rounded-full overflow-hidden border border-gray-600 shadow-sm bg-gray-800 flex items-center justify-center transition-transform active:scale-90 hover:opacity-80 inline-block"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-gray-400" />
          )}
        </Link>
      </div>

      {/* 💡 中央：ページタイトル */}
      {showHeaderBar && (
        <div className={`w-full h-full flex items-center justify-center pointer-events-none ${textColorClass}`}>
          <span className="font-bold text-sm tracking-widest">
            {isTimeline && "フォロー"}
            {isRecords && "自分の記録"}
          </span>
        </div>
      )}

      {/* 💡 右側：通知ボタン ＆ 検索ボタン */}
      {isTimeline && (
        <div className="absolute top-4 right-4 pointer-events-auto z-10 flex items-center gap-1">
          {/* 🔔 通知（ベル）ボタン */}
          {/* 💡 行き先ガード搭載！ */}
          <Link 
            href={isLoggedIn ? "/notifications" : "/login"} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 relative ${iconHoverClass}`}
          >
            <Bell className={`w-6 h-6 ${textColorClass}`} />
            
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white dark:border-black transform translate-x-1/4 -translate-y-1/4">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          
          {/* 🔍 検索ボタン */}
          {/* 💡 行き先ガード搭載！ */}
          <Link 
            href={isLoggedIn ? "/search" : "/login"} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${iconHoverClass}`}
          >
            <Search className={`w-6 h-6 ${textColorClass}`} />
          </Link>
        </div>
      )}

    </header>
  );
}