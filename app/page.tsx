"use client";

import { useState } from "react";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";
import Link from "next/link";
import { Plus } from "lucide-react"; 

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme } = useTheme();

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100";
  const isRed = theme === "dark-red"; 
  const btnColor = isRed ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${containerClass}`}>
      <div className="max-w-xl mx-auto relative px-2 pt-3 pb-20">

        <PostList refreshKey={refreshKey} />

        <Link
          href="/post"
          className={`fixed bottom-24 right-4 w-14 h-14 text-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform active:scale-90 z-40 ${btnColor}`}
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}