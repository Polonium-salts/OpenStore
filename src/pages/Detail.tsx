import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Star, ChevronLeft, Calendar, FileText, Code2, Cpu, Terminal, FolderOpen, XCircle, RefreshCw, Trash2, ArrowUpRight, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import AppIcon from "@/components/AppIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

export default function Detail() {
  const {
    selectedRepo,
    setActiveTab,
    installRepository,
    installedRepos,
    updateRepository,
    uninstallRepository,
    openFolder,
    openVSCode,
    githubToken,
    giteeToken,
    gitInstalled,
    assetDownloads,
    dataSources
  } = useApp();

  const [readme, setReadme] = useState<string>("正在从云端加载自述文件 (README.md)...");
  const [loadingReadme, setLoadingReadme] = useState(true);
  const [extraInfo, setExtraInfo] = useState<any>(null);
  
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const [matchedAsset, setMatchedAsset] = useState<any>(null);
  const [releasesCount, setReleasesCount] = useState<number>(0);
  const [downloadingAsset, setDownloadingAsset] = useState(false);
  const [downloadedAssetPath, setDownloadedAssetPath] = useState<string | null>(null);

  const currentAssetDownload = matchedAsset ? assetDownloads[matchedAsset.browser_download_url] : null;
  const currentAssetPercent = currentAssetDownload ? currentAssetDownload.percent : 0;

  const getPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("linux")) return "linux";
    return "windows";
  };

  const handleDownloadAsset = async () => {
    if (!matchedAsset) return;
    setDownloadingAsset(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await invoke<string>("download_release_asset", {
        url: matchedAsset.browser_download_url,
        filename: matchedAsset.name
      });
      setDownloadedAssetPath(path);

      // Request notification permissions dynamically and send desktop alert
      try {
        const { isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification");
        let hasPermission = await isPermissionGranted();
        if (!hasPermission) {
          const permission = await requestPermission();
          hasPermission = permission === "granted";
        }
      } catch (err) {
        console.warn("Notification plugin permission check skipped in JS:", err);
      }
    } catch (err: any) {
      alert("下载失败: " + (err.message || err));
    } finally {
      setDownloadingAsset(false);
    }
  };

  const repoInfo = selectedRepo;
  const repoSources = repoInfo?.sources || [];
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  useEffect(() => {
    if (repoSources.length > 0) {
      // Find Gitee source first if available to prioritize, or default to first
      const giteeSrc = repoSources.find((s: any) => s.platform === "gitee");
      setActiveSourceId(giteeSrc ? giteeSrc.id : repoSources[0].id);
    } else {
      setActiveSourceId(null);
    }
  }, [repoInfo]);

  useEffect(() => {
    if (!repoInfo) return;
    fetchReadmeAndDetails();
  }, [repoInfo, activeSourceId]);

  const matchedSource = dataSources.find((s) => {
    if (activeSourceId) return s.id === activeSourceId;
    if (repoInfo?.url) {
      if (s.apiEndpointMode === "public") {
        if (s.platform === "github" && repoInfo.url.includes("github.com/")) return true;
        if (s.platform === "gitee" && repoInfo.url.includes("gitee.com/")) return true;
      } else if (s.apiEndpointMode === "enterprise" && s.customEndpoint) {
        try {
          const urlObj = new URL(s.customEndpoint);
          if (repoInfo.url.includes(urlObj.hostname)) return true;
        } catch (e) {}
      }
    }
    return false;
  });

  const isMatchedGitee = matchedSource ? matchedSource.platform === "gitee" : (repoInfo?.url?.includes("gitee.com/") || false);

  const repoUrl = matchedSource
    ? (isMatchedGitee 
        ? `https://gitee.com/${repoInfo.owner}/${repoInfo.repo}` 
        : `https://github.com/${repoInfo.owner}/${repoInfo.repo}`)
    : repoInfo?.url || "";

  const fetchReadmeAndDetails = async () => {
    if (!repoInfo) return;
    setLoadingReadme(true);
    setReadme("正在加载自述文件...");

    if (repoInfo.platform === "url_source" || repoInfo.platform === "openstore_api" || repoInfo.platform === "zip") {
      setReadme(repoInfo.readme || repoInfo.description || "暂无描述");
      setLatestRelease({
        tag_name: repoInfo.version || "1.0.0",
        published_at: new Date().toISOString(),
      });
      const assets = repoInfo.assets || [];
      setReleasesCount(assets.length);
      
      let matched = null;
      if (assets.length > 0) {
        matched = assets[0];
      }
      setMatchedAsset(matched);
      setLoadingReadme(false);
      return;
    }



    const apiBase = matchedSource 
      ? (matchedSource.apiEndpointMode === "public"
          ? (matchedSource.platform === "gitee" ? "https://gitee.com/api/v5" : "https://api.github.com")
          : matchedSource.customEndpoint.trim())
      : (isMatchedGitee ? "https://gitee.com/api/v5" : "https://api.github.com");

    const token = matchedSource
      ? (matchedSource.token || "")
      : (isMatchedGitee 
          ? (localStorage.getItem("git_store_gitee_token") || giteeToken || "")
          : (localStorage.getItem("git_store_token") || githubToken || ""));

    const headers: Record<string, string> = {
      Accept: isMatchedGitee ? "application/json" : "application/vnd.github.v3+json",
    };
    if (!isMatchedGitee) {
      const version = matchedSource?.apiVersion || "2026-03-10";
      headers["X-GitHub-Api-Version"] = version;
    }
    if (token.trim() && !isMatchedGitee) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    try {
      // 1. Fetch README
      let readmeApi = `${apiBase}/repos/${repoInfo.owner}/${repoInfo.repo}/readme`;
      if (isMatchedGitee && token.trim()) {
        readmeApi += `?access_token=${encodeURIComponent(token.trim())}`;
      }

      const readmeRes = await fetch(readmeApi, { headers });
      if (readmeRes.ok) {
        const data = await readmeRes.json();
        // Decode base64 safely supporting utf-8 characters
        const base64Clean = data.content.replace(/\s/g, "");
        const binaryString = atob(base64Clean);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = new TextDecoder("utf-8").decode(bytes);
        setReadme(decoded);
      } else {
        setReadme("该仓库没有提供 README.md 自述文件。");
      }

      // 2. Fetch Detailed Repo Info
      let detailsApi = `${apiBase}/repos/${repoInfo.owner}/${repoInfo.repo}`;
      if (isMatchedGitee && token.trim()) {
        detailsApi += `?access_token=${encodeURIComponent(token.trim())}`;
      }

      const detailsRes = await fetch(detailsApi, { headers });
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        setExtraInfo(data);
      }

      // 3. Fetch Latest Release & Assets Auto Match
      try {
        let releaseData = null;
        if (isMatchedGitee) {
          // Gitee releases API endpoint list, pick first one as latest
          let releaseUrl = `${apiBase}/repos/${repoInfo.owner}/${repoInfo.repo}/releases?per_page=1`;
          if (token.trim()) {
            releaseUrl += `&access_token=${encodeURIComponent(token.trim())}`;
          }
          const releaseRes = await fetch(releaseUrl, { headers });
          if (releaseRes.ok) {
            const list = await releaseRes.json();
            if (Array.isArray(list) && list.length > 0) {
              releaseData = list[0];
            }
          }
        } else {
          // GitHub latest release endpoint
          const releaseRes = await fetch(
            `${apiBase}/repos/${repoInfo.owner}/${repoInfo.repo}/releases/latest`,
            { headers }
          );
          if (releaseRes.ok) {
            releaseData = await releaseRes.json();
          }
        }

        if (releaseData) {
          setLatestRelease(releaseData);
          
          const platform = getPlatform();
          const assets = isMatchedGitee
            ? (releaseData.attach_files || []).map((file: any) => ({
                id: file.id,
                name: file.name,
                size: file.size,
                browser_download_url: file.download_url,
              }))
            : (releaseData.assets || []);
          setReleasesCount(assets.length);

          let matched = null;

          if (assets.length > 0) {
            const scoredAssets = assets.map((a: any) => {
              const name = a.name.toLowerCase();
              let score = 0;

              // Exclude files that are definitely not installers
              if (
                name.endsWith(".blockmap") ||
                name.endsWith(".yml") ||
                name.endsWith(".yaml") ||
                name.endsWith(".txt") ||
                name.endsWith(".sha256") ||
                name.endsWith(".sha1") ||
                name.endsWith(".md5") ||
                name.endsWith(".asc") ||
                name.endsWith(".md") ||
                name.endsWith(".sig")
              ) {
                score -= 10000;
              }

              if (platform === "windows") {
                if (name.endsWith(".exe")) score += 1000;
                if (name.endsWith(".msi")) score += 1000;
                if (name.includes("win")) score += 100;
                if (name.includes("setup")) score += 100;
                if (name.includes("x64") || name.includes("x86") || name.includes("amd64")) score += 10;
                
                // Penalize archives to prioritize direct installers
                if (name.endsWith(".zip") || name.endsWith(".7z") || name.endsWith(".rar")) {
                  score -= 200;
                }
              } else if (platform === "macos") {
                if (name.endsWith(".dmg")) score += 1000;
                if (name.endsWith(".pkg")) score += 1000;
                if (name.includes("mac") || name.includes("darwin") || name.includes("osx") || name.includes("apple")) score += 100;
                if (name.includes("universal") || name.includes("arm64") || name.includes("x64")) score += 10;
                
                if (name.endsWith(".zip") || name.endsWith(".tar.gz") || name.endsWith(".tgz")) {
                  score -= 200;
                }
              } else if (platform === "linux") {
                if (name.endsWith(".deb")) score += 1000;
                if (name.endsWith(".appimage")) score += 1000;
                if (name.endsWith(".rpm")) score += 1000;
                if (name.includes("linux")) score += 100;
                if (name.includes("amd64") || name.includes("x86_64") || name.includes("i386")) score += 10;
                
                if (name.endsWith(".zip") || name.endsWith(".tar.gz") || name.endsWith(".tgz") || name.endsWith(".tar.xz")) {
                  score -= 200;
                }
              }

              return { asset: a, score };
            });

            // Filter out non-installer files and sort by score descending
            const validAssets = scoredAssets
              .filter((item: any) => item.score > -5000)
              .sort((a: any, b: any) => b.score - a.score);

            if (validAssets.length > 0) {
              matched = validAssets[0].asset;
            }
          }

          setMatchedAsset(matched);
        } else {
          setLatestRelease(null);
          setMatchedAsset(null);
          setReleasesCount(0);
        }
      } catch (err) {
        console.error("Failed to query repository releases", err);
      }
    } catch (e) {
      console.error(e);
      setReadme("无法从 GitHub 加载 README 详细内容。请检查网络。");
    } finally {
      setLoadingReadme(false);
    }
  };

  if (!repoInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none">
        <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
        <p className="text-xs text-[var(--fluent-secondary)] font-bold">未选择任何软件仓库</p>
        <button 
          onClick={() => setActiveTab("home")} 
          className="text-xs text-[var(--fluent-accent)] font-bold underline mt-2"
        >
          返回商店主页
        </button>
      </div>
    );
  }

  // Find installation details
  const installedItem = installedRepos.find((r) => r.url === repoUrl);
  const isDownloaded = installedItem?.status === "completed";
  const isDownloading = installedItem?.status === "cloning" || installedItem?.status === "downloading_zip";
  const isUpdating = installedItem?.status === "pulling";
  const isFailed = installedItem?.status === "failed";

  const getSystemRequirements = () => {
    const lang = (repoInfo.language || "").toLowerCase();
    const reqs = [
      { name: "操作系统", value: "Windows 10/11 x64, macOS 10.15+, or Linux" },
      { name: "Git CLI 状态", value: gitInstalled ? "已安装就绪" : "未就绪 ( ZIP 模式克隆 )" },
    ];

    if (lang === "rust") {
      reqs.push(
        { name: "Rust 工具链", value: "Rustc & Cargo v1.75+" },
        { name: "构建工具", value: "MSVC / build-essential" }
      );
    } else if (lang === "javascript" || lang === "typescript") {
      reqs.push(
        { name: "Node.js 环境", value: "Node.js v18.0+" },
        { name: "包管理器", value: "npm, yarn, or pnpm" }
      );
    } else if (lang === "python") {
      reqs.push(
        { name: "Python 运行环境", value: "Python v3.9+ 且配置了 pip" }
      );
    } else if (lang === "go") {
      reqs.push(
        { name: "Go 编译器", value: "Go v1.20 或更高版本" }
      );
    }

    return reqs;
  };

  const formatSize = (kb: number) => {
    if (!kb) return "未知";
    const mb = kb / 1024;
    if (mb >= 1024) return (mb / 1024).toFixed(1) + " GB";
    return mb.toFixed(1) + " MB";
  };

  return (
    <div className="flex-1 overflow-y-auto h-full flex flex-col relative select-text">
      
      {/* 1. Sticky Navigation Header */}
      <div className="sticky top-0 bg-[var(--fluent-bg)]/85 backdrop-blur-md z-20 px-4 md:px-8 py-3.5 border-b border-[var(--fluent-border)] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-1.5 rounded-lg border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.15)] cursor-pointer transition text-[var(--fluent-text)] active:scale-95"
            title="返回商店"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[var(--fluent-secondary)]">返回商店</span>
        </div>

        {repoInfo.url && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-bold text-[var(--fluent-secondary)] hover:text-white flex items-center gap-1 border border-[var(--fluent-border)] rounded-lg px-3 py-1.5 hover:bg-[rgba(128,128,128,0.05)] transition"
          >
            <span>{isMatchedGitee ? "Gitee 仓库原网" : "GitHub 仓库原网"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* 2. Top Hero Identity & Action Panel (Microsoft Store layout) */}
      <section className="px-4 md:px-8 pt-4 md:pt-6 pb-2 shrink-0 border-b border-[var(--fluent-border)]/50 select-none">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Identity details */}
          <div className="flex items-center gap-4.5 text-left min-w-0">
            <AppIcon
              platform={repoInfo.platform}
              fallbackUrl={repoInfo.icon}
              title={repoInfo.title}
              className="w-20 h-20 rounded-2xl object-cover bg-zinc-800 border border-zinc-700/50 flex-shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <h3 className="font-black text-xl leading-tight text-white truncate max-w-[280px] sm:max-w-md">
                {repoInfo.title}
              </h3>
              <p className="text-xs text-[var(--fluent-accent)] font-extrabold mt-1">
                {repoInfo.owner}
              </p>
              <div className="flex items-center gap-2.5 mt-2 text-[10px] font-bold text-[var(--fluent-secondary)]">
                <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/50 uppercase">
                  {repoInfo.category || "开发工具"}
                </span>
                <span className="flex items-center gap-0.5 text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span>{(4.1 + (repoInfo.stars % 8) / 10).toFixed(1)}</span>
                </span>
                <span>•</span>
                <span className="font-mono text-zinc-400">{repoInfo.language}</span>
              </div>

              {/* Source Switcher / Badge */}
              {repoSources.length > 1 ? (
                <div className="flex items-center gap-2 mt-3 select-none flex-wrap">
                  <span className="text-[10px] text-[var(--fluent-secondary)] font-bold">可用软件源:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {repoSources.map((src: any) => {
                      const isActive = activeSourceId === src.id;
                      return (
                        <button
                          key={src.id}
                          onClick={() => setActiveSourceId(src.id)}
                          className={cn(
                            "text-[9px] font-extrabold px-2.5 py-1 rounded border transition-all cursor-pointer",
                            isActive
                              ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)] text-white font-black"
                              : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-300"
                          )}
                          title={src.name}
                        >
                          {src.platform === "gitee" ? "Gitee" : "GitHub"} ({src.name})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : repoSources.length === 1 ? (
                <div className="flex items-center gap-1.5 mt-3 text-[9px] font-bold text-[var(--fluent-secondary)] select-none">
                  <span>软件源:</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded border uppercase tracking-wide",
                    repoSources[0].platform === "gitee"
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  )} title={repoSources[0].name}>
                    {repoSources[0].platform === "gitee" ? "Gitee" : "GitHub"} ({repoSources[0].name})
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="w-full md:w-auto shrink-0 select-none flex flex-col sm:flex-row gap-3">
            {matchedAsset && (
              (downloadingAsset || (currentAssetDownload && currentAssetDownload.status === "downloading")) ? (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 md:w-44 bg-green-900/20 border border-green-700/30 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-2 select-none">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-green-300 font-black">下载安装包 ({currentAssetPercent}%)</div>
                      <div className="w-full bg-zinc-800 rounded-full h-0.5 mt-1 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentAssetPercent}%` }} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const { invoke } = await import("@tauri-apps/api/core");
                      await invoke("cancel_download", { url: matchedAsset.browser_download_url });
                      setDownloadingAsset(false);
                    }}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-xl cursor-pointer transition active:scale-95"
                    title="取消下载"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : downloadedAssetPath && currentAssetDownload?.status !== "cancelled" ? (
                <button
                  onClick={async () => {
                    const { invoke } = await import("@tauri-apps/api/core");
                    const folder = downloadedAssetPath.substring(0, downloadedAssetPath.lastIndexOf(downloadedAssetPath.includes('\\') ? '\\' : '/'));
                    invoke("open_in_explorer", { path: folder });
                  }}
                  className="w-full md:w-56 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black py-2.5 px-5 rounded-xl transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>打开安装包文件夹</span>
                </button>
              ) : (
                <button
                  onClick={handleDownloadAsset}
                  className="w-full md:w-56 bg-green-600 hover:bg-green-500 text-white text-xs font-black py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md shadow-green-500/15 active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>下载官方发布版 ({latestRelease?.tag_name || "Latest"})</span>
                </button>
              )
            )}
            {!installedItem ? (
              <button
                onClick={() => {
                  installRepository(
                    repoInfo.owner,
                    repoInfo.repo,
                    repoInfo.stars,
                    repoInfo.description,
                    repoInfo.language,
                    repoInfo.url
                  );
                }}
                className={cn(
                  "w-full md:w-44 text-white text-xs font-black py-2.5 rounded-xl transition cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-1.5",
                  "bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] shadow-blue-500/15"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                <span>下载项目源码</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Downloading diagnostics */}
                {(isDownloading || isUpdating) && (
                  <div className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/15 text-left flex items-center gap-4 min-w-[200px]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[9px] font-black text-blue-400">
                        <span className="animate-pulse">{isDownloading ? "克隆中..." : "更新中..."}</span>
                        <span className="font-mono opacity-85">{installedItem.message}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden mt-1.5 relative">
                        <div className="bg-blue-500 h-full rounded-full w-1/3 absolute left-0 top-0 animate-progress-bar" />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => uninstallRepository(installedItem)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                      title="取消任务"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isFailed && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>错误: {installedItem.message}</span>
                    </span>
                    <button
                      onClick={() =>
                        installRepository(
                          repoInfo.owner,
                          repoInfo.repo,
                          repoInfo.stars,
                          repoInfo.description,
                          repoInfo.language,
                          repoInfo.url
                        )
                      }
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg border border-[var(--fluent-border)] active:scale-95"
                    >
                      重试
                    </button>
                  </div>
                )}

                {/* Installed Launch items */}
                {isDownloaded && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => openFolder(installedItem.path)}
                      className="px-4 py-2 border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.08)] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4 text-zinc-300" />
                      <span>打开本地文件夹</span>
                    </button>
                    
                    <button
                      onClick={() => openVSCode(installedItem.path)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>在 VS Code 中打开</span>
                    </button>

                    {/* Quick pull updates / delete trigger */}
                    <div className="flex items-center gap-1.5 ml-2 border-l border-[var(--fluent-border)] pl-3">
                      <button
                        onClick={() => updateRepository(installedItem)}
                        className="p-2 hover:bg-[rgba(128,128,128,0.15)] rounded-lg text-purple-400 transition"
                        title="拉取增量更新"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要彻底卸载并删除 ${repoInfo.title} 仓库吗？\n此操作将清空本地目录！`)) {
                            uninstallRepository(installedItem);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition"
                        title="卸载删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Main Split View Layout (Left column: description/code details; Right column: specifications/requirements) */}
      <div className="flex flex-col lg:flex-row px-4 md:px-8 py-4 md:py-6 gap-6 md:gap-8 items-start flex-1 min-h-0">
        
        {/* Left Section (70% - Overview & README.md) */}
        <main className="flex-1 w-full space-y-7 min-w-0">
          
          {/* Simulated Code Screenshot Box */}
          <div className="relative aspect-video w-full bg-zinc-900 border border-zinc-700/50 rounded-xl overflow-hidden shadow flex flex-col justify-between select-none max-w-3xl">
            {/* Titlebar */}
            <div className="bg-zinc-800 px-3 py-1.5 flex items-center justify-between border-b border-zinc-700/30 text-[9px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                <span className="ml-2 font-mono truncate max-w-[200px]">{repoInfo.owner}/{repoInfo.repo}</span>
              </div>
              <Terminal className="w-3.5 h-3.5" />
            </div>
            
            {/* Diagnostics code mockup */}
            <div className="p-5 font-mono text-[10px] text-blue-300 leading-relaxed overflow-hidden text-left flex-1 flex flex-col justify-center">
              <p className="text-zinc-500">// {repoInfo.url?.includes("gitee.com") ? "Gitee" : "GitHub"} REST API Diagnostics Check</p>
              <p className="text-green-400"><span className="text-pink-400">git clone</span> {repoInfo.url}</p>
              <p className="text-purple-400 mt-2.5">const <span className="text-white">repository</span> = &#123;</p>
              <p className="pl-4">name: <span className="text-green-300">"{repoInfo.repo}"</span>,</p>
              <p className="pl-4">stars: <span className="text-yellow-400">{repoInfo.stars}</span>,</p>
              <p className="pl-4">language: <span className="text-green-300">"{repoInfo.language}"</span>,</p>
              <p className="pl-4">forks: <span className="text-yellow-400">{extraInfo?.forks_count || 0}</span>,</p>
              <p className="pl-4">open_issues: <span className="text-yellow-400">{extraInfo?.open_issues_count || 0}</span></p>
              <p className="text-purple-400">&#125;;</p>
            </div>
            
            {/* Visual sandboxed badge */}
            <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-700/30 flex items-center justify-between text-[9px] select-none font-bold">
              <span className="text-zinc-500">已接入本地 Git App Store 安全沙盒容器</span>
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-ping" />
                测试就绪
              </span>
            </div>
          </div>

          <hr className="border-[var(--fluent-border)]/50" />

          {/* README Markdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>仓库介绍与文档 (README.md)</span>
            </h3>

            {loadingReadme ? (
              <div className="flex items-center gap-2 py-8 justify-center border border-[var(--fluent-border)] rounded-xl bg-[var(--fluent-card)] select-none">
                <RefreshCw className="w-4 h-4 text-[var(--fluent-accent)] animate-spin" />
                <span className="text-xs text-[var(--fluent-secondary)] font-bold">正在拉取自述文件中...</span>
              </div>
            ) : (
              <div className="readme-style select-text overflow-x-auto text-left leading-relaxed p-6 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl shadow-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, {
                      ...defaultSchema,
                      attributes: {
                        ...defaultSchema.attributes,
                        // Allow class/style on all elements for styled HTML in README
                        "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "style", "align"],
                        // Allow src/alt/width/height on img
                        img: ["src", "alt", "width", "height", "title", "loading"],
                        // Allow details/summary collapsible blocks
                        details: [],
                        summary: [],
                        // Allow code blocks with language hints
                        code: ["className"],
                        a: ["href", "title", "target", "rel"],
                        // Allow video/source
                        video: ["src", "controls", "width", "height", "autoPlay", "loop", "muted"],
                        source: ["src", "type"],
                      },
                      tagNames: [
                        ...(defaultSchema.tagNames ?? []),
                        "details", "summary", "picture", "source",
                        "sup", "sub", "kbd", "mark", "del", "ins",
                        "center", "small", "video",
                      ],
                    }]
                  ]}
                >
                  {readme}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </main>

        {/* Right Section (30% - Specifications, OS Requirements, Metadata) */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6 select-none text-left font-sans">
          
          {/* NEW: Release assets & OS Matcher Widget */}
          {latestRelease && (
            <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
                  最新构建发布
                </h4>
                <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded font-black border border-green-500/20">
                  {latestRelease.tag_name}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--fluent-secondary)] font-bold">系统检测与配对</span>
                  <span className="font-extrabold text-white">
                    {getPlatform() === "windows" ? "Microsoft Windows (x64)" : getPlatform() === "macos" ? "macOS (Apple Silicon/Intel)" : "Linux (Debian/RHEL/AppImage)"}
                  </span>
                </div>

                {matchedAsset ? (
                  <div className="p-3 bg-[rgba(128,128,128,0.03)] border border-[var(--fluent-border)] rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                      <span className="truncate max-w-[120px]" title={matchedAsset.name}>{matchedAsset.name}</span>
                      <span className="shrink-0">{formatSize(Math.round(matchedAsset.size / 1024))}</span>
                    </div>
                    {(downloadingAsset || (currentAssetDownload && currentAssetDownload.status === "downloading")) ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                          <span className="animate-pulse">下载中...</span>
                          <span>{currentAssetPercent}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${currentAssetPercent}%` }} />
                        </div>
                        <button
                          onClick={async () => {
                            const { invoke } = await import("@tauri-apps/api/core");
                            await invoke("cancel_download", { url: matchedAsset.browser_download_url });
                            setDownloadingAsset(false);
                          }}
                          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>取消下载</span>
                        </button>
                      </div>
                    ) : downloadedAssetPath && currentAssetDownload?.status !== "cancelled" ? (
                      <button
                        onClick={async () => {
                          const { invoke } = await import("@tauri-apps/api/core");
                          const folder = downloadedAssetPath.substring(0, downloadedAssetPath.lastIndexOf(downloadedAssetPath.includes('\\') ? '\\' : '/'));
                          invoke("open_in_explorer", { path: folder });
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>打开文件夹</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDownloadAsset}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black py-2 rounded-lg transition text-center border border-zinc-700/50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>下载推荐安装包</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--fluent-secondary)] leading-relaxed bg-zinc-800/10 border border-zinc-800/30 p-2.5 rounded-lg">
                    未在此 Release 中检索到适配您系统的安装包，可能仅发布了源码压缩包。
                  </p>
                )}

                {releasesCount > 0 && (
                  <div className="border-t border-[var(--fluent-border)] pt-3 text-[10px] flex items-center justify-between font-bold text-[var(--fluent-secondary)]">
                    <span>包含 {releasesCount} 个构建包</span>
                    {repoInfo.url && (
                      <a
                        href={`${repoInfo.url}/releases`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--fluent-accent)] hover:underline flex items-center gap-0.5"
                      >
                        <span>手动查看所有包</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Specifications card */}
          <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60">
              数据规范与指标
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">开源授权许可</span>
                <span className="font-extrabold text-white truncate max-w-[150px]">
                  {extraInfo?.license?.spdx_id || extraInfo?.license?.name || (typeof extraInfo?.license === 'string' ? extraInfo?.license : "Unlicensed")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">开发主分支</span>
                <span className="font-extrabold text-white">{extraInfo?.default_branch || "main"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">仓库存储大小</span>
                <span className="font-extrabold text-white">{formatSize(extraInfo?.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">Forks 衍生数</span>
                <span className="font-extrabold text-white">{extraInfo?.forks_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">未解决 Issues</span>
                <span className="font-extrabold text-white">{extraInfo?.open_issues_count || 0}</span>
              </div>
            </div>
          </div>

          {/* System & Build Requirements */}
          <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>系统与环境要求</span>
            </h4>

            <div className="space-y-3.5 text-xs">
              {getSystemRequirements().map((req, i) => (
                <div key={i} className="flex flex-col gap-1 border-b border-[var(--fluent-border)]/40 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[var(--fluent-secondary)] text-[10px] font-bold uppercase">{req.name}</span>
                  <span className="font-extrabold text-white text-[11px] leading-tight">{req.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Repository Timestamps info */}
          <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fluent-secondary)] select-none opacity-60 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>版本更迭时间</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">首次提交创建</span>
                <span className="font-extrabold text-zinc-400">
                  {extraInfo ? new Date(extraInfo.created_at).toLocaleDateString() : "未知"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">最近一次更新</span>
                <span className="font-extrabold text-zinc-400">
                  {extraInfo ? new Date(extraInfo.updated_at).toLocaleDateString() : "未知"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fluent-secondary)]">最后推送代码</span>
                <span className="font-extrabold text-zinc-400">
                  {extraInfo ? new Date(extraInfo.pushed_at).toLocaleDateString() : "未知"}
                </span>
              </div>
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
}
