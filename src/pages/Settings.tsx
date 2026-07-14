import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Globe, Moon, Wifi, User, Shield, Bell, ChevronRight, Folder, Key, Terminal, Info, CheckCircle2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom small Windows-style toggle switch matching the mockup
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-11 shrink-0 cursor-pointer items-center rounded-full border border-zinc-700/50 transition-colors duration-200 outline-none select-none",
        checked ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)]" : "bg-zinc-800",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "text-[7px] font-black text-white absolute select-none transition-all",
        checked ? "left-1.5" : "right-1.5"
      )}>
        {checked ? "ON" : "OFF"}
      </span>
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-6.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export default function Settings() {
  const {
    downloadDir,
    setDownloadDir,
    githubToken,
    setGithubToken,
    gitInstalled,
    checkGit,
    clearHistory
  } = useApp();

  // Inputs state
  const [dirInput, setDirInput] = useState(downloadDir);
  const [tokenInput, setTokenInput] = useState(githubToken);
  
  // Custom mock configuration states from layout screenshot
  const [language, setLanguage] = useState("zh");
  const [theme, setTheme] = useState("auto");
  const [wifiOnly, setWifiOnly] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [updateNotif, setUpdateNotif] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  // Sync downloadDir when loaded
  useEffect(() => {
    setDirInput(downloadDir);
  }, [downloadDir]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadDir(dirInput.trim());
    setGithubToken(tokenInput.trim());
    
    // Save other config states to localStorage
    localStorage.setItem("git_store_language", language);
    localStorage.setItem("git_store_theme", theme);
    localStorage.setItem("git_store_wifi_only", String(wifiOnly));
    localStorage.setItem("git_store_push_enabled", String(pushEnabled));
    localStorage.setItem("git_store_update_notif", String(updateNotif));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetApp = () => {
    if (
      confirm("警告：确定要重置所有设置并清除下载记录吗？\n注意：这不会物理删除您本地已下载的文件夹，但会清除应用内的库列表！")
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRecheckGit = async () => {
    setRechecking(true);
    await checkGit();
    setTimeout(() => setRechecking(false), 800);
  };

  return (
    <div className="flex-1 overflow-y-auto h-full px-8 py-8 flex flex-col select-none">
      {/* Title Header */}
      <div className="mb-6 shrink-0 text-left">
        <h2 className="text-2xl font-extrabold tracking-tight">设置</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full pb-16">
        
        {/* SECTION 1: 通用设置 (General Settings) */}
        <div className="space-y-3.5 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
            通用设置
          </h3>
          
          <div className="space-y-3">
            {/* Language */}
            <div className="flex items-center justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[var(--fluent-secondary)]" />
                <span className="text-xs font-semibold">语言</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-800 border border-[var(--fluent-border)] rounded-lg px-4 py-1 text-xs text-white outline-none cursor-pointer hover:border-zinc-500 transition-all font-semibold"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-[var(--fluent-secondary)]" />
                <span className="text-xs font-semibold">主题</span>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-zinc-800 border border-[var(--fluent-border)] rounded-lg px-4 py-1 text-xs text-white outline-none cursor-pointer hover:border-zinc-500 transition-all font-semibold"
              >
                <option value="auto">自动</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>

            {/* Network Wifi Only */}
            <div className="flex items-center justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-[var(--fluent-secondary)]" />
                <span className="text-xs font-semibold">网络偏好</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--fluent-secondary)] font-semibold">仅 Wi-Fi 下载</span>
                <Toggle checked={wifiOnly} onChange={() => setWifiOnly(!wifiOnly)} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: 账户与安全 (Account & Security) */}
        <div className="space-y-3.5 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
            账户与安全
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Management card */}
            <div className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center justify-between hover:bg-[rgba(128,128,128,0.02)] transition cursor-pointer shadow-sm">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[var(--fluent-secondary)] shrink-0" />
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-extrabold text-white truncate">个人资料管理</h4>
                  <p className="text-[10px] text-[var(--fluent-secondary)] truncate">修改资料与头像</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--fluent-secondary)] shrink-0" />
            </div>

            {/* Security Config card */}
            <div className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center justify-between hover:bg-[rgba(128,128,128,0.02)] transition cursor-pointer shadow-sm">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--fluent-secondary)] shrink-0" />
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-extrabold text-white truncate">安全设置</h4>
                  <p className="text-[10px] text-[var(--fluent-secondary)] truncate">密码、双重验证</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--fluent-secondary)] shrink-0" />
            </div>
          </div>
        </div>

        {/* SECTION 3: 通知设置 (Notification Settings) */}
        <div className="space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
              通知设置
            </h3>
            <Toggle checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
          </div>
          
          <div className="space-y-3">
            {/* Master Push Toggle item */}
            <div className="flex items-center justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[var(--fluent-secondary)]" />
                <span className="text-xs font-semibold">推送通知总开关</span>
              </div>
              <Toggle checked={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
            </div>

            {/* Child App Update Toggle item */}
            <div className="flex items-start justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm relative">
              <div className="flex gap-3">
                {/* Bent Line Bracket representation matching the mockup layout */}
                <div className="w-4 h-8 border-l border-b border-zinc-700/50 rounded-bl-lg -mt-3.5 ml-2.5 mr-1" />
                <div className="text-left">
                  <span className="text-xs font-semibold block">应用更新通知</span>
                  <span className="text-[10px] text-[var(--fluent-secondary)] mt-0.5 block leading-tight">
                    根据您的喜好精选推荐
                  </span>
                </div>
              </div>
              <Toggle 
                checked={updateNotif} 
                onChange={() => setUpdateNotif(!updateNotif)} 
                disabled={!pushEnabled} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: 开发者 Git 仓库设置 (Developer Git settings, kept for app functionality) */}
        <div className="space-y-3.5 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
            开发者与克隆设置
          </h3>
          
          <div className="space-y-3">
            {/* Storage directory */}
            <div className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold">默认克隆存储目录</span>
              </div>
              <input
                type="text"
                value={dirInput}
                onChange={(e) => setDirInput(e.target.value)}
                placeholder="例如: C:/Users/Downloads/GitAppStore"
                className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--fluent-accent)] focus:border-[var(--fluent-accent)] transition-all"
              />
            </div>

            {/* GitHub Token */}
            <div className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold">GitHub 个人访问令牌 (Token)</span>
              </div>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx 或 github_pat_xxxx"
                className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--fluent-accent)] focus:border-[var(--fluent-accent)] transition-all"
              />
            </div>

            {/* Git verification check */}
            <div className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <h4 className="text-xs font-bold">Git CLI 运行状态</h4>
                  <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5 leading-snug">
                    {gitInstalled ? "系统检测到本地安装了 Git，支持完整的仓库拉取及自动更新操作。" : "系统未找到 Git，应用将自动降级为 ZIP 压缩包下载模式。"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRecheckGit}
                disabled={rechecking}
                className="px-3 py-1.5 border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.08)] rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition disabled:opacity-50 shrink-0"
              >
                <Terminal className={cn("w-3.5 h-3.5", rechecking && "animate-spin")} />
                <span>检测</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 5: 关于 (About Section matching the mockup) */}
        <div className="space-y-3.5 text-left border-t border-[var(--fluent-border)] pt-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
            关于
          </h3>
          
          <div className="flex items-center justify-between p-3 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold">版本 1.2.3</span>
            </div>
            
            <button
              type="button"
              className="bg-zinc-800 hover:bg-zinc-700 border border-[var(--fluent-border)] text-white text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer transition active:scale-98"
            >
              检查更新
            </button>
          </div>
        </div>

        {/* Save & Reset controls */}
        <div className="flex items-center justify-between border-t border-[var(--fluent-border)] pt-5">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold px-6 py-2 rounded-lg cursor-pointer transition shadow"
            >
              保存设置
            </button>
            {saveSuccess && (
              <span className="text-xs text-green-500 font-semibold flex items-center gap-1 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                设置已成功保存！
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearHistory}
              className="px-4 py-2 text-xs font-semibold text-[var(--fluent-text)] opacity-70 hover:opacity-100 cursor-pointer transition"
            >
              清除搜索历史
            </button>
            <button
              type="button"
              onClick={handleResetApp}
              className="px-4 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>重置应用</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
