"use client";

import { useRouter } from "next/navigation";
import PostForm from "@/components/PostForm";

export default function PostPage() {
  // 画面を移動するためのNext.jsの便利アイテム
  const router = useRouter();

  // 投稿が成功したときに実行される関数
  const handlePostSuccess = () => {
    // 成功したら、自動的にトップページ（/）に戻す！
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ✍️ 新しく記録する
      </h1>
      
      {/* ここに、今まで作ってきたフォームを呼び出す */}
      <PostForm onPostSuccess={handlePostSuccess} />
    </main>
  );
}