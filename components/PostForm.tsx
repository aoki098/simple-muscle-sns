// components/PostForm.tsx (修正後)
"use client";

import { useState } from "react";
import { Post } from "@/types/Post";
// import { MOCK_POSTS } from '@/types/Post'; // MOCK_POSTSはもう不要

// 投稿後のリフレッシュを扱うためのPropsを追加
type PostFormProps = {
  onPostSuccess: () => void;
};

// ... (initialPostとhandleChange関数は変更なし) ...
const initialPost: Omit<Post, "id" | "userName" | "likes"> = {
  date: new Date().toISOString().substring(0, 10), // 投稿日

  // トレーニング情報
  trainingTimeMinutes: 0, // トレーニング時間
  trainingDetails: "", // トレーニング内容

  // 食事情報
  mealProteinGrams: 0, // タンパク質
  mealCalories: 0, // カロリー
  mealDetails: "", // 食事内容
  // --- ここまで完全な定義 ---
};

// ... (以下、変更なし) ...

// コンポーネントの定義を修正
export default function PostForm({ onPostSuccess }: PostFormProps) {
  // ... (useStateの定義は変更なし) ...
  const [formData, setFormData] = useState(initialPost);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // ... (handleChange関数は変更なし) ...
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // **【ここが変更点】APIを呼び出し、データをPOST**
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("サーバーエラー: 投稿に失敗しました");
      }

      // 成功
      setMessage("💪 投稿が完了しました！");
      setFormData(initialPost); // フォームをリセット
      onPostSuccess(); // 成功コールバックを実行し、親コンポーネントに通知
    } catch (error) {
      setMessage(`❌ エラー: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (JSXのreturn部分は変更なし) ...
  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border rounded-lg shadow-md bg-white"
    >
      {/* ... (フォームの中身は変更なし) ... */}
      <h2 className="text-2xl font-bold mb-4">
        🏋️‍♀️ 今日のトレーニングと食事を投稿
      </h2>
      <h3 className="text-xl font-semibold mt-6 mb-2 text-blue-600">
        💪 トレーニング
      </h3>
      {/* 👈 この内側に、時間(分)と内容詳細の入力欄のJSXがあるはず */}
      <h3 className="text-xl font-semibold mt-6 mb-2 text-green-600">
        🥗 食事
      </h3>
      {/* 👈 この内側に、タンパク質(g)とカロリー(kcal)と内容詳細の入力欄のJSXがあるはず */}
      

      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-6 w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {isSubmitting ? "投稿中..." : "ポストする"}
      </button>

      {message && (
        <p className="mt-3 text-center text-green-700 font-medium">{message}</p>
      )}
    </form>
  );
}
