"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User, Search, Bell } from "lucide-react"; // 💡 Bell（ベルマーク）を追加！
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function Header() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
        }
      }
    };
    fetchProfile();
  }, []);

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
        <Link 
          href="/profile" 
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

      {/* 💡 右側：通知ボタン ＆ 検索ボタン が綺麗に並ぶ！ */}
      {isTimeline && (
        <div className="absolute top-4 right-4 pointer-events-auto z-10 flex items-center gap-1">
          {/* 🔔 通知（ベル）ボタン */}
          <Link 
            href="/notifications" 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${iconHoverClass}`}
          >
            <Bell className={`w-6 h-6 ${textColorClass}`} />
          </Link>
          
          {/* 🔍 検索ボタン */}
          <Link 
            href="/search" 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${iconHoverClass}`}
          >
            <Search className={`w-6 h-6 ${textColorClass}`} />
          </Link>
        </div>
      )}

    </header>
  );
}