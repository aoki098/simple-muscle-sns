"use client";

import PostList from "@/components/PostList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
        🏠 タイムライン
      </h1>

      {/* フォームは消して、一覧だけにする */}
      <div>
        {/* 画面を切り替えるたびに新しく読み込まれるので、refreshKeyは一旦0でOKです */}
        <PostList refreshKey={0} />
      </div>
    </main>
  );
}