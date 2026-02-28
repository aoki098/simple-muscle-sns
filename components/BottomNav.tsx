"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  // 下のメニューバーも真っ黒に！
  const navBgClass = theme === "light" ? "bg-white border-gray-200" : "bg-black border-gray-800 text-gray-400";
  
  const activeColor = 
    theme === "dark-red" ? "text-red-500" : 
    theme === "dark-blue" ? "text-blue-500" : 
    "text-blue-600";

  const navItems = [
    { name: "ホーム", path: "/", icon: "🏠" },
    { name: "投稿", path: "/post", icon: "✍️" },
    { name: "記録", path: "/records", icon: "📊" },
    { name: "設定", path: "/settings", icon: "⚙️" },
  ];

  return (
    <nav className={`fixed bottom-0 w-full border-t z-50 pb-safe transition-colors duration-300 ${navBgClass}`}>
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full py-1 space-y-1 transition-colors ${
                  isActive ? activeColor : "hover:text-gray-600"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}