import { Sidebar } from "@/components/layout/Sidebar";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
      <main className="flex-1 lg:ml-[220px] transition-all duration-300 min-h-screen">
        <div className="p-6 pt-16 lg:pt-6 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
