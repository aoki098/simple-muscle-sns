// 理解しないといけない
"use client"; // 状態管理とAPI呼び出しのため 'use client' が必要

import { useState, useEffect } from "react";
import PostForm from "@/components/PostForm";
import { Post } from "@/types/Post"; // MOCK_POSTSのインポートは不要

// ... (PostItemコンポーネントは変更なし) ...
const PostItem = ({ post }: { post: Post }) => (
  // ... (中略) ...
  <div className="p-4 border rounded-lg bg-gray-50 shadow-sm mb-4">
    {/* ... (PostItemのJSXは変更なし) ... */}
  </div>
);

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 投稿データをAPIから取得する関数
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts", { cache: "no-store" }); // 新鮮なデータを取得
      if (!response.ok) throw new Error("投稿データの取得に失敗しました");
      const data: Post[] = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Fetch Error:", error);
      setPosts([]); // エラー時は空リスト
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントがマウントされたとき、および投稿成功時にデータを取得
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-5 space-y-8">
      <h1 className="text-3xl font-extrabold text-center text-gray-900">
        シンプル 筋トレ SNS アプリ
      </h1>

      {/* 投稿フォームエリア: 成功時にfetchPostsを呼び出す */}
      <section>
        <PostForm onPostSuccess={fetchPosts} />
      </section>

      {/* 投稿リストエリア */}
      <section>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">みんなの投稿</h2>

        {loading && (
          <p className="text-center text-lg">データを読み込み中...</p>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-lg text-gray-500">
            まだ投稿がありません。
          </p>
        )}

        <div className="space-y-4">
          {!loading &&
            posts.map((post) => <PostItem key={post.id} post={post} />)}
        </div>
      </section>
    </div>
  );
}
