// types/Post.ts

import { readFileSync } from "fs";

/**
 * 筋トレ投稿のデータ型を定義します
 */
export type Post = {
  id: number;
  date: string; // 投稿日: "YYYY-MM-DD"

  // トレーニング情報
  trainingTimeMinutes: number; // トレーニング時間 (分)
  
  trainingDetails: string; // トレーニング内容の自由記述

  // 食事情報
  mealProteinGrams: number; // タンパク質 (g)
  mealCalories: number; // カロリー (kcal)
  mealDetails: string; // 食事内容の自由記述

  // SNS要素
  userName: string; // 投稿者名
  likes: number; // いいね数 (初期値0)
};

// 仮のモックデータ（投稿を一覧表示するために使用）
export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    date: "2025-10-31",
    trainingTimeMinutes: 75,
    trainingDetails: "胸トレ（ベンチプレス 80kg x 8 x 3）、三頭筋",
    mealProteinGrams: 150,
    mealCalories: 2500,
    mealDetails: "朝：プロテイン, 昼：鶏むね肉とブロッコリー, 夜：ステーキ",
    userName: "マッチョ太郎",
    likes: 12,
  },
  {
    id: 2,
    date: "2025-11-01",
    trainingTimeMinutes: 60,
    trainingDetails: "背中（デッドリフト 120kg x 5 x 3）、二頭筋",
    mealProteinGrams: 120,
    mealCalories: 2200,
    mealDetails: "一日中サラダチキン",
    userName: "リーン志望",
    likes: 8,
  },
];
