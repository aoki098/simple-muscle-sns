import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 👇 さっき作ったメニューバーをインポート
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "筋トレ記録アプリ",
  description: "日々のトレーニングとPFCを記録しよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* 👇 pb-20 (padding-bottom) を追加するのが超重要！
        これがないと、画面の一番下のコンテンツがメニューバーに隠れてしまいます。
      */}
      <body className={`${inter.className} bg-gray-50 pb-20`}>
        
        {/* ここに各ページの中身（ホームや投稿画面など）が入る */}
        {children}

        {/* 👇 画面の一番下にメニューバーを配置！ */}
        <BottomNav />
        
      </body>
    </html>
  );
}