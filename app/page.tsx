"use client";

import { useState } from "react";
import PostForm from "@/components/PostForm"; // パスは環境に合わせてください
import PostList from "@/components/PostList"; // 先ほど作ったコンポーネント

export default function Home() {
  // タイムラインを更新するための「鍵（トリガー）」となるState
  const [refreshKey, setRefreshKey] = useState(0);

  // PostFormで投稿が完了したときに呼ばれる関数
  const handlePostSuccess = () => {
    // 鍵の数字を+1する。すると、PostListが「あっ、鍵が変わったから新しいデータを取りに行かなきゃ！」と反応します
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
        💪 筋トレ＆食事 記録アプリ
      </h1>

      {/* 上半分：投稿フォーム */}
      {/* 投稿が成功したら handlePostSuccess を実行してもらう */}
      <PostForm onPostSuccess={handlePostSuccess} />

      {/* 下半分：みんなのタイムライン */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
          📅 最近の記録
        </h2>
        
        {/* refreshKeyを渡すことで、再読み込みのタイミングを伝える */}
        <PostList refreshKey={refreshKey} />
      </div>
    </main>
  );
}