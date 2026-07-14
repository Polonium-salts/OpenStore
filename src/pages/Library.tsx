import { useState, MouseEvent } from "react";
import { useApp, InstalledRepo } from "@/context/AppContext";
import {
  FolderOpen,
  Code2,
  Trash2,
  Library as LibIcon,
  AlertTriangle,
  XCircle,
  Download,
  PackageCheck,
  PackageOpen,
  ArrowDownToLine,
  ChevronRight,
  RotateCcw,
  HardDrive,
  GitBranch,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react";

type LibraryView = "library" | "downloads";

export default function Library() {
  const {
    installedRepos,
    openFolder,
    openVSCode,
    updateRepository,
    uninstallRepository,
    setActiveTab,
    setSelectedRepo,
    assetDownloads,
  } = useApp();

  const [view, setView] = useState<LibraryView>("library");

  // ── Data partitions ─────────────────────────────────────
  // Active in-progress tasks (downloads / clones / pulls)
  const downloadingRepos = installedRepos.filter(
    (r) =>
      r.status === "cloning" ||
      r.status === "downloading_zip" ||
      r.status === "pulling"
  );

  const downloadingAssets = Object.values(assetDownloads).filter(
    (a) => a.status === "downloading"
  );

  const totalActiveDownloads = downloadingRepos.length + downloadingAssets.length;

  // Completed source-code installs
  const completedRepos = installedRepos.filter(
    (r) => r.status === "completed"
  );

  // Failed installs
  const failedRepos = installedRepos.filter((r) => r.status === "failed");

  // Successfully downloaded binary assets (completed, not cancelled)
  const completedAssets = Object.values(assetDownloads).filter(
    (a) => a.status === "completed"
  );

  // For now, we treat "failed" repos as needing attention (update/retry)
  const needsAttentionRepos = failedRepos;

  // ── Helpers ─────────────────────────────────────────────
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUpdate = async (e: MouseEvent, repo: InstalledRepo) => {
    e.stopPropagation();
    await updateRepository(repo);
  };

  const handleUninstall = async (e: MouseEvent, repo: InstalledRepo) => {
    e.stopPropagation();
    const msg =
      repo.status === "completed"
        ? `确定要彻底删除本地仓库 ${repo.repo} 吗？\n警告：此操作不可恢复，本地修改将全部丢失！`
        : `确定要取消对 ${repo.repo} 仓库的克隆任务吗？`;
    if (confirm(msg)) await uninstallRepository(repo);
  };

  const handleOpenFolder = (e: MouseEvent, path: string) => {
    e.stopPropagation();
    openFolder(path);
  };

  const handleOpenVSCode = (e: MouseEvent, path: string) => {
    e.stopPropagation();
    openVSCode(path);
  };

  const handleRowClick = (repo: InstalledRepo) => {
    setSelectedRepo({
      owner: repo.owner,
      repo: repo.repo,
      title: repo.repo,
      publisher: repo.owner,
      description: repo.description || "暂无描述",
      category: "开发工具",
      icon: `https://github.com/${repo.owner}.png`,
      stars: repo.stars,
      language: repo.primaryLanguage,
      tags: [repo.primaryLanguage, "Git"].filter(Boolean),
      bannerGradient: "from-blue-600/20 to-zinc-900/10",
      url: repo.url,
    });
    setActiveTab("detail");
  };

  const getStatusText = (status: InstalledRepo["status"]) => {
    switch (status) {
      case "cloning":        return "正在从 GitHub 克隆源码...";
      case "downloading_zip": return "正在下载 ZIP 归档包...";
      case "pulling":        return "正在拉取代码更新...";
      case "failed":         return "任务失败";
      case "completed":      return "代码已就绪";
      default:               return "准备中...";
    }
  };

  const isEmpty =
    completedRepos.length === 0 &&
    completedAssets.length === 0 &&
    failedRepos.length === 0 &&
    downloadingRepos.length === 0;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto h-full px-8 py-10 flex flex-col select-none">

      {/* ── Page Header ───────────────────────────────── */}
      <div className="mb-6 shrink-0 flex items-center justify-between text-left gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1.5">
            {view === "library" ? "我的库" : "下载任务"}
          </h2>
          <p className="text-xs text-[var(--fluent-secondary)] leading-relaxed">
            {view === "library"
              ? "管理已安装的项目、已下载的安装包以及需要更新的应用。"
              : "实时查看正在进行的源码克隆和安装包下载任务，支持随时取消。"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Stats chips */}
          {view === "library" && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] bg-[var(--fluent-card)] border border-[var(--fluent-border)] px-3 py-1.5 rounded-lg font-semibold shadow-sm">
                项目{" "}
                <span className="text-[var(--fluent-accent)] font-bold">
                  {completedRepos.length}
                </span>
              </span>
              {completedAssets.length > 0 && (
                <span className="text-[10px] bg-[var(--fluent-card)] border border-[var(--fluent-border)] px-3 py-1.5 rounded-lg font-semibold shadow-sm">
                  安装包{" "}
                  <span className="text-green-400 font-bold">
                    {completedAssets.length}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Download queue entry button */}
          <button
            onClick={() => setView(view === "library" ? "downloads" : "library")}
            className={`relative flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition cursor-pointer active:scale-95 shadow-sm ${
              view === "downloads"
                ? "bg-[var(--fluent-accent)] text-white border-transparent"
                : "bg-[var(--fluent-card)] text-[var(--fluent-text)] border-[var(--fluent-border)] hover:border-[var(--fluent-accent)]/40"
            }`}
          >
            {view === "downloads" ? (
              <>
                <LibIcon className="w-3.5 h-3.5" />
                返回我的库
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                下载任务
                {totalActiveDownloads > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-black flex items-center justify-center text-white shadow animate-pulse">
                    {totalActiveDownloads}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          VIEW 1: MY LIBRARY
      ════════════════════════════════════════════════════ */}
      {view === "library" && (
        <div className="flex flex-col gap-8 flex-1">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex-1 border border-dashed border-[var(--fluent-border)] rounded-xl flex flex-col items-center justify-center py-24 text-center opacity-45 bg-[rgba(128,128,128,0.01)]">
              <LibIcon className="w-12 h-12 mb-3" />
              <h3 className="font-bold text-sm">您的库空空如也</h3>
              <p className="text-xs mt-1 max-w-sm">
                您还没有通过应用商店安装过任何内容。前往发现页面看看有哪些精选吧！
              </p>
              <button
                onClick={() => setActiveTab("home")}
                className="mt-4 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow"
              >
                浏览精选项目
              </button>
            </div>
          )}

          {/* ── Section 1: Installed Repos (已安装项目) ─── */}
          {completedRepos.length > 0 && (
            <div className="text-left flex flex-col">
              <SectionHeader
                icon={<GitBranch className="w-4 h-4 text-blue-400" />}
                title="已安装项目"
                count={completedRepos.length}
                subtitle="通过应用商店克隆或下载的 Git 源码仓库"
              />
              <div className="border border-[var(--fluent-border)] rounded-xl bg-[var(--fluent-card)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[rgba(128,128,128,0.04)] border-b border-[var(--fluent-border)] text-[var(--fluent-secondary)] font-bold text-[10px] uppercase tracking-wide">
                        <th className="px-4 py-3 w-1/4">仓库名称</th>
                        <th className="px-4 py-3 w-1/6">状态</th>
                        <th className="px-4 py-3 w-1/3">本地路径</th>
                        <th className="px-4 py-3 w-1/8">安装日期</th>
                        <th className="px-4 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fluent-border)]">
                      {completedRepos.map((repo) => (
                        <tr
                          key={repo.url}
                          onClick={() => handleRowClick(repo)}
                          className="hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://github.com/${repo.owner}.png`}
                                alt={repo.repo}
                                className="w-8 h-8 rounded-lg object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-white truncate group-hover:text-[var(--fluent-accent)] transition-colors">
                                  {repo.repo}
                                </h4>
                                <p className="text-[9px] text-[var(--fluent-secondary)] truncate mt-0.5">
                                  {repo.owner}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black bg-green-500/10 border border-green-500/20 text-green-400 uppercase tracking-wide">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              就绪
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[9px] text-zinc-400">
                            <span className="truncate max-w-[200px] block" title={repo.path}>
                              {repo.path || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--fluent-secondary)] text-[10px] font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-50" />
                              {repo.dateInstalled}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-0.5">
                              <ActionBtn title="打开文件夹" onClick={(e) => handleOpenFolder(e, repo.path)}>
                                <FolderOpen className="w-3.5 h-3.5" />
                              </ActionBtn>
                              <ActionBtn title="在 VS Code 中打开" onClick={(e) => handleOpenVSCode(e, repo.path)} className="text-blue-400">
                                <Code2 className="w-3.5 h-3.5" />
                              </ActionBtn>
                              <ActionBtn title="拉取最新代码" onClick={(e) => handleUpdate(e, repo)} className="text-purple-400">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </ActionBtn>
                              <ActionBtn title="卸载并删除" onClick={(e) => handleUninstall(e, repo)} className="text-red-500 hover:bg-red-500/10">
                                <Trash2 className="w-3.5 h-3.5" />
                              </ActionBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Section 2: Downloaded Binaries (已下载安装包) ─── */}
          {completedAssets.length > 0 && (
            <div className="text-left flex flex-col">
              <SectionHeader
                icon={<PackageOpen className="w-4 h-4 text-green-400" />}
                title="已下载安装包"
                count={completedAssets.length}
                subtitle="已下载到本地但尚未运行的官方发布安装包"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedAssets.map((asset) => (
                  <div
                    key={asset.url}
                    className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center gap-4 shadow-sm hover:border-green-500/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-white truncate" title={asset.filename}>
                        {asset.filename}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                          已就绪
                        </span>
                        <span className="text-[9px] text-[var(--fluent-secondary)] font-mono">
                          {formatSize(asset.total)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Open folder shortcut */}
                      <button
                        onClick={async () => {
                          const { invoke } = await import("@tauri-apps/api/core");
                          invoke("get_default_download_dir").then((dir) => {
                            invoke("open_in_explorer", { path: `${dir}\\GitAppStore` });
                          });
                        }}
                        className="p-1.5 rounded-lg border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.1)] text-[var(--fluent-secondary)] cursor-pointer transition active:scale-95"
                        title="打开安装包所在文件夹"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>

                      {/* Install button */}
                      <button
                        onClick={async () => {
                          const { invoke } = await import("@tauri-apps/api/core");
                          invoke("run_installer", { filename: asset.filename }).catch((err: string) => {
                            alert(`无法启动安装包：${err}`);
                          });
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white px-3 py-1.5 rounded-lg cursor-pointer transition active:scale-95 shadow-sm shadow-blue-500/20"
                        title="启动安装"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        安装
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 3: Needs Attention (异常/需更新) ─── */}
          {needsAttentionRepos.length > 0 && (
            <div className="text-left flex flex-col">
              <SectionHeader
                icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                title="需要处理"
                count={needsAttentionRepos.length}
                subtitle="下载失败或需要重新尝试的项目"
                countColor="text-amber-400"
              />
              <div className="border border-amber-500/15 rounded-xl bg-amber-500/[0.03] overflow-hidden">
                <div className="divide-y divide-[var(--fluent-border)]">
                  {needsAttentionRepos.map((repo) => (
                    <div
                      key={repo.url}
                      className="flex items-center gap-4 px-4 py-3.5 hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(repo)}
                    >
                      <img
                        src={`https://github.com/${repo.owner}.png`}
                        alt={repo.repo}
                        className="w-9 h-9 rounded-lg object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-white truncate">{repo.repo}</h4>
                          <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                            失败
                          </span>
                        </div>
                        <p className="text-[9px] text-[var(--fluent-secondary)] truncate mt-0.5" title={repo.message}>
                          {repo.message || "下载过程中发生未知错误"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleUpdate(e, repo)}
                          className="flex items-center gap-1 text-[10px] font-black bg-[var(--fluent-accent)]/10 hover:bg-[var(--fluent-accent)]/20 text-[var(--fluent-accent)] border border-[var(--fluent-accent)]/20 px-3 py-1.5 rounded-lg cursor-pointer transition"
                          title="重新尝试"
                        >
                          <RotateCcw className="w-3 h-3" />
                          重试
                        </button>
                        <button
                          onClick={(e) => handleUninstall(e, repo)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer transition"
                          title="移除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prompt to view downloads when there are active tasks */}
          {totalActiveDownloads > 0 && !isEmpty && (
            <button
              onClick={() => setView("downloads")}
              className="shrink-0 w-full flex items-center justify-between gap-3 px-4 py-3 border border-blue-500/20 bg-blue-500/5 rounded-xl text-xs cursor-pointer hover:border-blue-500/40 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <span className="font-bold text-blue-300">
                  有 {totalActiveDownloads} 个任务正在下载中
                </span>
                <span className="text-[var(--fluent-secondary)]">— 点击查看下载队列</span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          VIEW 2: DOWNLOAD QUEUE
      ════════════════════════════════════════════════════ */}
      {view === "downloads" && (
        <div className="flex flex-col gap-6 flex-1">

          {/* Empty downloads */}
          {totalActiveDownloads === 0 && (
            <div className="flex-1 border border-dashed border-[var(--fluent-border)] rounded-xl flex flex-col items-center justify-center py-24 text-center opacity-45 bg-[rgba(128,128,128,0.01)]">
              <Download className="w-12 h-12 mb-3" />
              <h3 className="font-bold text-sm">暂无进行中的下载任务</h3>
              <p className="text-xs mt-1 max-w-sm">
                当前没有正在进行的克隆、ZIP 下载或安装包下载任务。
              </p>
              <button
                onClick={() => setView("library")}
                className="mt-4 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow"
              >
                返回我的库
              </button>
            </div>
          )}

          {/* ── Repository Clone / Pull Tasks ─── */}
          {downloadingRepos.length > 0 && (
            <div className="text-left">
              <SectionHeader
                icon={<GitBranch className="w-4 h-4 text-blue-400" />}
                title="源码克隆 / 更新"
                count={downloadingRepos.length}
                subtitle="正在进行的 Git 克隆和代码拉取任务"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {downloadingRepos.map((repo) => (
                  <div
                    key={repo.url}
                    className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center gap-4 shadow-sm relative overflow-hidden"
                  >
                    {/* Animated background shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/[0.04] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                    <img
                      src={`https://github.com/${repo.owner}.png`}
                      alt={repo.repo}
                      className="w-11 h-11 rounded-xl object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-xs text-white truncate">{repo.repo}</h4>
                        <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">
                          {repo.status === "pulling" ? "更新" : "克隆"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--fluent-secondary)] truncate mb-2">
                        {getStatusText(repo.status)}
                      </p>
                      {/* Indeterminate progress bar */}
                      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden relative">
                        <div className="bg-[var(--fluent-accent)] h-full rounded-full w-1/3 absolute left-0 animate-progress-bar shadow shadow-blue-500/50" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleUninstall(e, repo)}
                      className="p-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer transition shrink-0 active:scale-95"
                      title="取消任务"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Binary Asset Downloads ─── */}
          {downloadingAssets.length > 0 && (
            <div className="text-left">
              <SectionHeader
                icon={<HardDrive className="w-4 h-4 text-green-400" />}
                title="安装包下载"
                count={downloadingAssets.length}
                subtitle="正在下载的官方发布安装包（二进制文件）"
                countColor="text-green-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {downloadingAssets.map((asset) => (
                  <div
                    key={asset.url}
                    className="p-4 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                      <ArrowDownToLine className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-xs text-white truncate" title={asset.filename}>
                          {asset.filename}
                        </h4>
                        <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">
                          下载中
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-[var(--fluent-secondary)] font-mono mb-1.5">
                        <span>{formatSize(asset.downloaded)}</span>
                        <span>{asset.percent}% / {formatSize(asset.total)}</span>
                      </div>
                      {/* Determinate progress */}
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-300 shadow shadow-green-500/50"
                          style={{ width: `${asset.percent}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const { invoke } = await import("@tauri-apps/api/core");
                        await invoke("cancel_download", { url: asset.url }).catch(() => {});
                      }}
                      className="p-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer transition shrink-0 active:scale-95"
                      title="取消安装包下载"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
  subtitle,
  countColor = "text-[var(--fluent-accent)]",
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  subtitle: string;
  countColor?: string;
}) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          {icon}
          <span>{title}</span>
          <span className={`text-xs font-black ${countColor} tabular-nums`}>({count})</span>
        </h3>
        <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5 ml-6">{subtitle}</p>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  className = "text-zinc-300",
}: {
  children: React.ReactNode;
  title: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg hover:bg-[rgba(128,128,128,0.15)] cursor-pointer transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}
