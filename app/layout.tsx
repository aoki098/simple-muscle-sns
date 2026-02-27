import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "筋トレ＆食事記録",
  description: "日々のトレーニングとPFCを記録するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider>
          {/* メニューバーがコンテンツに被らないように下に余白(pb-16)を設けます */}
          <div className="pb-16">
            {children}
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}