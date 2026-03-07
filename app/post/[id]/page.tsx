"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PostList from "@/components/PostList";
import { useTheme } from "@/components/ThemeContext";

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  // URLから投稿のIDを抽出（筋肉の抽出！）
  const postId = params.id as string;

  const containerClass = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-black text-gray-100";

  return (
    <main className={`min-h-screen pt-0 pb-24 transition-colors duration-300 ${containerClass}`}>
      <div className="max-w-xl mx-auto px-4 relative">
        
        {/* ヘッダー（戻るボタン付き） */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="mr-4 p-2 hover:bg-gray-700/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">投稿の詳細</h1>
        </div>

        {/* 💡 ここが最強のコンボ！先ほど改造したPostListに postId を渡すだけ！ */}
        <PostList singlePostId={postId} />
        
      </div>
    </main>
  );
}