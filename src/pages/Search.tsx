import { useState, useEffect, FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { Search as SearchIcon, Star, AlertCircle, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAndAdaptUrlSource } from "@/lib/urlSourcesAdapter";
import { loadAppsFromZipSource } from "@/lib/zipSourceLoader";
import AppIcon from "@/components/AppIcon";

export default function Search() {
  const { 
    setSelectedRepo, 
    setActiveTab, 
    searchHistory, 
    addToHistory, 
    clearHistory, 
    searchQuery, 
    setSearchQuery,
    dataSources,
    urlSources
  } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  // Watch for global search bar queries
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setQuery(searchQuery);
      handleSearch(undefined, searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = async (e?: FormEvent, sq?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (sq || query).trim();
    if (!finalQuery) return;

    setLoading(true);
    setError(null);
    addToHistory(finalQuery);
    setQuery(finalQuery);
    
    // Sync to global search bar
    if (finalQuery !== searchQuery) {
      setSearchQuery(finalQuery);
    }


    
    try {
      // Check if it's a direct owner/repo format or full URL
      let directRepoPath = "";
      if (finalQuery.includes("gitee.com/")) {
        const parts = finalQuery.split("gitee.com/");
        if (parts.length > 1) {
          directRepoPath = parts[1].replace(/\.git$/, "");
        }
      } else if (finalQuery.includes("github.com/")) {
        const parts = finalQuery.split("github.com/");
        if (parts.length > 1) {
          directRepoPath = parts[1].replace(/\.git$/, "");
        }
      } else if (finalQuery.split("/").length === 2) {
        directRepoPath = finalQuery;
      }



      if (directRepoPath) {
        // Direct search: query all configured data sources in parallel
        const activeDataSources = dataSources.filter(s => s.enabled !== false);
        const fetchPromises = activeDataSources.map(async (source) => {
          const isGiteeSource = source.platform === "gitee";
          if (source.platform === "zip" || source.platform === "git_link" || source.platform === "openstore_api") return [];
          const base = source.apiEndpointMode === "public"
            ? (isGiteeSource ? "https://gitee.com/api/v5" : "https://api.github.com")
            : source.customEndpoint.trim();

          const sourceToken = source.token || "";
          
          const sourceHeaders: Record<string, string> = {
            Accept: isGiteeSource ? "application/json" : "application/vnd.github.v3+json",
          };
          if (!isGiteeSource) {
            sourceHeaders["X-GitHub-Api-Version"] = source.apiVersion || "2026-03-10";
          }
          if (sourceToken.trim() && !isGiteeSource) {
            sourceHeaders.Authorization = `Bearer ${sourceToken.trim()}`;
          }

          try {
            let url = `${base}/repos/${directRepoPath}`;
            if (isGiteeSource && sourceToken.trim()) {
              url += `?access_token=${encodeURIComponent(sourceToken.trim())}`;
            }
            const tempRes = await fetch(url, { headers: sourceHeaders });
            if (tempRes.ok) {
              const data = await tempRes.json();
              return [{
                owner: data.owner.login,
                repo: isGiteeSource ? data.path : data.name,
                title: data.name,
                publisher: data.owner.login,
                description: data.description || "暂无描述",
                category: "开发工具",
                icon: data.owner.avatar_url || "https://gitee.com/assets/favicon.ico",
                stars: data.stargazers_count,
                language: data.language || "Markdown",
                tags: [data.language, "Git", isGiteeSource ? "Gitee" : "GitHub"].filter(Boolean),
                bannerGradient: isGiteeSource ? "from-red-600/10 to-zinc-900/10" : "from-blue-600/20 to-zinc-900/10",
                url: data.html_url,
                sourceId: source.id,
                sourceName: source.name,
                platform: source.platform,
              }];
            }
          } catch (e) {}
          return [];
        });

        const urlFetchPromises = urlSources.filter(s => s.enabled).map(async (source) => {
          try {
            const result = await fetchAndAdaptUrlSource(source);
            return result.apps.filter(app => 
              `${app.owner.toLowerCase()}/${app.repo.toLowerCase()}` === directRepoPath.toLowerCase()
            ).map(item => ({
              ...item,
              tags: [item.language, "URL Source"].filter(Boolean),
            }));
          } catch (e) {
            return [];
          }
        });

        const [resultsArrays, urlResults] = await Promise.all([
          Promise.all(fetchPromises),
          Promise.all(urlFetchPromises)
        ]);
        const allList = [...resultsArrays.flat(), ...urlResults.flat()];

        if (allList.length === 0) {
          throw new Error("在任何配置的镜像源中均未找到该仓库，请确认拼写或检查网络连接。");
        }

        const mergedList: any[] = [];
        const seenKeys = new Set<string>();

        for (const item of allList) {
          const key = `${item.owner.toLowerCase()}/${item.repo.toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            mergedList.push({
              ...item,
              sources: [{
                id: item.sourceId,
                name: item.sourceName,
                url: item.url,
                platform: item.platform
              }]
            });
          } else {
            const existing = mergedList.find(
              (r) => `${r.owner.toLowerCase()}/${r.repo.toLowerCase()}` === key
            );
            if (existing) {
              if (!existing.sources.some((s: any) => s.id === item.sourceId)) {
                existing.sources.push({
                  id: item.sourceId,
                  name: item.sourceName,
                  url: item.url,
                  platform: item.platform
                });
              }
            }
          }
        }

        setResults(mergedList);
        
        // If only 1 mirror source is found (or it was merged), auto-open the detail page.
        if (mergedList.length === 1) {
          setSelectedRepo(mergedList[0]);
          setActiveTab("detail");
        }
      } else {
        // Run general keyword search
        const searchPromises = [];
        const activeDataSources = dataSources.filter(s => s.enabled !== false);
        
        for (const source of activeDataSources) {
          const isGiteeSource = source.platform === "gitee";
          if (source.platform === "git_link") continue;
          if (source.platform === "zip") {
            searchPromises.push(loadAppsFromZipSource(source.customEndpoint.trim(), finalQuery));
            continue;
          }
          const base = source.apiEndpointMode === "public"
            ? (isGiteeSource ? "https://gitee.com/api/v5" : "https://api.github.com")
            : source.customEndpoint.trim();

          const sourceToken = source.token || "";
          
          const sourceHeaders: Record<string, string> = {
            Accept: isGiteeSource ? "application/json" : "application/vnd.github.v3+json",
          };
          if (!isGiteeSource) {
            sourceHeaders["X-GitHub-Api-Version"] = source.apiVersion || "2026-03-10";
          }
          if (sourceToken.trim() && !isGiteeSource) {
            sourceHeaders.Authorization = `Bearer ${sourceToken.trim()}`;
          }

          if (isGiteeSource) {
            let url = `${base}/search/repositories?q=${encodeURIComponent(finalQuery)}&order=desc&per_page=30`;
            if (sourceToken.trim()) {
              url += `&access_token=${encodeURIComponent(sourceToken.trim())}`;
            }
            searchPromises.push(
              fetch(url, { headers: sourceHeaders })
                .then(async r => {
                  if (!r.ok) return [];
                  const data = await r.json();
                  const list = Array.isArray(data) ? data : (data.items || []);
                  return list.map((item: any) => ({
                    owner: item.owner.login,
                    repo: item.path,
                    title: item.name,
                    publisher: item.owner.login,
                    description: item.description || "暂无描述",
                    category: "开发工具",
                    icon: item.owner.avatar_url || "https://gitee.com/assets/favicon.ico",
                    stars: item.stargazers_count,
                    language: item.language || "Markdown",
                    tags: [item.language, "Git", "Gitee"].filter(Boolean),
                    bannerGradient: "from-red-600/10 to-zinc-900/10",
                    url: item.html_url,
                    sourceId: source.id,
                    sourceName: source.name,
                    platform: source.platform,
                  }));
                })
                .catch(() => [])
            );
          } else if (source.platform === "openstore_api") {
            const endpoint = source.customEndpoint.trim();
            if (endpoint) {
              searchPromises.push(
                fetch(`${endpoint}/api/apps/${encodeURIComponent(finalQuery)}`)
                  .then(async r => {
                    if (!r.ok) return [];
                    const res = await r.json();
                    if (res.code === 200 && res.data) {
                      const app = res.data;
                      return [{
                        owner: app.developer || "未知",
                        repo: app.app_id || finalQuery,
                        title: app.name || finalQuery,
                        publisher: app.developer || "未知",
                        description: app.description || "暂无描述",
                        category: "应用软件",
                        icon: app.icon_url,
                        stars: 0,
                        language: "OpenStore API",
                        tags: ["OpenStore API"],
                        bannerGradient: "from-purple-600/20 to-zinc-900/10",
                        url: "",
                        sourceId: source.id,
                        sourceName: source.name,
                        platform: source.platform,
                      }];
                    }
                    return [];
                  })
                  .catch(() => [])
              );
            }
          } else {
            searchPromises.push(
              fetch(`${base}/search/repositories?q=${encodeURIComponent(finalQuery)}`, { headers: sourceHeaders })
                .then(async r => {
                  if (!r.ok) return [];
                  const data = await r.json();
                  return (data.items || []).map((item: any) => ({
                    owner: item.owner.login,
                    repo: item.name,
                    title: item.name,
                    publisher: item.owner.login,
                    description: item.description || "暂无描述",
                    category: "开发工具",
                    icon: item.owner.avatar_url,
                    stars: item.stargazers_count,
                    language: item.language || "Markdown",
                    tags: [item.language, "Git", "GitHub"].filter(Boolean),
                    bannerGradient: "from-blue-600/20 to-zinc-900/10",
                    url: item.html_url,
                    sourceId: source.id,
                    sourceName: source.name,
                    platform: source.platform,
                  }));
                })
                .catch(() => [])
            );
          }
        }

        const urlFetchPromises = urlSources.filter(s => s.enabled).map(async (source) => {
          try {
            const result = await fetchAndAdaptUrlSource(source);
            return result.apps.filter(app => 
              app.title.toLowerCase().includes(finalQuery.toLowerCase()) || 
              app.description.toLowerCase().includes(finalQuery.toLowerCase()) || 
              app.owner.toLowerCase().includes(finalQuery.toLowerCase())
            ).map(item => ({
              ...item,
              tags: [item.language, "URL Source"].filter(Boolean),
            }));
          } catch (e) {
            return [];
          }
        });

        const [resultsArrays, urlResults] = await Promise.all([
          Promise.all(searchPromises),
          Promise.all(urlFetchPromises)
        ]);
        const allList = [...resultsArrays.flat(), ...urlResults.flat()];
        
        // Sort by stars count descending
        allList.sort((a, b) => b.stars - a.stars);
        
        const mergedList: any[] = [];
        const seenKeys = new Set<string>();

        for (const item of allList) {
          const key = `${item.owner.toLowerCase()}/${item.repo.toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            mergedList.push({
              ...item,
              sources: [{
                id: item.sourceId,
                name: item.sourceName,
                url: item.url,
                platform: item.platform
              }]
            });
          } else {
            const existing = mergedList.find(
              (r) => `${r.owner.toLowerCase()}/${r.repo.toLowerCase()}` === key
            );
            if (existing) {
              if (!existing.sources.some((s: any) => s.id === item.sourceId)) {
                existing.sources.push({
                  id: item.sourceId,
                  name: item.sourceName,
                  url: item.url,
                  platform: item.platform
                });
              }
            }
          }
        }

        setResults(mergedList);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "请求失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (repo: any) => {
    setSelectedRepo(repo);
    setActiveTab("detail");
  };

  const formatStars = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num;
  };

  const getClosedSourceScore = (repo: any) => {
    const id = repo.app_id || repo.repo || repo.title;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rating = 4.1 + (Math.abs(hash) % 9) / 10; // rating between 4.1 and 4.9
    const ratingCount = 30 + (Math.abs(hash) % 970); // rating count between 30 and 1000
    return {
      rating: rating.toFixed(1),
      ratingCount: ratingCount >= 1000 ? `${(ratingCount / 1000).toFixed(1)}k` : `${ratingCount}`
    };
  };

  return (
    <div className="flex-1 overflow-y-auto h-full px-4 md:px-8 py-6 md:py-10 flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight mb-2">搜索开源仓库</h2>
        <p className="text-xs text-[var(--fluent-secondary)] leading-relaxed">
          输入任何 GitHub 或 Gitee 仓库关键词，或者输入具体格式（例如 `owner/repo` 或仓库完整 HTTPS 链接）直接获取。
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={(e) => handleSearch(e)} className="flex gap-2 max-w-2xl w-full shrink-0">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--fluent-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如: microsoft/vscode 或 tauri-apps/tauri"
            className="w-full bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--fluent-accent)] focus:border-[var(--fluent-accent)] transition-all font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "正在搜索..." : "搜索"}
        </button>
      </form>

      {/* History pills */}
      {searchHistory.length > 0 && (
        <div className="mt-4 shrink-0 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--fluent-secondary)] mr-2">
            <History className="w-3.5 h-3.5" />
            <span>搜索历史:</span>
          </div>
          {searchHistory.map((h, i) => (
            <button
              key={i}
              onClick={() => handleSearch(undefined, h)}
              className="text-xs bg-[var(--fluent-card)] border border-[var(--fluent-border)] hover:border-zinc-500 rounded px-2.5 py-1 text-[var(--fluent-text)] opacity-85 hover:opacity-100 cursor-pointer transition"
            >
              {h}
            </button>
          ))}
          <button
            onClick={clearHistory}
            className="text-xs text-red-500 hover:underline cursor-pointer ml-2"
          >
            清空
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 border border-red-500/20 bg-red-500/5 rounded-lg flex items-start gap-3 max-w-2xl shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-500">搜索出错</h4>
            <p className="text-xs text-[var(--fluent-secondary)] mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--fluent-accent)] animate-spin" />
          <p className="text-xs text-[var(--fluent-secondary)] mt-3">正在检索所有镜像数据源，请稍候...</p>
        </div>
      )}

      {/* Search results list */}
      {!loading && !error && results.length > 0 && (
        <div className="mt-8 flex-1">
          <h3 className="text-sm font-bold text-[var(--fluent-secondary)] mb-4">
            为您找到以下相关仓库 ({results.length}):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((repo, idx) => (
              <div
                key={idx}
                onClick={() => handleCardClick(repo)}
                className="group p-5 rounded-xl border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px] hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex gap-4">
                  <AppIcon
                    platform={repo.platform}
                    
                    fallbackUrl={repo.icon}
                    title={repo.title}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800/10 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate group-hover:text-[var(--fluent-accent)] transition-colors">
                      {repo.title}
                    </h3>
                    <p className="text-[10px] text-[var(--fluent-secondary)] truncate">
                      {repo.publisher}
                    </p>
                    {repo.sources && repo.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {repo.sources.map((src: any) => {
                          const isWinget = src.platform === "winget" || src.id?.includes("winget");
                          return (
                            <span
                              key={src.id}
                              className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded font-black border uppercase select-none tracking-wide",
                                isWinget
                                  ? "bg-blue-600/15 border-blue-500/25 text-blue-400"
                                  : src.platform === "gitee"
                                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                                  : src.platform === "zip"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                  : src.platform === "url_source"
                                  ? "bg-teal-500/10 border-teal-500/20 text-teal-500"
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              )}
                              title={src.name}
                            >
                              {isWinget
                                ? "WinGet"
                                : src.platform === "gitee"
                                ? "Gitee"
                                : src.platform === "zip"
                                ? "本地 ZIP 源"
                                : src.platform === "url_source"
                                ? "URL 软件源"
                                : "GitHub"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-[var(--fluent-secondary)] line-clamp-2 mt-2 leading-relaxed">
                      {repo.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--fluent-border)] pt-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--fluent-secondary)]">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    {(() => {
                      const isClosed = 
                        repo.platform === "zip" || 
                        repo.platform === "url_source" || 
                        repo.platform === "openstore_api" || 
                        (!repo.url || (!repo.url.includes("github.com") && !repo.url.includes("gitee.com")));
                      
                      if (isClosed) {
                        const closedScore = getClosedSourceScore(repo);
                        return (
                          <>
                            <span className="text-white font-bold">{closedScore.rating}</span>
                            <span className="opacity-55 text-[9px] font-bold">({closedScore.ratingCount} 评分)</span>
                            <span className="opacity-30">•</span>
                            <span>{repo.language || "常用软件"}</span>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <span className="text-white font-bold">{formatStars(repo.stars)}</span>
                            <span className="opacity-30">•</span>
                            <span>{repo.language}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--fluent-accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center select-none opacity-45">
          <SearchIcon className="w-12 h-12 mb-3" />
          <h3 className="font-bold text-sm">寻找精彩的开源工具</h3>
          <p className="text-xs mt-1 max-w-sm">在上方输入您想要寻找的开源仓库，支持在已配置的多个镜像源中同步检索。</p>
        </div>
      )}
    </div>
  );
}
