"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types/Post";

// 親から「更新して！」という合図（refreshKey）を受け取る
export default function PostList({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // refreshKey（数字）が変わるたびに、この中の処理が自動で走る
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) throw new Error("データの取得に失敗しました");
        
        const data = await response.json();
        setPosts(data); // 取ってきたデータをStateに保存
      } catch (error) {
        console.error("エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [refreshKey]); // 👈 ここがポイント！

  if (isLoading) return <p className="text-center mt-8 text-gray-500">読み込み中...</p>;
  if (posts.length === 0) return <p className="text-center mt-8 text-gray-500">まだ投稿がありません。最初の記録をつけましょう！</p>;

  return (
    <div className="space-y-6 mt-8 max-w-xl mx-auto">
      {posts.map((post) => (
        <div key={post.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
          <div className="text-gray-500 text-sm mb-3">📅 {post.date}</div>

          {/* 🏋️ トレーニング表示部分 */}
          <h3 className="font-bold text-blue-600 border-b-2 border-blue-100 pb-1 mb-2">
            🏋️ トレーニング
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {post.exercises?.map((ex, i) => (
              <li key={i} className="text-gray-800">
                <span className="font-semibold">{ex.name}</span>
                {ex.weight > 0 && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">{ex.weight} kg</span>}
                {ex.details && <span className="ml-2 text-sm text-gray-500">{ex.details}</span>}
              </li>
            ))}
          </ul>

          {/* 🥗 食事表示部分 */}
          <h3 className="font-bold text-green-600 border-b-2 border-green-100 pb-1 mb-2">
            🥗 食事
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-bold">🔥 {post.mealCalories} kcal</span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">P: {post.mealProteinGrams}g</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">F: {post.mealFatGrams}g</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">C: {post.mealCarbsGrams}g</span>
          </div>
          {post.mealDetails && (
            <p className="text-sm bg-gray-50 p-3 rounded text-gray-700 mt-2">{post.mealDetails}</p>
          )}
        </div>
      ))}
    </div>
  );
}