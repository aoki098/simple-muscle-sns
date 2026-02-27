"use client";

import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";

export default function Home() {
  const { theme } = useTheme();

  // 見出しの文字色をテーマに合わせて切り替える
  const headingColor = theme === "light" ? "text-gray-800" : "text-white";

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24">
      <h1 className={`text-3xl font-extrabold text-center mb-6 transition-colors duration-300 ${headingColor}`}>
        🏠 タイムライン
      </h1>

      <div>
        <PostList refreshKey={0} />
      </div>
    </main>
  );
}