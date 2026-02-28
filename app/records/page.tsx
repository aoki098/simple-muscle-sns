"use client";

import { useTheme } from "@/components/ThemeContext";

export default function RecordsPage() {
  const { theme } = useTheme();

  const headingColor = theme === "light" ? "text-gray-800" : "text-white";
  
  // ガワのパネルも真っ黒＆枠線のみに
  const panelClass = theme === "light" 
    ? "bg-white text-gray-500 shadow-md" 
    : "bg-black border border-gray-800 text-gray-400";

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300">
      <h1 className={`text-2xl font-bold text-center mb-6 transition-colors duration-300 ${headingColor}`}>
        📊 自分の記録
      </h1>
      
      <div className={`p-6 rounded-lg text-center transition-colors duration-300 ${panelClass}`}>
        <p className={`text-lg font-semibold mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-200"}`}>
          カレンダー＆グラフ機能
        </p>
        <p>ここに、日々の体重の変化や、過去のトレーニング履歴がカレンダー形式で表示される予定です！</p>
        <p className={`mt-4 text-sm inline-block px-3 py-1 rounded-full ${theme === "light" ? "bg-gray-100" : "bg-gray-900 border border-gray-800"}`}>
          （絶賛開発中...🛠️）
        </p>
      </div>
    </main>
  );
}