"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types/Post";
import { useTheme } from "@/components/ThemeContext";

export default function PostList({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const cardClass = theme === "light"
    ? "bg-white border-gray-100 text-gray-900 shadow-sm"
    : theme === "dark-red"
      ? "bg-black border-red-900 text-gray-100 shadow-red-900/30"
      : "bg-black border-blue-900 text-gray-100 shadow-blue-900/30";

  const headingColorClass = theme === "light"
    ? "text-blue-600 border-blue-100"
    : theme === "dark-red"
      ? "text-red-500 border-red-900"
      : "text-blue-400 border-blue-900";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) throw new Error("データの取得に失敗しました");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [refreshKey]);

  if (isLoading) return <p className="text-center mt-8 opacity-60">読み込み中...</p>;
  if (posts.length === 0) return <p className="text-center mt-8 opacity-60">まだ投稿がありません。最初の記録をつけましょう！</p>;

  return (
    <div className="space-y-6 mt-8 max-w-xl mx-auto pb-24">
      {posts.map((post) => (
        <div key={post.id} className={`p-5 rounded-lg border transition-colors duration-300 shadow-md ${cardClass}`}>
          <div className="opacity-70 text-sm mb-3">📅 {post.date}</div>

          <h3 className={`font-bold border-b pb-1 mb-2 transition-colors duration-300 ${headingColorClass}`}>
            🏋️ トレーニング
          </h3>
          <ul className="list-disc list-inside mb-4 space-y-1">
            {post.exercises?.map((ex, i) => (
              <li key={i}>
                <span className="font-semibold">{ex.name}</span>
                {ex.weight > 0 && <span className={`ml-2 px-2 py-0.5 rounded text-sm transition-colors duration-300 ${
                  theme === "light" ? "bg-blue-100 text-blue-800" :
                  theme === "dark-red" ? "bg-red-950 text-red-300" :
                  "bg-blue-950 text-blue-300"
                }`}>{ex.weight} kg</span>}
                {ex.details && <span className="ml-2 text-sm opacity-70">{ex.details}</span>}
              </li>
            ))}
          </ul>

          <h3 className={`font-bold border-b pb-1 mb-2 transition-colors duration-300 ${headingColorClass}`}>
            🥗 食事
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.mealCalories > 0 && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-bold">🔥 {post.mealCalories} kcal</span>}
            {post.mealProteinGrams > 0 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">P: {post.mealProteinGrams}g</span>}
            {post.mealFatGrams > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">F: {post.mealFatGrams}g</span>}
            {post.mealCarbsGrams > 0 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">C: {post.mealCarbsGrams}g</span>}
          </div>
          {post.mealDetails && (
            <p className={`text-sm p-3 rounded mt-2 transition-colors duration-300 ${
              theme === "light" ? "bg-gray-50 text-gray-700" : "bg-gray-900 text-gray-300 border border-gray-800"
            }`}>{post.mealDetails}</p>
          )}
        </div>
      ))}
    </div>
  );
}