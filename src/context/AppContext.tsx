import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Database from "@tauri-apps/plugin-sql";

export interface DataSource {
  id: string;
  name: string;
  platform?: "github" | "gitee";
  apiEndpointMode: "public" | "enterprise";
  customEndpoint: string;
  apiVersion: string;
  token: string;
  addedAt: string;
}

export interface InstalledRepo {
  owner: string;
  repo: string;
  name: string; // usually owner/repo
  url: string;
  path: string;
  status: "completed" | "failed" | "cloning" | "downloading_zip" | "pulling";
  message: string;
  dateInstalled: string;
  description: string;
  primaryLanguage: string;
  stars: number;
}

export interface AssetDownload {
  url: string;
  filename: string;
  downloaded: number;
  total: number;
  percent: number;
  status: "downloading" | "completed" | "failed" | "cancelled";
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedRepo: any | null;
  setSelectedRepo: (repo: any | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  githubToken: string;
  setGithubToken: (token: string) => void;
  downloadDir: string;
  setDownloadDir: (dir: string) => void;
  gitInstalled: boolean;
  checkGit: () => Promise<boolean>;
  installedRepos: InstalledRepo[];
  installRepository: (owner: string, repo: string, stars: number, description: string, language: string, customUrl?: string) => Promise<void>;
  updateRepository: (repo: InstalledRepo) => Promise<void>;
  uninstallRepository: (repo: InstalledRepo) => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  openVSCode: (path: string) => Promise<void>;
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  
  // SQL data sources management
  dataSources: DataSource[];
  addDataSource: (source: DataSource) => Promise<void>;
  deleteDataSource: (id: string) => Promise<void>;

  // Binary asset downloads
  assetDownloads: Record<string, AssetDownload>;

  // Personalization settings
  theme: "auto" | "light" | "dark";
  setTheme: (theme: "auto" | "light" | "dark") => void;
  bgType: "none" | "preset" | "url" | "upload";
  setBgType: (type: "none" | "preset" | "url" | "upload") => void;
  bgPreset: string;
  setBgPreset: (preset: string) => void;
  bgUrl: string;
  setBgUrl: (url: string) => void;
  bgUpload: string;
  setBgUpload: (base64: string) => void;
  bgOpacity: number;
  setBgOpacity: (opacity: number) => void;
  bgBlur: number;
  setBgBlur: (blur: number) => void;

  // Mobile sidebar layout
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // Gitee token settings
  giteeToken: string;
  setGiteeToken: (token: string) => void;

  // Network sensing states
  preferredPlatform: "github" | "gitee";
  githubLatency: number | null;
  giteeLatency: number | null;
  detectPreferredPlatform: () => Promise<void>;
  isDetectingNetwork: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Database Reference
  const dbRef = useRef<Database | null>(null);
  
  // Settings State
  const [githubToken, setGithubTokenState] = useState<string>(
    localStorage.getItem("git_store_token") || ""
  );
  const [giteeToken, setGiteeTokenState] = useState<string>(
    localStorage.getItem("git_store_gitee_token") || ""
  );
  const [downloadDir, setDownloadDirState] = useState<string>(
    localStorage.getItem("git_store_download_dir") || ""
  );
  const [gitInstalled, setGitInstalled] = useState<boolean>(false);

  const setGiteeToken = (token: string) => {
    setGiteeTokenState(token);
    localStorage.setItem("git_store_gitee_token", token);
  };



  // Personalization settings State
  const [theme, setThemeState] = useState<"auto" | "light" | "dark">(
    (localStorage.getItem("git_store_theme") as "auto" | "light" | "dark") || "auto"
  );
  const [bgType, setBgTypeState] = useState<"none" | "preset" | "url" | "upload">(
    (localStorage.getItem("git_store_bg_type") as "none" | "preset" | "url" | "upload") || "none"
  );
  const [bgPreset, setBgPresetState] = useState<string>(
    localStorage.getItem("git_store_bg_preset") || "aurora"
  );
  const [bgUrl, setBgUrlState] = useState<string>(
    localStorage.getItem("git_store_bg_url") || ""
  );
  const [bgUpload, setBgUploadState] = useState<string>(
    localStorage.getItem("git_store_bg_upload") || ""
  );
  const [bgOpacity, setBgOpacityState] = useState<number>(() => {
    const val = localStorage.getItem("git_store_bg_opacity");
    return val !== null ? parseFloat(val) : 0.6;
  });
  const [bgBlur, setBgBlurState] = useState<number>(() => {
    const val = localStorage.getItem("git_store_bg_blur");
    return val !== null ? parseInt(val, 10) : 15;
  });

  const setTheme = (val: "auto" | "light" | "dark") => {
    setThemeState(val);
    localStorage.setItem("git_store_theme", val);
  };
  const setBgType = (val: "none" | "preset" | "url" | "upload") => {
    setBgTypeState(val);
    localStorage.setItem("git_store_bg_type", val);
  };
  const setBgPreset = (val: string) => {
    setBgPresetState(val);
    localStorage.setItem("git_store_bg_preset", val);
  };
  const setBgUrl = (val: string) => {
    setBgUrlState(val);
    localStorage.setItem("git_store_bg_url", val);
  };
  const setBgUpload = (val: string) => {
    setBgUploadState(val);
    localStorage.setItem("git_store_bg_upload", val);
  };
  const setBgOpacity = (val: number) => {
    setBgOpacityState(val);
    localStorage.setItem("git_store_bg_opacity", String(val));
  };
  const setBgBlur = (val: number) => {
    setBgBlurState(val);
    localStorage.setItem("git_store_bg_blur", String(val));
  };

  // Mobile layout state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [installedRepos, setInstalledRepos] = useState<InstalledRepo[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [assetDownloads, setAssetDownloads] = useState<Record<string, AssetDownload>>({});
  
  // Search History (retains in localStorage for quick access)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("git_store_search_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Network sensing States
  const [preferredPlatform, setPreferredPlatform] = useState<"github" | "gitee">(
    (localStorage.getItem("git_store_platform") as "github" | "gitee") || "github"
  );
  const [githubLatency, setGithubLatency] = useState<number | null>(null);
  const [giteeLatency, setGiteeLatency] = useState<number | null>(null);
  const [isDetectingNetwork, setIsDetectingNetwork] = useState<boolean>(false);

  const detectPreferredPlatform = async () => {
    setIsDetectingNetwork(true);
    
    // Measure GitHub latency
    let ghTime: number | null = null;
    try {
      const t0 = performance.now();
      await fetch("https://api.github.com", {
        method: "HEAD",
        mode: "no-cors",
        signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined
      });
      const t1 = performance.now();
      ghTime = Math.round(t1 - t0);
      setGithubLatency(ghTime);
    } catch (e) {
      setGithubLatency(null);
    }

    // Measure Gitee latency
    let gtTime: number | null = null;
    try {
      const t0 = performance.now();
      await fetch("https://gitee.com/api/v5/user", {
        method: "HEAD",
        mode: "no-cors",
        signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined
      });
      const t1 = performance.now();
      gtTime = Math.round(t1 - t0);
      setGiteeLatency(gtTime);
    } catch (e) {
      setGiteeLatency(null);
    }

    setIsDetectingNetwork(false);

    // Count configured active data source platforms
    const platforms = new Set(dataSources.map(ds => ds.platform || "github"));
    
    if (platforms.size === 1) {
      // Only one data source is configured
      const singlePlatform = Array.from(platforms)[0];
      setPreferredPlatform(singlePlatform);
      localStorage.setItem("git_store_platform", singlePlatform);
      return;
    }

    // Dynamic latency auto-routing (when both platforms are configured or default state)
    if (ghTime !== null && gtTime !== null) {
      if (gtTime < ghTime) {
        setPreferredPlatform("gitee");
        localStorage.setItem("git_store_platform", "gitee");
      } else {
        setPreferredPlatform("github");
        localStorage.setItem("git_store_platform", "github");
      }
    } else if (gtTime !== null) {
      setPreferredPlatform("gitee");
      localStorage.setItem("git_store_platform", "gitee");
    } else if (ghTime !== null) {
      setPreferredPlatform("github");
      localStorage.setItem("git_store_platform", "github");
    } else {
      setPreferredPlatform("gitee"); // Default Gitee for stability in China
      localStorage.setItem("git_store_platform", "gitee");
    }
  };

  // Run auto sensing diagnostics when data sources are loaded or modified
  useEffect(() => {
    if (dataSources.length > 0) {
      detectPreferredPlatform();
    }
  }, [dataSources]);

  const setGithubToken = (token: string) => {
    setGithubTokenState(token);
    localStorage.setItem("git_store_token", token);
  };

  const setDownloadDir = (dir: string) => {
    setDownloadDirState(dir);
    localStorage.setItem("git_store_download_dir", dir);
  };

  // SQLite database synchronization helpers
  const saveRepoToDb = async (repo: InstalledRepo) => {
    if (!dbRef.current) return;
    try {
      await dbRef.current.execute(
        `INSERT OR REPLACE INTO installed_repos (url, owner, repo, name, path, status, message, dateInstalled, description, primaryLanguage, stars) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [repo.url, repo.owner, repo.repo, repo.name, repo.path, repo.status, repo.message, repo.dateInstalled, repo.description, repo.primaryLanguage, repo.stars]
      );
    } catch (err) {
      console.error("Failed to save repository record to SQLite database:", err);
    }
  };

  const deleteRepoFromDb = async (url: string) => {
    if (!dbRef.current) return;
    try {
      await dbRef.current.execute("DELETE FROM installed_repos WHERE url = $1", [url]);
    } catch (err) {
      console.error("Failed to delete repository record from SQLite database:", err);
    }
  };

  // Initialize SQLite database connection and load records
  useEffect(() => {
    async function loadSqlDb() {
      try {
        const db = await Database.load("sqlite:openstore.db");
        dbRef.current = db;

        // 1. Create table installed_repos
        await db.execute(`
          CREATE TABLE IF NOT EXISTS installed_repos (
            url TEXT PRIMARY KEY,
            owner TEXT,
            repo TEXT,
            name TEXT,
            path TEXT,
            status TEXT,
            message TEXT,
            dateInstalled TEXT,
            description TEXT,
            primaryLanguage TEXT,
            stars INTEGER
          )
        `);

        // 2. Create table data_sources
        await db.execute(`
          CREATE TABLE IF NOT EXISTS data_sources (
            id TEXT PRIMARY KEY,
            name TEXT,
            apiEndpointMode TEXT,
            customEndpoint TEXT,
            apiVersion TEXT,
            token TEXT,
            addedAt TEXT,
            platform TEXT
          )
        `);

        // Migration: add platform column if not exists
        try {
          await db.execute("ALTER TABLE data_sources ADD COLUMN platform TEXT");
        } catch (e) {
          // column already exists, safe to ignore
        }

        // 3. Load installed repos
        const repos = await db.select<InstalledRepo[]>("SELECT * FROM installed_repos");
        if (repos.length > 0) {
          setInstalledRepos(repos);
        } else {
          // LocalStorage fallback migration
          const saved = localStorage.getItem("git_store_installed_repos");
          if (saved) {
            const list = JSON.parse(saved) as InstalledRepo[];
            for (const repo of list) {
              await db.execute(
                `INSERT OR REPLACE INTO installed_repos (url, owner, repo, name, path, status, message, dateInstalled, description, primaryLanguage, stars) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [repo.url, repo.owner, repo.repo, repo.name, repo.path, repo.status, repo.message, repo.dateInstalled, repo.description, repo.primaryLanguage, repo.stars]
              );
            }
            setInstalledRepos(list);
          }
        }

        // 4. Load data sources
        const sources = await db.select<DataSource[]>("SELECT * FROM data_sources");
        if (sources.length > 0) {
          setDataSources(sources);
        } else {
          // LocalStorage fallback migration
          const savedSources = localStorage.getItem("git_store_data_sources");
          if (savedSources) {
            const list = JSON.parse(savedSources) as DataSource[];
            for (const ds of list) {
              await db.execute(
                `INSERT OR REPLACE INTO data_sources (id, name, apiEndpointMode, customEndpoint, apiVersion, token, addedAt, platform) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [ds.id, ds.name, ds.apiEndpointMode, ds.customEndpoint, ds.apiVersion, ds.token, ds.addedAt, ds.platform || "github"]
              );
            }
            setDataSources(list);
          }
        }
      } catch (err) {
        console.error("Failed to initialize SQLite local database:", err);
      }
    }
    loadSqlDb();
  }, []);

  // Initial checks and Rust listeners
  useEffect(() => {
    checkGit();
    initDownloadDir();

    // Listen for progress events from Rust
    const unlistenPromise = listen("download-progress", (event: any) => {
      const payload = event.payload as { repo_url: string; status: string; message: string };
      console.log("Download progress:", payload);
      
      setInstalledRepos((prev) =>
        prev.map((item) => {
          if (item.url === payload.repo_url) {
            const updated = {
              ...item,
              status: payload.status as any,
              message: payload.message,
            };
            saveRepoToDb(updated); // Sync status change to SQL
            return updated;
          }
          return item;
        })
      );
    });

    // Listen for binary asset progress events
    const unlistenAssetPromise = listen("asset-download-progress", (event: any) => {
      const payload = event.payload as { url: string; downloaded: number; total: number; percent: number; status: string };
      setAssetDownloads((prev) => ({
        ...prev,
        [payload.url]: {
          url: payload.url,
          filename: payload.url.substring(payload.url.lastIndexOf('/') + 1) || "install_package",
          downloaded: payload.downloaded,
          total: payload.total,
          percent: payload.percent,
          status: payload.status as any,
        }
      }));
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      unlistenAssetPromise.then((unlisten) => unlisten());
    };
  }, []);

  const checkGit = async (): Promise<boolean> => {
    try {
      const installed = await invoke<boolean>("check_git_installed");
      setGitInstalled(installed);
      return installed;
    } catch (e) {
      console.error("Failed to check Git availability:", e);
      setGitInstalled(false);
      return false;
    }
  };

  const initDownloadDir = async () => {
    if (!downloadDir) {
      try {
        const defaultDir = await invoke<string>("get_default_download_dir");
        setDownloadDir(defaultDir);
      } catch (e) {
        console.error("Failed to get default download directory:", e);
      }
    }
  };

  const installRepository = async (
    owner: string,
    repo: string,
    stars: number,
    description: string,
    language: string,
    customUrl?: string
  ) => {
    const repoUrl = customUrl || `https://github.com/${owner}/${repo}`;
    
    const newRepo: InstalledRepo = {
      owner,
      repo,
      name: `${owner}/${repo}`,
      url: repoUrl,
      path: "",
      status: "cloning" as const,
      message: "正在准备下载...",
      dateInstalled: new Date().toLocaleDateString(),
      description,
      primaryLanguage: language || "Unknown",
      stars,
    };

    setInstalledRepos((prev) => {
      if (prev.some((r) => r.url === repoUrl)) return prev;
      saveRepoToDb(newRepo); // Initial save to SQL
      return [newRepo, ...prev];
    });

    try {
      const folderName = `${owner}_${repo}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
      
      let path = "";
      try {
        path = await invoke<string>("clone_repository", {
          repoUrl,
          targetDir: downloadDir,
          folderName,
          githubToken: githubToken || null,
          giteeToken: giteeToken || null,
          useZip: !gitInstalled,
        });
      } catch (firstErr) {
        console.warn("First clone attempt failed, trying fallback url...", firstErr);
        
        let backupUrl = "";
        if (repoUrl.includes("github.com")) {
          backupUrl = repoUrl.replace("github.com", "gitee.com");
        } else if (repoUrl.includes("gitee.com")) {
          backupUrl = repoUrl.replace("gitee.com", "github.com");
        }
        
        if (backupUrl && backupUrl !== repoUrl) {
          setInstalledRepos((prev) =>
            prev.map((item) => {
              if (item.url === repoUrl) {
                return {
                  ...item,
                  message: "原站拉取超时，正在尝试自动换源拉取..."
                };
              }
              return item;
            })
          );
          
          path = await invoke<string>("clone_repository", {
            repoUrl: backupUrl,
            targetDir: downloadDir,
            folderName,
            githubToken: githubToken || null,
            giteeToken: giteeToken || null,
            useZip: !gitInstalled,
          });
        } else {
          throw firstErr;
        }
      }

      setInstalledRepos((prev) =>
        prev.map((item) => {
          if (item.url === repoUrl) {
            const updated = {
              ...item,
              path,
              status: "completed" as const,
              message: "安装成功",
            };
            saveRepoToDb(updated); // Sync completed status to SQL
            return updated;
          }
          return item;
        })
      );
    } catch (err: any) {
      console.error("Clone failed:", err);
      setInstalledRepos((prev) =>
        prev.map((item) => {
          if (item.url === repoUrl) {
            const updated = {
              ...item,
              status: "failed" as const,
              message: typeof err === "string" ? err : JSON.stringify(err),
            };
            saveRepoToDb(updated); // Sync failed status to SQL
            return updated;
          }
          return item;
        })
      );
    }
  };

  const updateRepository = async (repoItem: InstalledRepo) => {
    setInstalledRepos((prev) =>
      prev.map((item) => {
        if (item.url === repoItem.url) {
          const updated = {
            ...item,
            status: "pulling" as const,
            message: "正在检查更新...",
          };
          saveRepoToDb(updated); // Sync check update status to SQL
          return updated;
        }
        return item;
      })
    );

    try {
      await invoke<string>("pull_repository", {
        repoPath: repoItem.path,
        repoUrl: repoItem.url,
        githubToken: githubToken || null,
        giteeToken: giteeToken || null,
      });

      setInstalledRepos((prev) =>
        prev.map((item) => {
          if (item.url === repoItem.url) {
            const updated = {
              ...item,
              status: "completed" as const,
              message: "更新已完成",
            };
            saveRepoToDb(updated); // Sync updated completed status to SQL
            return updated;
          }
          return item;
        })
      );
    } catch (err: any) {
      console.error("Update failed:", err);
      setInstalledRepos((prev) =>
        prev.map((item) => {
          if (item.url === repoItem.url) {
            const updated = {
              ...item,
              status: "failed" as const,
              message: typeof err === "string" ? err : JSON.stringify(err),
            };
            saveRepoToDb(updated); // Sync updated failed status to SQL
            return updated;
          }
          return item;
        })
      );
    }
  };

  const uninstallRepository = async (repoItem: InstalledRepo) => {
    try {
      if (repoItem.path) {
        await invoke("uninstall_repository", { repoPath: repoItem.path });
      }
      
      setInstalledRepos((prev) => prev.filter((item) => item.url !== repoItem.url));
      deleteRepoFromDb(repoItem.url); // Remove from SQL
    } catch (e) {
      console.error("Failed to uninstall:", e);
      alert("卸载失败: " + e);
    }
  };

  const openFolder = async (path: string) => {
    try {
      await invoke("open_in_explorer", { path });
    } catch (e) {
      console.error("Failed to open explorer:", e);
    }
  };

  const openVSCode = async (path: string) => {
    try {
      await invoke("open_in_vscode", { path });
    } catch (e) {
      console.error("Failed to launch VS Code:", e);
      alert("无法启动 VS Code，请确保 code 命令已添加到 PATH 中。");
    }
  };

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((q) => q !== query);
      const next = [query, ...filtered].slice(0, 10);
      localStorage.setItem("git_store_search_history", JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("git_store_search_history");
  };

  // SQL data sources operations
  const addDataSource = async (source: DataSource) => {
    setDataSources((prev) => {
      const filtered = prev.filter((s) => s.id !== source.id);
      const updated = [...filtered, source];
      localStorage.setItem("git_store_data_sources", JSON.stringify(updated));
      return updated;
    });

    if (dbRef.current) {
      try {
        await dbRef.current.execute(
          `INSERT OR REPLACE INTO data_sources (id, name, apiEndpointMode, customEndpoint, apiVersion, token, addedAt, platform) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [source.id, source.name, source.apiEndpointMode, source.customEndpoint, source.apiVersion, source.token, source.addedAt, source.platform || "github"]
        );
      } catch (err) {
        console.error("Failed to add data source to SQLite database:", err);
      }
    }
  };

  const deleteDataSource = async (id: string) => {
    setDataSources((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem("git_store_data_sources", JSON.stringify(updated));
      return updated;
    });

    if (dbRef.current) {
      try {
        await dbRef.current.execute("DELETE FROM data_sources WHERE id = $1", [id]);
      } catch (err) {
        console.error("Failed to delete data source from SQLite database:", err);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedRepo,
        setSelectedRepo,
        searchQuery,
        setSearchQuery,
        githubToken,
        setGithubToken,
        downloadDir,
        setDownloadDir,
        gitInstalled,
        checkGit,
        installedRepos,
        installRepository,
        updateRepository,
        uninstallRepository,
        openFolder,
        openVSCode,
        searchHistory,
        addToHistory,
        clearHistory,
        dataSources,
        addDataSource,
        deleteDataSource,
        assetDownloads,
        theme,
        setTheme,
        bgType,
        setBgType,
        bgPreset,
        setBgPreset,
        bgUrl,
        setBgUrl,
        bgUpload,
        setBgUpload,
        bgOpacity,
        setBgOpacity,
        bgBlur,
        setBgBlur,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        giteeToken,
        setGiteeToken,
        preferredPlatform,
        githubLatency,
        giteeLatency,
        detectPreferredPlatform,
        isDetectingNetwork,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
