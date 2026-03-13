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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchHeaderData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsLoggedIn(true);
        const { data: profileData } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        if (profileData) setAvatarUrl(profileData.avatar_url);

        const { count, error } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
        if (!error && count !== null) setUnreadCount(count);
      } else {
        setIsLoggedIn(false);
      }
    };
    fetchHeaderData();
  }, [pathname]);

  const isTimeline = pathname === "/";
  const isRecords = pathname === "/records";
  const showHeaderBar = isTimeline || isRecords;
  
  const headerBgClass = theme === "light" ? "bg-white/95 border-b border-gray-200" : "bg-black/95 border-b border-gray-800";
  const textColorClass = theme === "light" ? "text-gray-900" : "text-white";
  const iconHoverClass = theme === "light" ? "hover:bg-gray-200" : "hover:bg-gray-800";

  return (
    <header className={`fixed top-0 left-0 w-full z-50 h-[48px] flex items-center justify-between px-4 transition-colors duration-300 ${
      showHeaderBar ? `${headerBgClass} backdrop-blur-md` : "pointer-events-none"
    }`}>
      
      <div className="pointer-events-auto z-10 flex items-center">
        <Link 
          href={isLoggedIn ? "/profile" : "/login"} 
          className="w-8 h-8 rounded-full overflow-hidden border border-gray-600 shadow-sm bg-gray-800 inline-flex items-center justify-center transition-transform active:scale-90 hover:opacity-80"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-400 relative -left-[0.5px]" />
          )}
        </Link>
      </div>

      {showHeaderBar && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 ${textColorClass}`}>
          <span className="font-bold text-sm tracking-widest">
            {isTimeline && "ホーム"}
            {isRecords && "自分の記録"}
          </span>
        </div>
      )}

      <div className="pointer-events-auto z-10 flex items-center gap-1">
        <Link href={isLoggedIn ? "/notifications" : "/login"} className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-transform active:scale-90 relative ${iconHoverClass}`}>
          <Bell className={`w-5 h-5 ${textColorClass}`} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white dark:border-black transform translate-x-1/4 -translate-y-1/4">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <Link href={isLoggedIn ? "/search" : "/login"} className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-transform active:scale-90 ${iconHoverClass}`}>
          <Search className={`w-5 h-5 ${textColorClass}`} />
        </Link>
      </div>
    </header>
  );
}