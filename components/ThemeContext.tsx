"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark-red" | "dark-blue";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("app-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("app-theme", theme);
      if (theme === "light") {
        document.body.className = "bg-gray-50 text-gray-900";
      } else if (theme === "dark-red") {
        document.body.className = "bg-black text-gray-100"; // 漆黒！
      } else if (theme === "dark-blue") {
        document.body.className = "bg-black text-gray-100"; // 漆黒！
      }
    }
  }, [theme, mounted]);

  if (!mounted) return <div className="invisible">{children}</div>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);