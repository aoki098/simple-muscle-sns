"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User } from "lucide-react"; 
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

  // 💡 記録ページ（/records）の判定を追加！
  const isTimeline = pathname === "/";
  const isRecords = pathname === "/records";
  
  // タイムラインか記録ページなら、ヘッダーのバーを表示する
  const showHeaderBar = isTimeline || isRecords;
  
  const headerBgClass = theme === "light" ? "bg-white/95 border-gray-200" : "bg-black/95 border-gray-800";
  const textColorClass = theme === "light" ? "text-gray-900" : "text-white";

  return (
    <header className={`fixed top-0 left-0 w-full z-50 h-[72px] transition-colors duration-300 ${
      showHeaderBar ? `border-b ${headerBgClass} backdrop-blur-md` : "pointer-events-none"
    }`}>
      {/* アイコン位置は固定 */}
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

      {/* 💡 ページに合わせて真ん中の文字を切り替える！ */}
      {showHeaderBar && (
        <div className={`w-full h-full flex items-center justify-center pointer-events-none ${textColorClass}`}>
          <span className="font-bold text-sm tracking-widest">
            {isTimeline && "フォロー"}
            {isRecords && "自分の記録"}
          </span>
        </div>
      )}
    </header>
  );
}