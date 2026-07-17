import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fetchAndAdaptUrlSource } from "@/lib/urlSourcesAdapter";
import { loadAppsFromZipSourceWithMeta } from "@/lib/zipSourceLoader";
import AppIcon from "@/components/AppIcon";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Particles } from "@/components/magicui/particles";
import { Star, Flame, Trophy, Layers, Sparkles, AlertTriangle, RefreshCw, Key, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GitHubAppItem {
  owner: string;
  repo: string;
  title: string;
  publisher: string;
  description: string;
  category: string;
  icon: string;
  stars: number;
  language: string;
  rating: number;
  url: string;
  bannerGradient: string;
  sources?: any[];
  platform?: string;
}

export default function Home() {
  const { setSelectedRepo, setActiveTab, installRepository, installedRepos, activeTab, githubToken, giteeToken, preferredPlatform, dataSources, urlSources } = useApp();
  
  const [apps, setApps] = useState<GitHubAppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Page filtering & Pagination states
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // standard 2 rows of 4 cards

  const categories = [
    { name: "全部", icon: Layers },
    { name: "必备应用", icon: Sparkles },
    { name: "最新上架", icon: Flame },
    { name: "创意工具", icon: Trophy }
  ];

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, activeTab]);

  // Fetch real repositories from all enabled Gitee/GitHub data sources concurrently
  const fetchStoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeDataSources = dataSources.filter(s => s.enabled !== false);
      if (activeDataSources.length === 0 && urlSources.filter(s => s.enabled).length === 0) {
        setApps([]);
        setLoading(false);
        return;
      }

      const fetchPromises = activeDataSources.map(async (source, idx) => {
        const isGitee = source.platform === "gitee";
        const isZip = source.platform === "zip";
        const isGitLink = source.platform === "git_link";
        const isOpenStoreApi = source.platform === "openstore_api";

        if (isGitLink) {
          return [];
        }

        if (isZip) {
          // 空 query 让适配器自行决定(通常返回全量);带 query 时由适配器过滤。
          try {
            const result = await loadAppsFromZipSourceWithMeta(
              source.customEndpoint.trim(),
              ""
            );
            return result.apps;
          } catch (err) {
            console.warn(`[${source.name}] ZIP 源加载失败:`, err);
            return [];
          }
        }

        const token = source.token || "";
        const mode = source.apiEndpointMode;
        
        let base = "";
        let fetchUrl = "";
        const headers: Record<string, string> = {};
          if (isOpenStoreApi) {
            const endpoint = source.customEndpoint.trim().replace(/\/+$/, "");
            if (!endpoint) return [];

            // 优先用用户在 wizard 中配置的 homepageQueries。
            // 之前版本这里硬编码了 ["vscode", "chrome"],任何用户安装的
            // OpenStore API 网关在首页都只能看到这两个应用,这是 bug。
            const queries = (source.homepageQueries && source.homepageQueries.length > 0)
              ? source.homepageQueries
              : [];
            if (queries.length === 0) {
              console.warn(
                `[${source.name}] 未配置 homepageQueries,跳过首页拉取。请在数据源管理中补充。`
              );
              return [];
            }

            const fetchPromises = queries.map(async (q) => {
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 8000);
              try {
                const res = await fetch(`${endpoint}/api/apps/${encodeURIComponent(q)}`, {
                  signal: ctrl.signal,
                });
                clearTimeout(timer);
                if (!res.ok) return null;
                const json = await res.json();
                if (json && json.code === 200 && json.data) return json.data;
                return null;
              } catch (err) {
                clearTimeout(timer);
                console.warn(`[${source.name}] /api/apps/${q} 拉取失败:`, err);
                return null;
              }
            });

            const results = await Promise.all(fetchPromises);
            return results
              .filter(Boolean)
              .map((app: any) => ({
                owner: app.developer || "未知",
                repo: app.app_id || "app",
                title: app.name || "未知应用",
                publisher: app.developer || "未知",
                description: app.description || "暂无描述",
                category: "应用软件",
                icon: app.icon_url,
                stars: 0,
                language: "OpenStore API",
                rating: 5.0,
                url: "",
                bannerGradient: "from-purple-700/30 to-purple-950/20",
                sourceId: source.id,
                sourceName: source.name,
                platform: "openstore_api" as const,
                version: app.version,
              }));
          }


        if (isGitee) {
          base = mode === "public" ? "https://gitee.com/api/v5" : source.customEndpoint.trim() || "https://gitee.com/api/v5";
          headers["Accept"] = "application/json";
          const query = "tauri";
          fetchUrl = `${base}/search/repositories?q=${encodeURIComponent(query)}&order=desc&per_page=50`;
          if (token.trim()) {
            fetchUrl += `&access_token=${encodeURIComponent(token.trim())}`;
          }
        } else {
          base = mode === "public" ? "https://api.github.com" : source.customEndpoint.trim() || "https://api.github.com";
          headers["Accept"] = "application/vnd.github.v3+json";
          headers["X-GitHub-Api-Version"] = source.apiVersion || "2026-03-10";
          if (token.trim()) {
            headers["Authorization"] = `Bearer ${token.trim()}`;
          }
          const query = "stars:>1000 tauri OR electron OR rust-gui OR desktop-app";
          fetchUrl = `${base}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;
        }

        try {
          const res = await fetch(fetchUrl, { headers });
          if (!res.ok) {
            console.warn(`Failed to fetch from data source ${source.name}: ${res.status}`);
            return [];
          }
          const data = await res.json();
          const repoList = isGitee ? (Array.isArray(data) ? data : (data.items || [])) : (data.items || []);
          
          return repoList.map((repo: any, repoIdx: number) => {
            let category = "应用";
            const topics = repo.topics || [];
            if (topics.includes("game") || topics.includes("gaming") || repo.name.toLowerCase().includes("game") || repoIdx % 4 === 1) {
              category = "游戏";
            } else if (topics.includes("design") || topics.includes("graphics") || repo.name.toLowerCase().includes("design") || repoIdx % 4 === 2) {
              category = "创意工具";
            } else if (topics.includes("developer-tools") || topics.includes("compiler") || repo.name.toLowerCase().includes("tool") || repoIdx % 4 === 3) {
              category = "开发者工具";
            }

            const gradients = [
              "from-zinc-700/30 to-zinc-950/20",
              "from-blue-600/20 to-purple-600/10",
              "from-amber-600/20 to-zinc-900/10",
              "from-orange-500/20 to-neutral-900/10",
              "from-purple-700/20 to-violet-950/10",
            ];

            return {
              owner: repo.owner.login,
              repo: isGitee ? repo.path : repo.name,
              title: repo.name,
              publisher: repo.owner.login,
              description: repo.description || "暂无项目描述，访问代码库以获取更多开发详情。",
              category,
              icon: repo.owner.avatar_url || "https://gitee.com/assets/favicon.ico",
              stars: repo.stargazers_count,
              language: repo.language || repo.primary_language || "TypeScript",
              rating: Number((4.1 + (repo.stargazers_count % 8) / 10).toFixed(1)),
              url: repo.html_url,
              bannerGradient: gradients[(idx + repoIdx) % gradients.length],
              sourceId: source.id,
              sourceName: source.name,
              platform: source.platform,
            };
          });
        } catch (e) {
          console.error(`Error fetching from data source ${source.name}:`, e);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      
      // Fetch enabled URL sources
      const activeUrlSources = urlSources.filter(s => s.enabled);
      const urlResults = await Promise.all(
        activeUrlSources.map(async (source) => {
          try {
            const res = await fetchAndAdaptUrlSource(source);
            return res.apps || [];
          } catch (err) {
            console.error(`Failed to fetch URL source ${source.name}:`, err);
            return [];
          }
        })
      );

      const allApps = [...results.flat(), ...urlResults.flat()];

      // Sort by stars count descending
      allApps.sort((a, b) => b.stars - a.stars);

      const mergedApps: any[] = [];
      const seenKeys = new Set<string>();

      for (const item of allApps) {
        const key = `${item.owner.toLowerCase()}/${item.repo.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          mergedApps.push({
            ...item,
            sources: [{
              id: item.sourceId,
              name: item.sourceName,
              url: item.url,
              platform: item.platform
            }]
          });
        } else {
          const existing = mergedApps.find(
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

      setApps(mergedApps);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "并行拉取数据源失败，请检查网络或配置。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [githubToken, giteeToken, preferredPlatform, dataSources, urlSources]);

  // Derived sections
  const getCarouselItems = () => {
    if (apps.length === 0) return [];
    const featured = apps.slice(0, 3);
    const banners = [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop"
    ];
    return featured.map((app, idx) => ({
      title: `精选推介: ${app.title}`,
      subtitle: app.title,
      description: app.description,
      app,
      banner: banners[idx % banners.length],
      gradient: "from-zinc-950/40 via-zinc-950/60 to-zinc-950/95",
    }));
  };

  const getRightStagedItems = () => {
    if (apps.length < 5) return [];
    return apps.slice(3, 5).map((app) => ({
      title: app.title,
      desc: app.description,
      rating: (app.rating ?? 5.0).toFixed(1),
      icon: app.icon,
      app,
    }));
  };

  const getFilteredApps = () => {
    let list = apps;
    if (activeTab === "games") {
      list = apps.filter(app => app.category === "游戏");
    } else if (activeTab === "devtools") {
      list = apps.filter(app => app.category === "开发者工具");
    }

    if (selectedCategory === "全部") return list;
    if (selectedCategory === "必备应用") {
      return list.filter(app => app.stars > 10000);
    }
    if (selectedCategory === "最新上架") {
      return list.slice().reverse();
    }
    if (selectedCategory === "创意工具") {
      return list.filter(app => app.category === "创意工具");
    }
    return list;
  };

  const getRankingItems = () => {
    if (apps.length < 20) return [];
    return apps.slice(5, 20).map((app, idx) => ({
      rank: idx + 1,
      title: app.title,
      publisher: app.publisher,
      icon: app.icon,
      rating: (app.rating ?? 5.0).toFixed(1),
      app
    }));
  };

  const isDownloaded = (owner: string, repo: string) => {
    return installedRepos.some((r) => r.owner === owner && r.repo === repo && r.status === "completed");
  };

  const isDownloading = (owner: string, repo: string) => {
    return installedRepos.some(
      (r) => r.owner === owner && r.repo === repo && (r.status === "cloning" || r.status === "downloading_zip" || r.status === "pulling")
    );
  };

  const triggerDownload = (e: React.MouseEvent, app: any) => {
    e.stopPropagation();
    installRepository(app.owner, app.repo, app.stars, app.description, app.language, app.url);
  };

  const handleRepoClick = (app: any) => {
    const repoInfo = {
      owner: app.owner,
      repo: app.repo,
      title: app.title,
      publisher: app.publisher,
      description: app.description,
      category: app.category,
      icon: app.icon,
      stars: app.stars,
      language: app.language,
      tags: [app.language, app.category],
      url: app.url,
      sources: app.sources
    };
    setSelectedRepo(repoInfo);
    setActiveTab("detail");
  };

  const carouselItems = getCarouselItems();
  const rightStagedItems = getRightStagedItems();
  const rankingItems = getRankingItems();

  const renderRankCard = (item: any) => {
    return (
      <div
        key={item.rank}
        onClick={() => handleRepoClick(item.app)}
        className="p-3.5 border border-[var(--fluent-border)] bg-[var(--fluent-card)] flex items-center justify-between hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition rounded-xl shadow-sm animate-fade-in"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-black text-[var(--fluent-secondary)] w-5 text-center shrink-0">
            {item.rank}
          </span>
          <AppIcon
            platform={item.app.platform}
            
            fallbackUrl={item.icon}
            title={item.title}
            className="w-10 h-10 rounded-lg object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
          />
          <div className="text-left min-w-0">
            <h4 className="font-extrabold text-xs truncate w-24 sm:w-32">{item.title}</h4>
            <p className="text-[9px] text-[var(--fluent-secondary)] truncate w-24 sm:w-32 mt-0.5">
              {item.publisher}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[9px] text-[var(--fluent-secondary)] font-bold">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{item.rating}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--fluent-secondary)]" />
        </div>
      </div>
    );
  };

  // 1. Loading State render
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full select-none gap-4">
        <Particles className="opacity-30" quantity={30} color="#0078d4" />
        <RefreshCw className="w-8 h-8 text-[var(--fluent-accent)] animate-spin" />
        <p className="text-xs text-[var(--fluent-secondary)] font-bold">
          正在并行拉取已启用的多通道数据源依赖中...
        </p>
      </div>
    );
  }

  // 2. Error State render
  if (error || apps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-6 text-center select-none max-w-md mx-auto">
        <Particles className="opacity-20" quantity={20} color="#ff3333" />
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-4 animate-pulse">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white">数据源拉取中断</h3>
        <p className="text-xs text-[var(--fluent-secondary)] mt-2 leading-relaxed">
          {error || "未在配置的合并数据源中检索到任何有效的代码库项目。请检查您的网络连接与 Token 凭据。"}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={fetchStoreData}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-[var(--fluent-border)] text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重新加载</span>
          </button>
          <button
            onClick={() => setActiveTab("apps")}
            className="flex-1 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow"
          >
            <Key className="w-3.5 h-3.5" />
            <span>配置数据源</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredApps = getFilteredApps();
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  
  // Slice correct items for the active page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex-1 overflow-y-auto h-full relative flex flex-col pb-16">
      {/* Background stars effect */}
      <Particles className="opacity-30" quantity={40} color="#0078d4" />
      
      {/* Hero Showcase */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-4.5 px-4 md:px-8 pt-4 md:pt-6 shrink-0 z-10">
        
        {/* Left Hero Slider */}
        <div className="lg:col-span-7 h-[250px] rounded-xl overflow-hidden relative border border-[var(--fluent-border)] shadow-md select-none group">
          <BorderBeam className="opacity-40" />

          <img
            src={carouselItems[carouselIndex]?.banner}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none scale-102 group-hover:scale-100 transition-all duration-700"
          />
          <div className={cn("absolute inset-0 bg-gradient-to-r", carouselItems[carouselIndex]?.app.bannerGradient)} />

          <div className="absolute inset-y-0 left-0 w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between text-left select-text">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider bg-[var(--fluent-accent)]/80 text-white px-2.5 py-1 rounded-full uppercase">
                热门精选
              </span>
              <h3 className="text-xl font-black text-white tracking-tight mt-3">
                {carouselItems[carouselIndex]?.title}
              </h3>
              <p className="text-xs text-zinc-300 font-medium line-clamp-2 mt-2 leading-relaxed">
                {carouselItems[carouselIndex]?.description}
              </p>
            </div>

            <div className="flex items-center gap-4 select-none">
              <button
                onClick={() => handleRepoClick(carouselItems[carouselIndex].app)}
                className="bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white font-extrabold text-xs px-6 py-2 rounded-lg cursor-pointer transition active:scale-98 shadow-lg shadow-blue-500/10"
              >
                查看详情
              </button>

              {isDownloaded(carouselItems[carouselIndex].app.owner, carouselItems[carouselIndex].app.repo) ? (
                <button className="bg-[rgba(128,128,128,0.15)] border border-[var(--fluent-border)] text-white font-extrabold text-xs px-6 py-2 rounded-lg transition select-none cursor-default">
                  已安装
                </button>
              ) : isDownloading(carouselItems[carouselIndex].app.owner, carouselItems[carouselIndex].app.repo) ? (
                <button className="bg-[rgba(0,120,212,0.15)] border border-blue-500/20 text-blue-400 font-extrabold text-xs px-6 py-2 rounded-lg transition select-none cursor-default animate-pulse">
                  正在克隆...
                </button>
              ) : (
                <button
                  onClick={(e) => triggerDownload(e, carouselItems[carouselIndex].app)}
                  className="bg-white hover:bg-zinc-100 text-black font-extrabold text-xs px-6 py-2 rounded-lg cursor-pointer transition shadow-md active:scale-98"
                >
                  获取
                </button>
              )}

              <div className="flex items-center gap-1.5 mt-6">
                {carouselItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full cursor-pointer transition-all duration-200",
                      carouselIndex === idx ? "bg-[var(--fluent-accent)] w-4" : "bg-zinc-600 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Stacked Featured Items */}
        <div className="lg:col-span-3 flex flex-col gap-3.5 h-[250px]">
          {rightStagedItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleRepoClick(item.app)}
              className="flex-1 rounded-xl border border-[var(--fluent-border)] bg-[var(--fluent-card)] p-4 flex items-center justify-between cursor-pointer hover:bg-[rgba(128,128,128,0.03)] transition-all duration-200 relative group overflow-hidden shadow-sm"
            >
              <div className="flex gap-3">
                <AppIcon
                  platform={item.app.platform}
                  
                  fallbackUrl={item.icon}
                  title={item.title}
                  className="w-11 h-11 rounded-lg object-cover bg-zinc-800 border border-zinc-700/50 flex-shrink-0"
                />
                <div className="text-left min-w-0 flex flex-col justify-center">
                  <h4 className="font-extrabold text-xs truncate w-28 group-hover:text-[var(--fluent-accent)] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[var(--fluent-secondary)] truncate w-32 mt-0.5">
                    {item.desc}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--fluent-secondary)] font-bold">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </div>

              <div>
                {isDownloaded(item.app.owner, item.app.repo) ? (
                  <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-1 rounded font-bold">
                    已安装
                  </span>
                ) : isDownloading(item.app.owner, item.app.repo) ? (
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-1 rounded font-bold animate-pulse">
                    克隆中
                  </span>
                ) : (
                  <button
                    onClick={(e) => triggerDownload(e, item.app)}
                    className="text-[10px] font-bold bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white px-2.5 py-1 rounded cursor-pointer transition"
                  >
                    下载
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Pills Header */}
      <section className="px-4 md:px-8 mt-4 shrink-0 animate-fade-in">
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "flex items-center gap-2 px-4.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer border transition-all duration-200",
                  isSelected
                    ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)] text-white shadow-sm"
                    : "bg-[var(--fluent-card)] border-[var(--fluent-border)] hover:border-zinc-400 dark:hover:border-zinc-500"
                )}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary Apps Grid (Paginated grid: 8 items per page) */}
      <section className="px-4 md:px-8 mt-4 md:mt-5 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedApps.map((app, idx) => (
            <div
              key={idx}
              onClick={() => handleRepoClick(app)}
              className="group p-4 rounded-xl border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.03)] cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px] relative hover:shadow hover:scale-[1.005] animate-fade-in"
            >
              <ShineBorder borderRadius={12} borderWidth={1.2} duration={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex gap-3">
                <AppIcon
                  platform={app.platform}
                  
                  fallbackUrl={app.icon}
                  title={app.title}
                  className="w-11 h-11 rounded-lg object-cover border border-zinc-700/50 bg-zinc-850 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-extrabold text-xs truncate group-hover:text-[var(--fluent-accent)] transition-colors">
                    {app.title}
                  </h4>
                  <p className="text-[10px] text-[var(--fluent-secondary)] truncate">
                    {app.publisher}
                  </p>
                  {app.sources && app.sources.length > 0 && (
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                        {app.sources?.[0]?.name || (app.platform === "gitee" ? "Gitee" : "GitHub")}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-[var(--fluent-secondary)] line-clamp-2 mt-1 leading-snug">
                    {app.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--fluent-border)] pt-2.5 mt-3 select-none">
                <div className="flex items-center gap-1 text-[10px] text-[var(--fluent-secondary)] font-bold">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[var(--fluent-text)] opacity-90">{app.rating}</span>
                </div>

                <div>
                  {isDownloaded(app.owner, app.repo) ? (
                    <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-0.5 rounded font-bold">
                      已安装
                    </span>
                  ) : isDownloading(app.owner, app.repo) ? (
                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded font-bold animate-pulse">
                      克隆中
                    </span>
                  ) : (
                    <button
                      onClick={(e) => triggerDownload(e, app)}
                      className="text-[9px] font-bold bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white px-3.5 py-1.5 rounded-lg cursor-pointer transition active:scale-98 shadow-sm"
                    >
                      下载
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fluent-style Pagination Component */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--fluent-border)] pt-5 select-none text-[10px] font-bold">
            <span className="text-[10px] text-[var(--fluent-secondary)] font-bold">
              显示第 {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredApps.length)} 项，共 {filteredApps.length} 个应用
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 border border-[var(--fluent-border)] bg-[var(--fluent-card)] text-white hover:bg-[rgba(128,128,128,0.08)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition text-[10px] font-extrabold"
              >
                上一页
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-7.5 h-7.5 rounded-lg transition font-black flex items-center justify-center cursor-pointer border text-[10px]",
                    currentPage === pageNum
                      ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)] text-white shadow"
                      : "border-[var(--fluent-border)] bg-[var(--fluent-card)] text-[var(--fluent-text)] hover:border-zinc-400"
                  )}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 border border-[var(--fluent-border)] bg-[var(--fluent-card)] text-white hover:bg-[rgba(128,128,128,0.08)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg cursor-pointer transition text-[10px] font-extrabold"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Spotlight row */}
      {apps.length > 10 && (
        <section className="px-8 mt-12 shrink-0">
          <div className="text-left mb-4 flex items-center justify-between select-none">
            <h3 className="text-base font-extrabold tracking-tight">精品开源工具 spotlight</h3>
          </div>
          <div className="flex gap-4.5 overflow-x-auto pb-4.5 custom-scrollbar">
            {apps.slice(8, 18).map((app, idx) => (
              <div
                key={idx}
                onClick={() => handleRepoClick(app)}
                className="min-w-[210px] max-w-[210px] p-4.5 border border-[var(--fluent-border)] bg-[var(--fluent-card)] rounded-xl hover:bg-[rgba(128,128,128,0.03)] transition shadow-sm text-left flex flex-col justify-between h-[120px] shrink-0 cursor-pointer relative group animate-fade-in"
              >
                <div className="flex gap-2.5">
                  <AppIcon
                    platform={app.platform}
                    
                    fallbackUrl={app.icon}
                    title={app.title}
                    className="w-8.5 h-8.5 rounded-lg object-cover bg-zinc-800 border border-zinc-700/50"
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-white truncate group-hover:text-[var(--fluent-accent)] transition-colors">
                      {app.title}
                    </h4>
                    <p className="text-[9px] text-[var(--fluent-secondary)] truncate mt-0.5">{app.publisher}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--fluent-border)] pt-2.5 text-[9px] select-none font-bold">
                  <span className="text-zinc-400 font-mono">{app.language}</span>
                  <div className="flex items-center gap-0.5 text-yellow-500">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{(app.rating ?? 5.0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rankings */}
      {rankingItems.length > 0 && (
        <section className="px-8 mt-10 shrink-0">
          <div className="text-left mb-4 select-none">
            <h3 className="text-base font-extrabold tracking-tight">热门免费应用排行榜</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-3">
              {rankingItems.slice(0, 5).map((item) => renderRankCard(item))}
            </div>
            <div className="space-y-3">
              {rankingItems.slice(5, 10).map((item) => renderRankCard(item))}
            </div>
            <div className="space-y-3">
              {rankingItems.slice(10, 15).map((item) => renderRankCard(item))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
