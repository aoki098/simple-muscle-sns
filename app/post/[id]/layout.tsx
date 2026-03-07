import { Metadata } from "next";
import { supabase } from "@/lib/supabase";

// 💡 サーバー側でOGP（シェアカード）の情報を自動生成する強力な筋肉！
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const postId = params.id;

  // Supabaseから、この投稿の「画像」「ユーザー名」「メモ」だけを引っ張ってくる！
  const { data: post } = await supabase
    .from("posts")
    .select(`
      meal_details, 
      image_url, 
      profiles(username)
    `)
    .eq("id", postId)
    .single();

  if (!post) {
    return { title: "投稿が見つかりません" };
  }

  // 🃏 カードに表示するタイトルと説明文を作る！
  const username = post.profiles?.username || "名無し";
  const title = `${username}さんの筋トレ＆食事記録💪`;
  const description = post.meal_details 
    ? post.meal_details.substring(0, 50) + "..." // メモがあれば最初の50文字を表示
    : "今日のトレーニングと食事の記録をチェック！";
  
  // 📸 投稿に写真があれば、それをカードのデカい画像としてセットする！
  const images = post.image_url ? [post.image_url] : [];

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image", // 💡 これがX(Twitter)で「デカい画像カード」を出すための魔法の呪文！！
      title: title,
      description: description,
      images: images,
    },
  };
}

// 💡 画面自体の表示は今まで通り page.tsx に任せるので、そのまま通すだけ！
export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}