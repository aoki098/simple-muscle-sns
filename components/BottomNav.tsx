"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  // 今どのURL（ページ）にいるかを取得する、Next.jsの便利機能
  const pathname = usePathname();

  // メニューのボタン一覧
  const navItems = [
    { name: "ホーム", path: "/", icon: "🏠" },
    { name: "投稿", path: "/post", icon: "✍️" },
    { name: "記録", path: "/records", icon: "📊" },
    { name: "設定", path: "/settings", icon: "⚙️" },
  ];

  return (
    // fixed bottom-0 で画面の一番下に固定！
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between py-2">
          {navItems.map((item) => {
            // 今いるページとボタンの飛び先が同じなら、色を青くして「ここにいるよ」と伝える
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full py-1 space-y-1 transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
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