import type { Metadata, Viewport } from "next"; // 💡 Viewportを追加！
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeContext";
// 💡 追加：さっき作った Header を読み込む
import Header from "@/components/Header"; 

const inter = Inter({ subsets: ["latin"] });

// 💡 追加：スマホアプリ特有の「画面の揺れ・拡大」を防ぐ体幹トレーニング（Viewport設定）
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // スマホで画面をダブルタップした時に勝手に拡大されるのを防ぎます！
};

// 💡 変更：既存のmetadataにPWAの設計図（manifest）を合体！
export const metadata: Metadata = {
  title: "Muscle App",
  description: "筋トレ記録SNS",
  manifest: "/manifest.json", // 👈 ここが超重要！設計図を読み込ませます
  appleWebApp: {
    capable: true, // Safariで「ホーム画面に追加」した時にアプリ化する許可
    statusBarStyle: "black-translucent", // 上の時計や電池マークの背景色をいい感じにする
    title: "Muscle App",
  },
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