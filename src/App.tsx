import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import DataSourceWizard from "./pages/DataSourceWizard";
import { Search as SearchIcon, Bell } from "lucide-react";
import "./App.css";

function AppContent() {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useApp();

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--fluent-bg)] text-[var(--fluent-text)]">
      {/* Side nav menu panel */}
      <Sidebar />

      {/* Main client application viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Global Top Header matching the mockup */}
        <header className="flex items-center justify-between px-8 py-3.5 bg-[var(--fluent-bg)] border-b border-[var(--fluent-border)] select-none shrink-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
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
