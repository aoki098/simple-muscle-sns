import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import BottomNav from "@/components/BottomNav";

// 👇 さっき作った魔法の箱をインポート
import { ThemeProvider } from "@/components/ThemeContext";

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
      {/* transition-colors を入れると、色がフワッと切り替わってカッコいいです */}
      <body className={`${inter.className} pb-20 transition-colors duration-300`}>
        
        {/* 👇 アプリ全体を ThemeProvider で包み込む！ */}
        <ThemeProvider>
          {children}
          <BottomNav />
        </ThemeProvider>
        
      </body>
    </html>
  );
}