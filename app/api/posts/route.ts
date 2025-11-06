// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getPosts, addPost } from "@/lib/data";
import { Post } from "@/types/Post";

/**
 * GETリクエスト: すべての投稿を取得
 */
export async function GET() {
  const posts = getPosts();
  return NextResponse.json(posts);
}

/**
 * POSTリクエスト: 新しい投稿を作成
 */
export async function POST(request: Request) {
  try {
    const data: Omit<Post, "id" | "likes" | "userName"> = await request.json();

    // データのバリデーション（簡単なチェック）
    if (
      !data.date ||
      data.trainingTimeMinutes < 0 ||
      data.mealProteinGrams < 0
    ) {
      return NextResponse.json(
        { error: "無効な入力データです。" },
        { status: 400 }
      );
    }

    const newPost = addPost(data);
    return NextResponse.json(newPost, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "サーバー側でエラーが発生しました。" },
      { status: 500 }
    );
  }
}
