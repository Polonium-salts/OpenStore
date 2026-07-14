import { useState, useEffect, FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { Search as SearchIcon, Star, AlertCircle, History, ArrowRight } from "lucide-react";

export default function Search() {
  const { 
    setSelectedRepo, 
    setActiveTab, 
    githubToken, 
    giteeToken, 
    searchHistory, 
    addToHistory, 
    clearHistory, 
    searchQuery, 
    setSearchQuery,
    dataSources,
    preferredPlatform
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

    const platform = preferredPlatform;
    let queryIsGitee = platform === "gitee";
    
    try {
      // Check if it's a direct owner/repo format or full URL
      let directRepoPath = "";
      if (finalQuery.includes("gitee.com/")) {
        const parts = finalQuery.split("gitee.com/");
        if (parts.length > 1) {
          directRepoPath = parts[1].replace(/\.git$/, "");
          queryIsGitee = true;
        }
      } else if (finalQuery.includes("github.com/")) {
        const parts = finalQuery.split("github.com/");
        if (parts.length > 1) {
          directRepoPath = parts[1].replace(/\.git$/, "");
          queryIsGitee = false;
        }
      } else if (finalQuery.split("/").length === 2) {
        directRepoPath = finalQuery;
      }

      // Check configured active data source platforms
      const configuredPlatforms = new Set(dataSources.map(ds => ds.platform || "github"));
      const hasGitHub = configuredPlatforms.has("github") || githubToken.trim() !== "";
      const hasGitee = configuredPlatforms.has("gitee") || giteeToken.trim() !== "";

      const activeToken = queryIsGitee 
        ? (localStorage.getItem("git_store_gitee_token") || giteeToken || "")
        : (localStorage.getItem("git_store_token") || githubToken || "");

      const headers: Record<string, string> = {
        Accept: queryIsGitee ? "application/json" : "application/vnd.github.v3+json",
      };
      if (!queryIsGitee) {
        const version = localStorage.getItem("git_store_api_version") || "2026-03-10";
        headers["X-GitHub-Api-Version"] = version;
      }
      if (activeToken.trim()) {
        headers.Authorization = `Bearer ${activeToken.trim()}`;
      }

      if (directRepoPath) {
        // Direct search: try preferred platform first
        const giteeMode = localStorage.getItem("git_store_gitee_api_mode") || "public";
        const giteeCustom = localStorage.getItem("git_store_gitee_custom_endpoint") || "";
        const giteeBase = giteeMode === "public" ? "https://gitee.com/api/v5" : giteeCustom.trim() || "https://gitee.com/api/v5";
        
        const githubMode = localStorage.getItem("git_store_api_mode") || "public";
        const githubCustom = localStorage.getItem("git_store_custom_endpoint") || "";
        const githubBase = githubMode === "public" ? "https://api.github.com" : githubCustom.trim() || "https://api.github.com";

        const base = queryIsGitee ? giteeBase : githubBase;
        let res = await fetch(`${base}/repos/${directRepoPath}`, { headers });
        
        // Fallback to secondary platform if direct fails and both platforms are active
        if (!res.ok && hasGitHub && hasGitee) {
          queryIsGitee = !queryIsGitee;
          const backupToken = queryIsGitee 
            ? (localStorage.getItem("git_store_gitee_token") || giteeToken || "")
            : (localStorage.getItem("git_store_token") || githubToken || "");
          const backupHeaders: Record<string, string> = {
            Accept: queryIsGitee ? "application/json" : "application/vnd.github.v3+json",
          };
          if (!queryIsGitee) {
            const version = localStorage.getItem("git_store_api_version") || "2026-03-10";
            backupHeaders["X-GitHub-Api-Version"] = version;
          }
          if (backupToken.trim()) {
            backupHeaders.Authorization = `Bearer ${backupToken.trim()}`;
          }
          const backupBase = queryIsGitee ? giteeBase : githubBase;
          res = await fetch(`${backupBase}/repos/${directRepoPath}`, { headers: backupHeaders });
        }

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("仓库未找到，请确认拼写或检查网络连接。");
          } else {
            throw new Error(`API 错误: ${res.statusText}`);
          }
        }
        const data = await res.json();
        
        const transformedRepo = {
          owner: data.owner.login,
          repo: queryIsGitee ? data.path : data.name,
          title: data.name,
          publisher: data.owner.login,
          description: data.description || "暂无描述",
          category: "开发工具",
          icon: data.owner.avatar_url || "https://gitee.com/assets/favicon.ico",
          stars: data.stargazers_count,
          language: data.language || "Markdown",
          tags: [data.language, "Git", queryIsGitee ? "Gitee" : "GitHub"].filter(Boolean),
          bannerGradient: queryIsGitee ? "from-red-600/10 to-zinc-900/10" : "from-blue-600/20 to-zinc-900/10",
          url: data.html_url,
        };
        
        setResults([transformedRepo]);
        setSelectedRepo(transformedRepo);
        setActiveTab("detail");
      } else {
        // Run general keyword search
        const searchPromises = [];
        
        if (hasGitHub) {
          const ghHeaders: Record<string, string> = {
            Accept: "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": localStorage.getItem("git_store_api_version") || "2026-03-10"
          };
          const ghToken = localStorage.getItem("git_store_token") || githubToken || "";
          if (ghToken.trim()) ghHeaders.Authorization = `Bearer ${ghToken.trim()}`;
          
          searchPromises.push(
            fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(finalQuery)}`, { headers: ghHeaders })
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
                }));
              })
              .catch(() => [])
          );
        }

        if (hasGitee) {
          const gtHeaders: Record<string, string> = {
            Accept: "application/json"
          };
          const gtToken = localStorage.getItem("git_store_gitee_token") || giteeToken || "";
          if (gtToken.trim()) gtHeaders.Authorization = `Bearer ${gtToken.trim()}`;
          
          const giteeMode = localStorage.getItem("git_store_gitee_api_mode") || "public";
          const giteeCustom = localStorage.getItem("git_store_gitee_custom_endpoint") || "";
          const giteeBase = giteeMode === "public" ? "https://gitee.com/api/v5" : giteeCustom.trim() || "https://gitee.com/api/v5";

          searchPromises.push(
            fetch(`${giteeBase}/search/repositories?q=${encodeURIComponent(finalQuery)}&order=desc&per_page=30`, { headers: gtHeaders })
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
                }));
              })
              .catch(() => [])
          );
        }

        const resultsArrays = await Promise.all(searchPromises);
        let mergedList = resultsArrays.flat();
        
        // Sort by stars count descending
        mergedList.sort((a, b) => b.stars - a.stars);
        
        // Remove duplicates by combining owner/repo identifier
        const seen = new Set();
        mergedList = mergedList.filter(item => {
          const key = `${item.owner.toLowerCase()}/${item.repo.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

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
          <p className="text-xs text-[var(--fluent-secondary)] mt-3">正在调用 GitHub API，请稍候...</p>
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
                  <img
                    src={repo.icon}
                    alt={repo.title}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800/10 dark:border-zinc-700/50 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate group-hover:text-[var(--fluent-accent)] transition-colors">
                      {repo.title}
                    </h3>
                    <p className="text-[10px] text-[var(--fluent-secondary)] truncate">
                      {repo.publisher}
                    </p>
                    <p className="text-xs text-[var(--fluent-secondary)] line-clamp-2 mt-2 leading-relaxed">
                      {repo.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--fluent-border)] pt-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--fluent-secondary)]">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold">{formatStars(repo.stars)}</span>
                    <span className="opacity-30">•</span>
                    <span>{repo.language}</span>
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
          <p className="text-xs mt-1 max-w-sm">在上方输入您想要寻找的 GitHub 仓库，例如 `Denoland/deno` 等。</p>
        </div>
      )}
    </div>
  );
}
