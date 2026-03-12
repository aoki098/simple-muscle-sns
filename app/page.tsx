"use client";

import { useState, useEffect } from "react";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { Plus } from "lucide-react"; 
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"recommended" | "following">("recommended");
  const [showTabs, setShowTabs] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTabs(false);
      } else if (currentScrollY < lastScrollY) {
        setShowTabs(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";
  const isRed = theme === "dark-red"; 
  const btnColor = isRed ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  
  const tabBgClass = theme === "light" ? "bg-white/95" : "bg-black/95";
  const activeTextColor = isRed ? "text-red-500" : "text-blue-500";
  const activeBgClass = theme === "light" ? "bg-white shadow-sm" : "bg-gray-900 shadow-sm";
  const pillContainerBg = theme === "light" ? "bg-gray-100" : "bg-gray-800";

  return (
    // 💡 pt-[48px] を入れて、ヘッダーの下から正確にスタートさせる！
    <main className={`min-h-screen transition-colors duration-300 pt-[px] ${containerClass}`}>
      
      {/* 💡 pt-0 にして、タブの上の無駄な空白を完全に削ぎ落としました！ */}
      <div 
        className={`sticky top-[48px] z-40 px-3 pt-0 pb-1.5 flex justify-start backdrop-blur-md transition-transform duration-300 ease-in-out ${tabBgClass} ${
          showTabs ? "translate-y-0" : "-translate-y-[150%]"
        }`}
      >
        <div className={`inline-flex p-0.5 rounded-full ${pillContainerBg}`}>
          <button 
            onClick={() => setActiveTab("recommended")}
            className={`px-4 py-1 text-[12px] font-bold rounded-full transition-all duration-300 ${
              activeTab === "recommended" ? `${activeBgClass} ${activeTextColor}` : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            おすすめ
          </button>
          <button 
            onClick={() => setActiveTab("following")}
            className={`px-4 py-1 text-[12px] font-bold rounded-full transition-all duration-300 ${
              activeTab === "following" ? `${activeBgClass} ${activeTextColor}` : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            フォロー
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto relative px-2 pt-0 pb-20">
        <PostList refreshKey={refreshKey} feedType={activeTab} />

        <Link
          href={isLoggedIn ? "/post" : "/login"}
          className={`fixed bottom-24 right-4 w-14 h-14 text-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform active:scale-90 z-40 ${btnColor}`}
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}