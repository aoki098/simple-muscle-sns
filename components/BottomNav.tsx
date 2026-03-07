"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";
// 💡 変更：Bell(通知) と Search(検索) を追加インポート！
import { Home, Edit, BarChart2, Settings, Bell, Search } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const navBgClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-400";
  
  const activeColor = 
    theme === "dark-red" ? "text-red-500" : 
    theme === "dark-blue" ? "text-blue-500" : 
    "text-blue-600";

  // 💡 変更：検索と通知のボタンを配列に追加！！（王道の並び順にしました）
  const navItems = [
    { name: "ホーム", path: "/", icon: Home },
    { name: "検索", path: "/search", icon: Search }, // 🔍 検索追加！
    { name: "投稿", path: "/post", icon: Edit },
    { name: "通知", path: "/notifications", icon: Bell }, // 🔔 通知追加！
    { name: "記録", path: "/records", icon: BarChart2 },
    { name: "設定", path: "/settings", icon: Settings },
  ];

  return (
    <nav className={`fixed bottom-0 w-full border-t z-50 pb-safe transition-colors duration-300 ${navBgClass}`}>
      {/* 💡 アイコンが6個に増えたので、横の余白を px-4 から px-2 に減らして広げました！ */}
      <div className="max-w-md mx-auto px-2">
        <div className="flex justify-between py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full py-1 space-y-1 transition-colors ${
                  isActive ? activeColor : "hover:text-gray-600"
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {/* 💡 文字がぶつからないように、text-[10px] から text-[9px] に極限まで絞りました！ */}
                <span className="text-[9px] font-bold whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}