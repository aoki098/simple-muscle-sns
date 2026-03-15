import { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

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

  const profilesData: any = post.profiles;
  const username = Array.isArray(profilesData) 
    ? profilesData[0]?.username 
    : profilesData?.username || "名無し";

  const title = `${username}さんの筋トレ＆食事記録`;
  const description = post.meal_details 
    ? post.meal_details.substring(0, 50) + "..." 
    : "今日のトレーニングと食事の記録をチェック！";
  
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
      card: "summary_large_image",
      title: title,
      description: description,
      images: images,
    },
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}