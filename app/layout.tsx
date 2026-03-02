import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeContext";
// 💡 追加：さっき作った Header を読み込む
import Header from "@/components/Header"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Muscle App",
  description: "筋トレ記録SNS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ThemeProvider>
          {/* 💡 追加：全画面の左上にアイコンを出すために配置 */}
          <Header />
          
          {/* 左上のアイコンと中身が被らないように、少し上に余白（pt-16）を空けておく */}
          <div className="pb-20 pt-16 min-h-screen">
            {children}
          </div>
          
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}