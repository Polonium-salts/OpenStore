import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import DataSourceWizard from "./pages/DataSourceWizard";
import { Search as SearchIcon, Bell, Menu, Wifi } from "lucide-react";
import "./App.css";

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    theme,
    bgType,
    bgPreset,
    bgUrl,
    bgUpload,
    bgOpacity,
    bgBlur,
    setMobileSidebarOpen,
    preferredPlatform,
    githubLatency,
    giteeLatency,
    detectPreferredPlatform,
    isDetectingNetwork
  } = useApp();

  const [systemIsDark, setSystemIsDark] = React.useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isDark = theme === "dark" || (theme === "auto" && systemIsDark);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "bg-active");
    
    if (theme === "light") {
      root.classList.add("theme-light");
    } else if (theme === "dark") {
      root.classList.add("theme-dark");
    }
    
    if (bgType !== "none") {
      root.classList.add("bg-active");
    }
  }, [theme, bgType]);

  const getPresetBackgroundStyle = (preset: string, dark: boolean) => {
    const baseColor = dark ? "#101012" : "#f3f3f3";
    switch (preset) {
      case "aurora":
        return dark
          ? `radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.25) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.3) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(219, 39, 119, 0.2) 0px, transparent 50%), ${baseColor}`
          : `radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.2) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(219, 39, 119, 0.1) 0px, transparent 50%), ${baseColor}`;
      case "neon":
        return dark
          ? `radial-gradient(at 20% 20%, rgba(236, 72, 153, 0.2) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(147, 51, 234, 0.2) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%), ${baseColor}`
          : `radial-gradient(at 20% 20%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(147, 51, 234, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%), ${baseColor}`;
      case "sakura":
        return dark
          ? `radial-gradient(at 0% 0%, rgba(251, 113, 133, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.1) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(253, 244, 245, 0.08) 0px, transparent 50%), ${baseColor}`
          : `radial-gradient(at 0% 0%, rgba(254, 205, 211, 0.45) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(253, 164, 175, 0.45) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(255, 241, 242, 0.35) 0px, transparent 50%), ${baseColor}`;
      case "ocean":
        return dark
          ? `radial-gradient(at 30% 20%, rgba(14, 165, 233, 0.2) 0px, transparent 50%), radial-gradient(at 70% 80%, rgba(3, 105, 161, 0.2) 0px, transparent 50%), radial-gradient(at 10% 90%, rgba(7, 89, 133, 0.15) 0px, transparent 50%), ${baseColor}`
          : `radial-gradient(at 30% 20%, rgba(14, 165, 233, 0.15) 0px, transparent 50%), radial-gradient(at 70% 80%, rgba(3, 105, 161, 0.15) 0px, transparent 50%), radial-gradient(at 10% 90%, rgba(7, 89, 133, 0.12) 0px, transparent 50%), ${baseColor}`;
      default:
        return baseColor;
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case "home":
      case "games":
      case "devtools":
        return <Home />;
      case "apps":
        return <DataSourceWizard />;
      case "search":
        return <Search />;
      case "detail":
        return <Detail />;
      case "library":
        return <Library />;
      case "settings":
        return <Settings />;
      default:
        return <Home />;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      setActiveTab("search");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--fluent-bg)] text-[var(--fluent-text)] relative">
      {/* Background image/gradient layer */}
      {bgType !== "none" && (
        <div 
          className="absolute inset-0 -z-50 pointer-events-none transition-all duration-300"
          style={{
            background: bgType === "preset" 
              ? getPresetBackgroundStyle(bgPreset, isDark)
              : `url(${bgType === "url" ? bgUrl : bgUpload})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: `blur(${bgBlur}px)`,
            opacity: bgOpacity,
            transform: bgBlur > 0 ? "scale(1.08)" : "none",
            width: "100%",
            height: "100%",
          }}
        />
      )}
      {/* Base Theme Cover Overlay */}
      {bgType !== "none" && (
        <div 
          className="absolute inset-0 -z-40 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: isDark ? "rgba(20, 20, 20, 0.55)" : "rgba(243, 243, 243, 0.55)",
            backdropFilter: "blur(12px)",
            width: "100%",
            height: "100%",
          }}
        />
      )}
      {/* Side nav menu panel */}
      <Sidebar />

      {/* Main client application viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Global Top Header matching the mockup */}
        <header className="flex items-center justify-between px-4 md:px-8 py-3.5 bg-[var(--fluent-bg)] border-b border-[var(--fluent-border)] select-none shrink-0 z-10">
          <div className="flex-1 max-w-xl flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-[rgba(128,128,128,0.12)] text-[var(--fluent-text)] cursor-pointer transition shrink-0"
              title="打开菜单"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--fluent-secondary)]" />
              <input
                type="text"
                placeholder="搜索应用、游戏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--fluent-accent)] focus:border-[var(--fluent-accent)] transition-all font-semibold"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4.5">
            {/* Network Auto-Sensing Router Status Indicator */}
            <div 
              onClick={detectPreferredPlatform}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--fluent-border)] bg-[var(--fluent-card)] text-[10px] font-bold cursor-pointer hover:bg-[rgba(128,128,128,0.06)] active:scale-97 select-none transition-all"
              title="网络自适应选择器 (点击重新诊断测速)"
            >
              <Wifi className={`w-3.5 h-3.5 ${isDetectingNetwork ? "text-yellow-500 animate-pulse" : "text-green-500"}`} />
              <span>
                {isDetectingNetwork ? (
                  "正在探测网络..."
                ) : (
                  <>
                    自适应: <span className="text-[var(--fluent-accent)] uppercase">{preferredPlatform}</span>
                    {preferredPlatform === "gitee" && giteeLatency !== null && ` (${giteeLatency}ms)`}
                    {preferredPlatform === "github" && githubLatency !== null && ` (${githubLatency}ms)`}
                  </>
                )}
              </span>
            </div>

            {/* Bell Notifications */}
            <button className="p-1.5 rounded-full hover:bg-[rgba(128,128,128,0.1)] text-[var(--fluent-text)] opacity-80 hover:opacity-100 cursor-pointer transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-[var(--fluent-accent)] rounded-full" />
            </button>
            
            {/* Profile Avatar */}
            <div className="w-7 h-7 rounded-full border border-zinc-700/50 bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-white transition overflow-hidden">
              <img
                src="https://avatars.githubusercontent.com/u/108600007?v=4"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Scrollable page client viewport */}
        <div className="flex-1 overflow-hidden relative">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
