import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Compass, Grid, Gamepad2, Terminal, Download, Settings, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { activeTab, setActiveTab, gitInstalled, checkGit } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const resourceItems = [
    { id: "home", label: "发现", icon: Compass },
    { id: "games", label: "游戏", icon: Gamepad2 },
    { id: "devtools", label: "开发者工具", icon: Terminal },
  ];

  const settingItems = [
    { id: "apps", label: "数据源管理", icon: Grid },
    { id: "library", label: "下载与更新", icon: Download, hasDot: true },
    { id: "settings", label: "我的设置", icon: Settings },
  ];

  const renderItemButton = (item: any) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "w-full flex items-center rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer relative",
          isCollapsed ? "justify-center py-3 px-0" : "px-3.5 py-2.5 justify-between",
          isActive
            ? "bg-[rgba(128,128,128,0.15)] text-white shadow-sm"
            : "text-[var(--fluent-text)] opacity-70 hover:opacity-100 hover:bg-[rgba(128,128,128,0.08)]"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {/* Left Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded bg-[var(--fluent-accent)]" />
        )}
        
        <div className="flex items-center gap-3">
          <Icon className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && <span>{item.label}</span>}
        </div>

        {!isCollapsed && item.hasDot && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--fluent-accent)] mr-1" />
        )}

        {isCollapsed && item.hasDot && (
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--fluent-accent)] animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <aside 
      className={cn(
        "border-r border-[var(--fluent-border)] bg-[var(--fluent-bg)] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Upper Area */}
      <div className="flex flex-col pt-4">
        {/* Toggle Hamburger & Header Brand */}
        <div className={cn("mb-5 flex items-center gap-2.5", isCollapsed ? "justify-center flex-col px-0" : "px-4.5")}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-[rgba(128,128,128,0.12)] cursor-pointer text-[var(--fluent-text)] transition duration-150 focus:outline-none shrink-0"
            title={isCollapsed ? "展开菜单" : "收起菜单"}
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-md font-bold text-base select-none shrink-0">
                A
              </div>
              <h1 className="font-extrabold text-sm tracking-tight truncate">桌面应用商店</h1>
            </div>
          )}
        </div>

        {/* Navigation Menu with Categorized sections */}
        <nav className="px-2 space-y-4">
          {/* Section 1: 资源分类 */}
          <div>
            {!isCollapsed && (
              <div className="px-3.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--fluent-secondary)] text-left select-none opacity-60">
                资源分类
              </div>
            )}
            <div className="space-y-1">
              {resourceItems.map(renderItemButton)}
            </div>
          </div>

          {/* Collapsed Divider vs Expanded Thin Line */}
          {isCollapsed ? (
            <hr className="border-[var(--fluent-border)] my-1.5 mx-2" />
          ) : (
            <div className="h-[1px] bg-[var(--fluent-border)] my-1 mx-3.5 opacity-60" />
          )}

          {/* Section 2: 软件设置 */}
          <div>
            {!isCollapsed && (
              <div className="px-3.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--fluent-secondary)] text-left select-none opacity-60">
                软件设置
              </div>
            )}
            <div className="space-y-1">
              {settingItems.map(renderItemButton)}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="flex flex-col">
        {/* Git environment status - Hidden when collapsed */}
        {!isCollapsed && (
          <div
            onClick={() => checkGit()}
            className="mx-3 mb-3 p-3 rounded-lg border border-[var(--fluent-border)] bg-[rgba(128,128,128,0.02)] flex flex-col gap-1.5 cursor-pointer hover:bg-[rgba(128,128,128,0.05)] transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-black tracking-wider text-[var(--fluent-secondary)]">
                Git CLI 环境检测
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  gitInstalled ? "bg-green-500 shadow shadow-green-500/30" : "bg-yellow-500 shadow shadow-yellow-500/30"
                )}
              />
              <span className="text-[10px] font-bold">
                {gitInstalled ? "Git CLI 正常工作" : "Git 未就绪 (ZIP 兼容)"}
              </span>
            </div>
          </div>
        )}

        {/* Profile Footer Card */}
        <div 
          className={cn(
            "border-t border-[var(--fluent-border)] p-4 flex items-center shrink-0", 
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://avatars.githubusercontent.com/u/108600007?v=4"
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover border border-zinc-700/50 bg-zinc-800 shrink-0"
              title={isCollapsed ? "张三的商店" : undefined}
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold truncate w-28 text-left">张三的商店</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] truncate w-28 text-left">张三的商店</p>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronRight className="w-4 h-4 text-[var(--fluent-secondary)] cursor-pointer hover:text-white transition" />}
        </div>
      </div>
    </aside>
  );
}
