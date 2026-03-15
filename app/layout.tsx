import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeContext";
import Header from "@/components/Header"; 

const inter = Inter({ subsets: ["latin"] });

// モバイルでの意図しない拡大表示を防ぐViewport設定
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Muscle App",
  description: "筋トレ記録SNS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
          <Header />
          
          <div className="pb-20 pt-16 min-h-screen">
            {children}
          </div>
          
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}