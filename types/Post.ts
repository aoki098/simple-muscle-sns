// types/Post.ts

// 1つのトレーニング種目のデータ型
export type Exercise = {
  name: string;        // やった種目
  weight: number | ""; // 最大重量
  details: string;     // メモ
};

/**
 * 筋トレ投稿のデータ型を定義します
 */
export type Post = {
  id: number;
  date: string; // 投稿日: "YYYY-MM-DD"

  // トレーニング情報
  exercises: Exercise[]; 

  // 食事情報（カロリーとPFCバランス）
  mealCalories: number | ""; 
  mealProteinGrams: number | ""; 
  mealFatGrams: number | "";     // 👈 新規追加：脂質 (g)
  mealCarbsGrams: number | "";   // 👈 新規追加：炭水化物 (g)
  mealDetails: string; 

  // SNS要素
  userName: string; 
  likes: number; 
};

// 仮のモックデータも複数メニューとPFCに対応させます
export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    date: "2025-10-31",
    exercises: [
      { name: "ベンチプレス", weight: 80, details: "胸トレ（8回 x 3セット）" },
      { name: "インクラインダンベル", weight: 30, details: "10回 x 3セット" }
    ],
    mealCalories: 2500,
    mealProteinGrams: 150,
    mealFatGrams: 60,     // 👈 追加
    mealCarbsGrams: 300,  // 👈 追加
    mealDetails: "朝：プロテイン\n昼：鶏むね肉とブロッコリー\n夜：ステーキ",
    userName: "マッチョ太郎",
    likes: 12,
  },
  {
    id: 2,
    date: "2025-11-01",
    exercises: [
      { name: "デッドリフト", weight: 120, details: "背中（5回 x 3セット）" }
    ],
    mealCalories: 2200,
    mealProteinGrams: 120,
    mealFatGrams: 40,     // 👈 追加
    mealCarbsGrams: 250,  // 👈 追加
    mealDetails: "一日中サラダチキン",
    userName: "リーン志望",
    likes: 8,
  },
];