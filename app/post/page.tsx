"use client";

import { useRouter } from "next/navigation";
import PostForm from "@/components/PostForm";
import { useTheme } from "@/components/ThemeContext";

export default function PostPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const handlePostSuccess = () => {
    router.push("/");
  };

  const headingColor = theme === "light" ? "text-gray-800" : "text-white";

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300">
      <h1 className={`text-2xl font-bold text-center mb-6 transition-colors duration-300 ${headingColor}`}>
        ✍️ 新しく記録する
      </h1>
      
      <PostForm onPostSuccess={handlePostSuccess} />
    </main>
  );
}