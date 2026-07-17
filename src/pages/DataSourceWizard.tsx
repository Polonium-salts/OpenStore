import { useState, useEffect } from "react";
import { useApp, DataSource } from "@/context/AppContext";
import { CheckCircle2, Terminal, AlertTriangle, Key, Globe, Cpu, Plus, Trash, ArrowLeft, Edit, Package, Archive, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";

// Custom SVG GitHub Icon
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function GiteeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      {...props}
    >
      <path d="M11.985 2C6.47 2 2 6.47 2 12s4.47 10 9.985 10C17.52 22 22 17.52 22 12s-4.48-10-10.015-10zm4.5 13.929h-3.328c-.46 0-.832-.375-.832-.838V12.16c0-.463.372-.838.832-.838h3.328c.46 0 .832.375.832.838v2.93c0 .466-.372.839-.832.839zm-5.767 0H7.39c-.46 0-.832-.375-.832-.838V8.924c0-.463.372-.838.832-.838h8.228c.46 0 .832.375.832.838v1.396c0 .463-.372.838-.832.838H7.39c-.46 0-.832.375-.832.838v2.095c0 .463.372.838.832.838h3.328c.46 0 .832.375.832.838v.838c0 .463-.372.838-.832.838z" />
    </svg>
  );
}



export default function DataSourceWizard() {
  const { githubToken, setGithubToken, giteeToken, setGiteeToken, dataSources, addDataSource, deleteDataSource, toggleDataSourceEnabled } = useApp();

  // Navigation state: 'list' | 'add' | 'edit'
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceAddedAt, setEditingSourceAddedAt] = useState<string>("");
  const [customName, setCustomName] = useState("");

  // Wizard Flow States (active when view === 'add')
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [apiEndpointMode, setApiEndpointMode] = useState<"public" | "enterprise">("public");
  const [customEndpoint, setCustomEndpoint] = useState("https://gitee.com/api/v5");
  const [apiVersion, setApiVersion] = useState("2026-03-10");
  const [tokenInput, setTokenInput] = useState("");
  const [zipPath, setZipPath] = useState("");
  const [gitUrl, setGitUrl] = useState("");


  const handleZipFileBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: "ZIP Archives",
          extensions: ["zip"]
        }]
      });
      if (selected && typeof selected === "string") {
        setZipPath(selected);
        if (!customName.trim()) {
          const fileName = selected.split(/[/\\]/).pop() || "";
          setCustomName(`本地 ZIP 数据源: ${fileName.replace(/\.zip$/i, "")}`);
        }
      }
    } catch (err) {
      console.error("打开文件对话框失败:", err);
    }
  };

  // Connection diagnostics states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [rateLimit, setRateLimit] = useState<{ limit: number; remaining: number } | null>(null);

  // Active testing ID in list view
  const [listTestingId, setListTestingId] = useState<string | null>(null);
  const [listTestResults, setListTestResults] = useState<Record<string, "success" | "error" | "idle">>({});

  // Sync token if context updates
  useEffect(() => {
    setTokenInput(githubToken);
  }, [githubToken]);

  // If public source is already added, auto-select enterprise mode
  useEffect(() => {
    if (selectedType) {
      const publicExists = dataSources.some(
        (s) => s.platform === selectedType && s.apiEndpointMode === "public"
      );
      if (publicExists) {
        setApiEndpointMode("enterprise");
      } else {
        setApiEndpointMode("public");
      }
    }
  }, [selectedType, dataSources]);

  const handleSelectType = (id: string) => {
    setSelectedType(id);
    if (id === "winget") {
      setCustomEndpoint("local-winget-cli");
      setApiEndpointMode("public");
    } else if (id === "gitee") {
      setCustomEndpoint("https://gitee.com/api/v5");
    } else if (id === "zip") {
      setCustomEndpoint("");
      setApiEndpointMode("public");
    } else if (id === "git_link") {
      setCustomEndpoint("");
      setApiEndpointMode("public");
    } else {
      setCustomEndpoint("https://api.github.com");
    }
  };

  const handleStartEdit = (source: DataSource) => {
    setEditingSourceId(source.id);
    setEditingSourceAddedAt(source.addedAt);
    setCustomName(source.name);
    setSelectedType(source.platform || "github");
    setApiEndpointMode(source.apiEndpointMode);
    setCustomEndpoint(source.customEndpoint);
    setApiVersion(source.apiVersion);
    setTokenInput(source.token);

    if (source.platform === "zip") {
      setZipPath(source.customEndpoint);
    } else if (source.platform === "git_link") {
      setGitUrl(source.customEndpoint);
    }
    
    setTestResult("idle");
    setErrorMessage("");
    setGithubUser(null);
    setRateLimit(null);
    
    setView("edit");
  };

  const handleSaveChanges = () => {
    if (editingSourceId) {
      let resolvedEndpoint = customEndpoint.trim();
      if (selectedType === "zip") {
        resolvedEndpoint = zipPath.trim();
      } else if (selectedType === "git_link") {
        resolvedEndpoint = gitUrl.trim();
      } else if (apiEndpointMode === "public") {
        resolvedEndpoint = selectedType === "gitee" ? "https://gitee.com/api/v5" : "https://api.github.com";
      }

      const updatedSource: DataSource = {
        id: editingSourceId,
        name: customName.trim() || (selectedType === "zip"
          ? "本地 ZIP 软件源"
          : (selectedType === "git_link" ? "通用 Git 软件源" : (apiEndpointMode === "public"
            ? (selectedType === "gitee" ? "Gitee 公网数据源" : "GitHub 公网数据源")
            : (selectedType === "gitee" ? "Gitee 企业版数据源" : "GitHub 企业版数据源")))),
        platform: selectedType as "openstore_api" | "github" | "gitee" | "zip" | "git_link",
        apiEndpointMode,
        customEndpoint: resolvedEndpoint,
        apiVersion: selectedType === "gitee" ? "v5" : apiVersion,
        token: tokenInput.trim(),
        addedAt: editingSourceAddedAt || new Date().toLocaleDateString()
      };

      addDataSource(updatedSource);
      setView("list");
      setEditingSourceId(null);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedType) {
      setStep(2);
    } else if (step === 2) {
      // Add source to list
      const newSource: DataSource = {
        id: `source_${Date.now()}`,
        name: customName.trim() || (selectedType === "zip"
          ? "本地 ZIP 软件源"
          : (selectedType === "git_link" ? "通用 Git 软件源" : (apiEndpointMode === "public"
            ? (selectedType === "gitee" ? "Gitee 公网数据源" : "GitHub 公网数据源")
            : (selectedType === "gitee" ? "Gitee 企业版数据源" : "GitHub 企业版数据源")))),
        platform: selectedType as "openstore_api" | "github" | "gitee" | "zip" | "git_link",
        apiEndpointMode,
        customEndpoint: selectedType === "zip"
          ? zipPath.trim()
          : (selectedType === "git_link" ? gitUrl.trim() : customEndpoint.trim()),
        apiVersion: selectedType === "gitee" ? "v5" : apiVersion,
        token: tokenInput.trim(),
        addedAt: new Date().toLocaleDateString()
      };

      addDataSource(newSource);

      // Set as active Token in global context
      if (tokenInput.trim()) {
        if (selectedType === "gitee") {
          setGiteeToken(tokenInput.trim());
          localStorage.setItem("git_store_gitee_token", tokenInput.trim());
        } else {
          setGithubToken(tokenInput.trim());
          localStorage.setItem("git_store_token", tokenInput.trim());
        }
      }

      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setTestResult("idle");
      setGithubUser(null);
      setRateLimit(null);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult("idle");
    setErrorMessage("");
    setGithubUser(null);
    setRateLimit(null);

    if (selectedType === "zip" || selectedType === "git_link") {
      setTestResult("success");
      setTestingConnection(false);
      return;
    }

    if (selectedType === "openstore_api") {
      const endpoint = customEndpoint.trim();
      if (!endpoint) {
        setTestResult("error");
        setErrorMessage("API 端点不可为空");
        setTestingConnection(false);
        return;
      }
      try {
        const res = await fetch(`${endpoint}/api/apps/vscode`);
        if (res.ok) {
          setTestResult("success");
          setGithubUser("自定义 OpenStore API 连接成功");
        } else {
          setTestResult("error");
          setErrorMessage(`API 连接失败: ${res.status}`);
        }
      } catch (err: any) {
        setTestResult("error");
        setErrorMessage(err.message || "请求失败");
      }
      setTestingConnection(false);
      return;
    }

    if (selectedType === "zip") {
      if (!zipPath.trim()) {
        setTestResult("error");
        setErrorMessage("ZIP 路径不能为空");
        setTestingConnection(false);
        return;
      }
      if (!zipPath.toLowerCase().endsWith(".zip")) {
        setTestResult("error");
        setErrorMessage("文件格式必须为 .zip 后缀");
        setTestingConnection(false);
        return;
      }
      try {
        const { readZipSourceMeta } = await import("@/lib/zipSourceLoader");
        const meta = await readZipSourceMeta(zipPath.trim());
        setTestResult("success");
        setGithubUser(`验证成功: ${meta.name} ${meta.version ? `(v${meta.version})` : ""}`);
      } catch (err: any) {
        setTestResult("error");
        setErrorMessage(err.message || "无法读取 ZIP 源文件或解析 source.json 失败");
      }
      setTestingConnection(false);
      return;
    }

    if (selectedType === "git_link") {
      if (!gitUrl.trim()) {
        setTestResult("error");
        setErrorMessage("Git 链接不能为空");
        setTestingConnection(false);
        return;
      }
      if (!gitUrl.startsWith("http://") && !gitUrl.startsWith("https://") && !gitUrl.startsWith("git@")) {
        setTestResult("error");
        setErrorMessage("无效的 Git 克隆地址，应为 http/https 协议或 git@ 开头");
        setTestingConnection(false);
        return;
      }
      setTestResult("success");
      setGithubUser("Git 链接校验通过");
      setTestingConnection(false);
      return;
    }

    const isGitee = selectedType === "gitee";
    const baseEndpoint = isGitee
      ? (apiEndpointMode === "public" ? "https://gitee.com/api/v5" : customEndpoint.trim())
      : (apiEndpointMode === "public" ? "https://api.github.com" : customEndpoint.trim());

    const hasToken = tokenInput.trim() !== "";
    const requestUrl = hasToken
      ? `${baseEndpoint}/user`
      : (isGitee ? "https://gitee.com/api/v5/repos/chunge16/git-app-store/subscribers" : "https://api.github.com");

    try {
      const headers: Record<string, string> = {
        Accept: isGitee ? "application/json" : "application/vnd.github.v3+json",
      };
      if (!isGitee) {
        headers["X-GitHub-Api-Version"] = apiVersion;
      }

      let finalRequestUrl = requestUrl;
      if (isGitee && hasToken) {
        finalRequestUrl += `${requestUrl.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(tokenInput.trim())}`;
      } else if (hasToken) {
        headers.Authorization = `Bearer ${tokenInput.trim()}`;
      }

      const res = await fetch(finalRequestUrl, { headers });

      if (!isGitee) {
        const limitHeader = res.headers.get("x-ratelimit-limit");
        const remainingHeader = res.headers.get("x-ratelimit-remaining");
        if (limitHeader && remainingHeader) {
          setRateLimit({
            limit: parseInt(limitHeader, 10),
            remaining: parseInt(remainingHeader, 10),
          });
        }
      }

      const isReachable = res.ok || res.status === 401 || res.status === 403;
      if (isReachable) {
        if (hasToken && res.ok) {
          const data = await res.json();
          setGithubUser(data.login || data.name);
        } else {
          setGithubUser(isGitee ? "Gitee 联通就绪" : "GitHub 联通就绪");
        }
        setTestResult("success");
      } else {
        throw new Error(`API 诊断失败 (状态码: ${res.status})`);
      }
    } catch (err: any) {
      setTestResult("error");
      setErrorMessage(err.message || `请求超时，无法连接至 ${isGitee ? "Gitee" : "GitHub"}。`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestListSource = async (source: DataSource) => {
    setListTestingId(source.id);
    setListTestResults((prev) => ({ ...prev, [source.id]: "idle" }));

    if (source.platform === "zip") {
      try {
        const { readZipSourceMeta } = await import("@/lib/zipSourceLoader");
        await readZipSourceMeta(source.customEndpoint.trim());
        setListTestResults((prev) => ({ ...prev, [source.id]: "success" }));
      } catch (err) {
        setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
      }
      setListTestingId(null);
      return;
    }

    if (source.platform === "openstore_api") {
      const endpoint = source.customEndpoint.trim();
      if (!endpoint) {
        setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
        setListTestingId(null);
        return;
      }
      try {
        const res = await fetch(`${endpoint}/api/apps/vscode`);
        if (res.ok) {
          setListTestResults((prev) => ({ ...prev, [source.id]: "success" }));
        } else {
          setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
        }
      } catch (err: any) {
        setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
      }
      setListTestingId(null);
      return;
    }
    if (source.platform === "git_link") {
      const isUrlValid = source.customEndpoint.startsWith("http://") || source.customEndpoint.startsWith("https://") || source.customEndpoint.startsWith("git@");
      setListTestResults((prev) => ({ ...prev, [source.id]: isUrlValid ? "success" : "error" }));
      setListTestingId(null);
      return;
    }

    const isGitee = source.platform === "gitee";
    const baseEndpoint = isGitee
      ? (source.apiEndpointMode === "public" ? "https://gitee.com/api/v5" : source.customEndpoint.trim())
      : (source.apiEndpointMode === "public" ? "https://api.github.com" : source.customEndpoint.trim());

    const hasToken = source.token && source.token.trim() !== "";
    const requestUrl = hasToken
      ? `${baseEndpoint}/user`
      : (isGitee ? "https://gitee.com/api/v5/repos/chunge16/git-app-store/subscribers" : "https://api.github.com");

    try {
      const headers: Record<string, string> = {
        Accept: isGitee ? "application/json" : "application/vnd.github.v3+json",
      };
      if (!isGitee) {
        headers["X-GitHub-Api-Version"] = source.apiVersion;
      }

      let finalRequestUrl = requestUrl;
      if (isGitee && hasToken) {
        finalRequestUrl += `${requestUrl.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(source.token.trim())}`;
      } else if (hasToken) {
        headers.Authorization = `Bearer ${source.token.trim()}`;
      }

      const res = await fetch(finalRequestUrl, { headers });
      const isReachable = res.ok || res.status === 401 || res.status === 403;
      if (isReachable) {
        setListTestResults((prev) => ({ ...prev, [source.id]: "success" }));
      } else {
        setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
      }
    } catch (err) {
      setListTestResults((prev) => ({ ...prev, [source.id]: "error" }));
    } finally {
      setListTestingId(null);
    }
  };

  const handleActivateSource = (source: DataSource) => {
    toggleDataSourceEnabled(source.id, true);
  };

  const handleDeactivateSource = (source: DataSource) => {
    toggleDataSourceEnabled(source.id, false);
  };

  const handleDeleteSource = (id: string) => {
    if (confirm("确定要删除此数据源配置吗？")) {
      const deleted = dataSources.find((s) => s.id === id);
      deleteDataSource(id);

      if (deleted) {
        if (deleted.platform === "gitee" && deleted.token === giteeToken) {
          setGiteeToken("");
          localStorage.removeItem("git_store_gitee_token");
          localStorage.removeItem("git_store_gitee_api_mode");
          localStorage.removeItem("git_store_gitee_custom_endpoint");
        } else if (deleted.platform !== "gitee" && deleted.token === githubToken) {
          setGithubToken("");
          localStorage.removeItem("git_store_token");
          localStorage.removeItem("git_store_api_mode");
          localStorage.removeItem("git_store_custom_endpoint");
          localStorage.removeItem("git_store_api_version");
        }
      }
    }
  };

  const handleUseCustomToken = (source: DataSource) => {
    setSelectedType(source.platform || "github");
    setStep(2);
    setView("add");
  };

  const handleFinish = () => {
    setView("list");
    setStep(1);
    setSelectedType(null);
    setTestResult("idle");
    setGithubUser(null);
    setRateLimit(null);
  };

  // Rendering view: List of data sources
  const renderListView = () => {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header Action Row */}
        <div className="flex items-center justify-between mb-6 shrink-0 text-left select-none">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">数据源管理</h2>
            <p className="text-xs text-[var(--fluent-secondary)] mt-1">
              查看并维护已挂载至软件仓库底座的 GitHub REST API 依赖源凭据。
            </p>
          </div>
          <button
            onClick={() => setView("add")}
            className="bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>添加数据源</span>
          </button>
        </div>

        <hr className="border-[var(--fluent-border)] mb-6 shrink-0" />

        {/* Empty State */}
        {dataSources.length === 0 ? (
          <div className="flex-1 border border-dashed border-[var(--fluent-border)] rounded-2xl flex flex-col items-center justify-center py-16 text-center select-none bg-[rgba(128,128,128,0.01)]">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-[var(--fluent-secondary)] mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">暂未配置任何数据源</h4>
            <p className="text-xs text-[var(--fluent-secondary)] max-w-xs mt-2 leading-relaxed">
              需要至少接入一个 GitHub 数据源才能够拉取软件库星标、README 描述以及克隆代码包。
            </p>
            <button
              onClick={() => setView("add")}
              className="mt-5 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition"
            >
              配置数据源
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((source) => {
              const testStatus = listTestResults[source.id] || "idle";
              const isTesting = listTestingId === source.id;
              // source.enabled is always boolean here (from AppContext.useMemo), but guard against undefined
              const active = source.enabled !== false;

              return (
                <div
                  key={source.id}
                  className={cn(
                    "p-5 border bg-[var(--fluent-card)] rounded-xl flex flex-col justify-between hover:bg-[rgba(128,128,128,0.02)] transition shadow-sm text-left relative min-h-[165px]",
                    active ? "border-[rgba(0,120,212,0.45)] ring-1 ring-[rgba(0,120,212,0.15)]" : "border-[var(--fluent-border)]"
                  )}
                >
                  <div className="flex gap-4">
                    <div className="p-2.5 rounded-lg bg-zinc-800/60 shrink-0 text-white flex items-center justify-center">
                       {source.platform === "zip" ? (<Archive className="w-8 h-8 text-yellow-500 opacity-80" />) :
                       source.platform === "git_link" ? (<GitFork className="w-8 h-8 text-emerald-500 opacity-80" />) :
                       (source.platform === "gitee" ? (
                         <GiteeIcon className="w-5 h-5 text-red-500" />
                       ) : (
                         <GithubIcon className="w-8 h-8 text-white opacity-80" />
                       ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-white truncate">{source.name}</h4>
                        {/* Status active dot */}
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            active ? "bg-green-500 shadow shadow-green-500/30 animate-pulse" : "bg-zinc-650"
                          )}
                          title={active ? "启用中" : "未启用"}
                        />
                        {active && (
                          <span className="text-[8px] bg-[var(--fluent-accent)]/20 border border-[var(--fluent-accent)]/30 text-[var(--fluent-accent)] px-1.5 py-0.5 rounded font-black select-none uppercase tracking-wide">
                            活动数据源
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--fluent-secondary)] mt-1 truncate">
                        端点: <span className="font-mono text-zinc-400">
                          {source.platform === "zip" ? `本地 ZIP 文件: ${source.customEndpoint}` :
                           source.platform === "git_link" ? `Git 克隆链接: ${source.customEndpoint}` :
                           source.apiEndpointMode === "public" ? (source.platform === "gitee" ? "Gitee 公网 API" : "GitHub 公网 API") : 
                           source.customEndpoint}
                        </span>
                      </p>
                      {source.platform !== "gitee" && source.platform !== "zip" && source.platform !== "git_link" && (
                        <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
                          版本: <span className="font-mono text-zinc-400">{source.apiVersion}</span>
                        </p>
                      )}
                      {source.platform !== "zip" && source.platform !== "git_link" && (
                        <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
                          密钥: <span className="font-mono text-zinc-500">
                            {source.token
                              ? `${source.platform === "gitee" ? "access" : "ghp"}_••••••••${source.token.slice(-4)}`
                              : "匿名访问 (无令牌 - 存在频次限制)"}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/10 dark:border-zinc-800/30 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[9px] text-[var(--fluent-secondary)] opacity-60">
                      创建时间: {source.addedAt}
                    </span>

                    <div className="flex items-center gap-2 select-none">
                      {/* Enable / Disable toggle button */}
                      {!active ? (
                        <button
                          onClick={() => handleActivateSource(source)}
                          className="px-2.5 py-1 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white rounded-lg cursor-pointer transition"
                        >
                          启用
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateSource(source)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer transition"
                        >
                          禁用
                        </button>
                      )}

                      <button
                        onClick={() => handleTestListSource(source)}
                        disabled={isTesting}
                        className={cn(
                          "px-2.5 py-1 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] rounded-lg flex items-center gap-1.5 cursor-pointer transition select-none disabled:opacity-50",
                          testStatus === "success" && "border-green-500/20 text-green-500",
                          testStatus === "error" && "border-red-500/20 text-red-500"
                        )}
                        title="诊断此连接"
                      >
                        <Terminal className={cn("w-3.5 h-3.5", isTesting && "animate-spin")} />
                        <span>
                          {isTesting ? "诊断中..." : testStatus === "success" ? "已达" : testStatus === "error" ? "异常" : "测试"}
                        </span>
                      </button>

                      {source.id.startsWith("builtin_") ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUseCustomToken(source)}
                            className="px-2.5 py-1 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition select-none text-[9px]"
                            title="配置自定义 API 令牌"
                          >
                            使用自定义API令牌
                          </button>
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/50 rounded-lg text-[9px] font-bold select-none cursor-default">
                            系统内置
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(source)}
                            className="p-1 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] text-zinc-300 rounded-lg cursor-pointer transition"
                            title="修改此数据源配置"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSource(source.id)}
                            className="p-1 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer transition"
                            title="移除此数据源"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Rendering view: Add Wizard flow
  const renderStep1 = () => {
    const isGithubSelected = selectedType === "github";
    const isGiteeSelected = selectedType === "gitee";
    return (
      <div className="space-y-6 flex-1 text-left">
        <div className="text-left shrink-0">
          <h3 className="text-sm font-bold text-white">请选择您的数据源类型</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {/* GitHub Card */}
          <div
            onClick={() => handleSelectType("github")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[150px] text-left shadow-sm relative",
              isGithubSelected
                ? "border-[var(--fluent-accent)] ring-1 ring-[var(--fluent-accent)]"
                : "border-[var(--fluent-border)]"
            )}
          >
            <div className="flex gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800/50 shrink-0 text-white flex items-center justify-center">
                <GithubIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white">GitHub REST API 数据源</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] mt-1.5 leading-snug">
                  对接 GitHub API。支持设置自定义企业版 API 端点、指定 API 版本标头以及过滤特定开发分支的仓库资源。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-800/10 dark:border-zinc-800/30 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("github");
                }}
                className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded transition select-none cursor-pointer",
                  isGithubSelected
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {isGithubSelected ? "已选择" : "选择"}
              </button>
            </div>
          </div>

          {/* Gitee Card */}
          <div
            onClick={() => handleSelectType("gitee")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[150px] text-left shadow-sm relative",
              isGiteeSelected
                ? "border-[var(--fluent-accent)] ring-1 ring-[var(--fluent-accent)]"
                : "border-[var(--fluent-border)]"
            )}
          >
            <div className="flex gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800/50 shrink-0 text-white flex items-center justify-center">
                <GiteeIcon className="w-6 h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white">Gitee (码云) API 数据源</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] mt-1.5 leading-snug">
                  对接 Gitee 开放平台 API。支持添加 Gitee 公网和企业版端点，在大陆地区具备低延迟和极速克隆/ZIP 下载的天然优势。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-800/10 dark:border-zinc-800/30 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("gitee");
                }}
                className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded transition select-none cursor-pointer",
                  isGiteeSelected
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {isGiteeSelected ? "已选择" : "选择"}
              </button>
            </div>
          </div>
        


          {/* ZIP Card */}
          <div
            onClick={() => handleSelectType("zip")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[150px] text-left shadow-sm relative",
              selectedType === "zip"
                ? "border-[var(--fluent-accent)] ring-1 ring-[var(--fluent-accent)]"
                : "border-[var(--fluent-border)]"
            )}
          >
            <div className="flex gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800/50 shrink-0 text-white flex items-center justify-center">
                <Archive className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white">本地 ZIP 压缩包数据源</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] mt-1.5 leading-snug">
                  选择并导入本地的软件清单 ZIP 归档文件，从本地磁盘直接离线解析并渲染应用列表。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-800/10 dark:border-zinc-800/30 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("zip");
                }}
                className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded transition select-none cursor-pointer",
                  selectedType === "zip"
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {selectedType === "zip" ? "已选择" : "选择"}
              </button>
            </div>
          </div>

          {/* OpenStore API Card */}
          <div
            onClick={() => handleSelectType("openstore_api")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[150px] text-left shadow-sm relative",
              selectedType === "openstore_api"
                ? "border-[var(--fluent-accent)] ring-1 ring-[var(--fluent-accent)]"
                : "border-[var(--fluent-border)]"
            )}
          >
            <div className="flex gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800/50 shrink-0 text-white flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white">通用 OpenStore API</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] mt-1.5 leading-snug">
                  对接任何符合 OpenStore 标准接口协议的自定义网关或服务器，获取扁平化、强类型标准结构的软件资源。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-800/10 dark:border-zinc-800/30 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("openstore_api");
                }}
                className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded transition select-none cursor-pointer",
                  selectedType === "openstore_api"
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {selectedType === "openstore_api" ? "已选择" : "选择"}
              </button>
            </div>
          </div>

          {/* Git Link Card */}
          <div
            onClick={() => handleSelectType("git_link")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[150px] text-left shadow-sm relative",
              selectedType === "git_link"
                ? "border-[var(--fluent-accent)] ring-1 ring-[var(--fluent-accent)]"
                : "border-[var(--fluent-border)]"
            )}
          >
            <div className="flex gap-4">
              <div className="p-2.5 rounded-lg bg-zinc-800/50 shrink-0 text-white flex items-center justify-center">
                <GitFork className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white">Git 仓库链接数据源</h4>
                <p className="text-[10px] text-[var(--fluent-secondary)] mt-1.5 leading-snug">
                  直接输入通用的 Git 仓库链接（支持 HTTPS 协议），拉取指定 Git 仓内的清单数据并克隆仓库。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-800/10 dark:border-zinc-800/30 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectType("git_link");
                }}
                className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded transition select-none cursor-pointer",
                  selectedType === "git_link"
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {selectedType === "git_link" ? "已选择" : "选择"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    if (selectedType === "zip") {
      return (
        <div className="space-y-6 flex-1 max-w-2xl mx-auto text-left animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-white">配置本地 ZIP 压缩包数据源</h3>
            <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
              请指定本地软件清单的 `.zip` 文件路径。应用将直接解压并从中加载应用列表。
            </p>
          </div>

          <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] p-6 rounded-xl space-y-4 shadow-sm">
            <div className="space-y-4">
              {/* Custom Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase">
                  数据源自定义名称
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="如: 我的离线 ZIP 源"
                  className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                />
              </div>

              {/* File input / Path input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase">
                  ZIP 文件路径 (或选择本地 ZIP 文件)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={zipPath}
                    onChange={(e) => setZipPath(e.target.value)}
                    placeholder="例如: C:/Users/Documents/source.zip"
                    className="flex-1 bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleZipFileBrowse}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--fluent-border)] cursor-pointer flex items-center justify-center shrink-0 select-none"
                  >
                    浏览文件
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostics */}
            <div className="pt-3 border-t border-[var(--fluent-border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-1.5 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none disabled:opacity-50 shrink-0"
              >
                <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
                <span>{testingConnection ? "正在验证文件..." : "验证文件合法性"}</span>
              </button>

              {testResult === "success" && (
                <span className="text-xs text-green-500 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  文件验证通过
                </span>
              )}

              {testResult === "error" && (
                <span className="text-xs text-red-500 font-bold flex items-center gap-1 animate-fade-in" title={errorMessage}>
                  <AlertTriangle className="w-4 h-4" />
                  验证失败: {errorMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (selectedType === "git_link") {
      return (
        <div className="space-y-6 flex-1 max-w-2xl mx-auto text-left animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-white">配置 Git 仓库链接数据源</h3>
            <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
              填写以 HTTPS 开头的通用 Git 仓库克隆地址，支持配置私有仓访问令牌。
            </p>
          </div>

          <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] p-6 rounded-xl space-y-4 shadow-sm">
            <div className="space-y-4">
              {/* Custom Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase">
                  数据源自定义名称
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="如: 通用 Git 软件源"
                  className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                />
              </div>

              {/* Git URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase">
                  Git 克隆链接 (Git Clone HTTPS URL)
                </label>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => {
                    setGitUrl(e.target.value);
                    if (!customName.trim()) {
                      try {
                        const repoName = e.target.value.split("/").pop()?.replace(/\.git$/i, "") || "";
                        if (repoName) setCustomName(`Git 源: ${repoName}`);
                      } catch (_) {}
                    }
                  }}
                  placeholder="如: https://github.com/username/my-apps.git"
                  className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Private Token */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-yellow-500" />
                  <span>访问凭证 (Token) / 可选</span>
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="私有仓库的个人访问令牌 (PAT / Access Token)"
                  className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Diagnostics */}
            <div className="pt-3 border-t border-[var(--fluent-border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-1.5 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none disabled:opacity-50 shrink-0"
              >
                <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
                <span>{testingConnection ? "正在验证链接..." : "测试克隆链接"}</span>
              </button>

              {testResult === "success" && (
                <span className="text-xs text-green-500 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  链接验证成功
                </span>
              )}

              {testResult === "error" && (
                <span className="text-xs text-red-500 font-bold flex items-center gap-1 animate-fade-in" title={errorMessage}>
                  <AlertTriangle className="w-4 h-4" />
                  验证失败: {errorMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    const isGitee = selectedType === "gitee";
    return (
      <div className="space-y-6 flex-1 max-w-2xl mx-auto text-left">
        <div>
          <h3 className="text-sm font-bold text-white">配置 {isGitee ? "Gitee" : "GitHub"} REST API 数据源</h3>
          <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
            根据 {isGitee ? "Gitee" : "GitHub"} 开发文档，请指定您的连接服务器类型、API 版本以及相应的安全令牌。
          </p>
        </div>

        <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] p-6 rounded-xl space-y-4 shadow-sm">
          <div className="space-y-4">

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>API 服务端点类型 (API Endpoint Type)</span>
              </label>
              {(() => {
                const publicAlreadyAdded = dataSources.some(
                  (s) => s.platform === selectedType && s.apiEndpointMode === "public"
                );
                return (
                  <div className={cn(
                    "grid gap-2.5 pt-1",
                    publicAlreadyAdded ? "grid-cols-1" : "grid-cols-2"
                  )}>
                    {!publicAlreadyAdded && (
                      <button
                        type="button"
                        onClick={() => setApiEndpointMode("public")}
                        className={cn(
                          "px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer transition-all",
                          apiEndpointMode === "public"
                            ? "border-[var(--fluent-accent)] bg-[var(--fluent-accent)]/5 text-white"
                            : "border-[var(--fluent-border)] bg-zinc-800/30 text-[var(--fluent-text)] hover:border-zinc-500"
                        )}
                      >
                        {isGitee ? "Gitee 公网版 (gitee.com/api/v5)" : "GitHub 公网版 (api.github.com)"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setApiEndpointMode("enterprise")}
                      className={cn(
                        "px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer transition-all",
                        apiEndpointMode === "enterprise"
                          ? "border-[var(--fluent-accent)] bg-[var(--fluent-accent)]/5 text-white"
                          : "border-[var(--fluent-border)] bg-zinc-800/30 text-[var(--fluent-text)] hover:border-zinc-500"
                      )}
                    >
                      {isGitee ? "Gitee 企业版 (Gitee Enterprise)" : "GitHub 企业版 (Enterprise Server)"}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Custom Endpoint Input - Shown only when Enterprise is selected */}
            {apiEndpointMode === "enterprise" && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase">
                  企业版 API 路径 (Enterprise API Root)
                </label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
                />
              </div>
            )}

            {/* API Version Matching REST Docs - GitHub only */}
            {!isGitee && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GitHub REST API 版本 (X-GitHub-Api-Version)</span>
                </label>
                <select
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="w-full bg-zinc-800 border border-[var(--fluent-border)] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="2026-03-10">2026-03-10 (推荐 - 默认开发规范)</option>
                  <option value="2022-11-28">2022-11-28 (标准兼容)</option>
                </select>
              </div>
            )}

            {/* Authentication Token */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-yellow-500" />
                <span>{isGitee ? "Gitee 个人访问令牌 (Access Token)" : "GitHub 个人访问令牌 (Token / PAT)"}</span>
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={isGitee ? "请输入您的 Gitee 私人访问令牌" : "ghp_xxxxxxxxxxxxxxxxxxxxxx 或 github_pat_xxxx"}
                className="w-full bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Connection Test Diagnostics */}
          <div className="pt-3 border-t border-[var(--fluent-border)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-1.5 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none disabled:opacity-50 shrink-0"
            >
              <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
              <span>{testingConnection ? `正在验证 ${isGitee ? "Gitee" : "GitHub"} API...` : "测试连接"}</span>
            </button>

            {testResult === "success" && (
              <div className="text-right">
                <span className="text-xs text-green-500 font-bold flex items-center gap-1 animate-fade-in justify-end">
                  <CheckCircle2 className="w-4 h-4" />
                  验证成功: {githubUser}
                </span>
                {rateLimit && !isGitee && (
                  <span className="text-[9px] text-zinc-400 block mt-0.5 select-none">
                    限额剩余: {rateLimit.remaining} / {rateLimit.limit} (每小时)
                  </span>
                )}
              </div>
            )}

            {testResult === "error" && (
              <span className="text-xs text-red-500 font-bold flex items-center gap-1 animate-fade-in" title={errorMessage}>
                <AlertTriangle className="w-4 h-4" />
                连接验证失败
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 mb-4 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-white">{selectedType === "gitee" ? "Gitee" : "GitHub"} 数据源配置成功</h3>
        <p className="text-xs text-[var(--fluent-secondary)] mt-2 leading-relaxed">
          {selectedType === "gitee"
            ? "Gitee 开放平台 API 数据源配置流程已经全部完成。我们已将该访问凭据同步录入您的数据源管理器列表。您现在可以调用 Gitee API 并极速下载大陆地区的开源代码库和发行资产。"
            : "GitHub REST API 数据源配置流程已经全部完成。我们已将该访问凭据同步录入您的数据源管理器列表。您现在可以调用 GitHub API 进行超额请求以及下载受信任的私有和公开仓库。"}
        </p>

        <button
          type="button"
          onClick={handleFinish}
          className="mt-6 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold px-6 py-2 rounded-lg cursor-pointer transition shadow"
        >
          完成并返回列表
        </button>
      </div>
    );
  };

  const renderAddSourceView = () => {
    return (
      <div className="flex-1 flex flex-col">
        {/* Back and Header Row */}
        <div className="flex items-center gap-3.5 mb-6 shrink-0 text-left select-none">
          <button
            onClick={() => setView("list")}
            className="p-1.5 rounded-lg border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.08)] cursor-pointer text-[var(--fluent-text)] transition duration-150 active:scale-95"
            title="返回列表"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">添加新数据源向导</h2>
          </div>
        </div>

        {/* Steps Progress bar */}
        <div className="flex items-center justify-center max-w-xl mx-auto w-full mb-8 select-none shrink-0">
          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200",
              step === 1 ? "bg-[var(--fluent-accent)] text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            )}>
              1
            </div>
            <span className={cn("text-[10px] font-bold mt-1.5", step === 1 ? "text-white" : "text-zinc-500")}>
              选择类型
            </span>
          </div>

          <div className={cn("flex-1 h-[1.5px] mx-4 -mt-4 transition-colors duration-300", step >= 2 ? "bg-[var(--fluent-accent)]" : "bg-zinc-800")} />

          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200",
              step === 2 ? "bg-[var(--fluent-accent)] text-white" : step > 2 ? "bg-[var(--fluent-accent)]/20 text-[var(--fluent-accent)] border border-[var(--fluent-accent)]" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            )}>
              2
            </div>
            <span className={cn("text-[10px] font-bold mt-1.5", step === 2 ? "text-white" : "text-zinc-500")}>
              配置连接
            </span>
          </div>

          <div className={cn("flex-1 h-[1.5px] mx-4 -mt-4 transition-colors duration-300", step >= 3 ? "bg-[var(--fluent-accent)]" : "bg-zinc-800")} />

          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200",
              step === 3 ? "bg-[var(--fluent-accent)] text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            )}>
              3
            </div>
            <span className={cn("text-[10px] font-bold mt-1.5", step === 3 ? "text-white" : "text-zinc-500")}>
              完成
            </span>
          </div>
        </div>

        <hr className="border-[var(--fluent-border)] mb-6" />

        {/* Render Steps */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Footer wizard controls button layout */}
        {step < 3 && (
          <div className="mt-auto pt-6 border-t border-[var(--fluent-border)] flex items-center justify-between shrink-0 select-none">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className="px-5 py-1.5 rounded-lg border border-[var(--fluent-border)] text-xs font-semibold text-[var(--fluent-text)] bg-[var(--fluent-card)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(128,128,128,0.08)] transition cursor-pointer select-none"
            >
              上一步
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="px-5 py-1.5 rounded-lg border border-[var(--fluent-border)] text-xs font-semibold text-[var(--fluent-text)] bg-[var(--fluent-card)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(128,128,128,0.08)] transition cursor-pointer select-none"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 ? !selectedType : false}
                className="px-5 py-1.5 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer select-none"
              >
                下一步
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendering view: Edit flow
  const renderEditView = () => {
    const isGitee = selectedType === "gitee";
    return (
      <div className="flex-1 flex flex-col">
        {/* Header Navigation */}
        <div className="flex items-center gap-3 mb-6 shrink-0 text-left select-none">
          <button
            onClick={() => setView("list")}
            className="p-1.5 rounded-lg border border-[var(--fluent-border)] bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.15)] cursor-pointer transition text-[var(--fluent-text)] active:scale-95"
            title="返回数据源列表"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">修改数据源</h2>
            <p className="text-xs text-[var(--fluent-secondary)] mt-0.5">
              编辑该自定义代码托管源的 API 配置和连接凭据。
            </p>
          </div>
        </div>

        <hr className="border-[var(--fluent-border)] mb-6 shrink-0" />

        {/* Edit Form */}
        <div className="space-y-5 max-w-xl text-left select-text">
          {/* 1. Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block">数据源名称</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例如: GitHub 企业源"
              className="w-full text-xs bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
            />
          </div>

          {/* 2. Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block font-sans">平台类型</label>
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--fluent-border)] bg-zinc-900/20 max-w-xs select-none">
              {selectedType === "winget" ? <Package className="w-5 h-5 text-blue-400" /> :
               selectedType === "zip" ? <Archive className="w-5 h-5 text-yellow-500" /> :
               selectedType === "git_link" ? <GitFork className="w-5 h-5 text-emerald-500" /> :
               (isGitee ? <GiteeIcon className="w-5 h-5 text-red-500" /> : <GithubIcon className="w-5 h-5 text-white" />)}
              <span className="text-xs font-bold uppercase">{selectedType}</span>
              <span className="text-[10px] text-[var(--fluent-secondary)]">(不可修改)</span>
            </div>
          </div>

          {/* Platform specific fields */}
          {selectedType === "zip" ? (
            <div className="space-y-4 pt-2">
              {/* ZIP File Path */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">ZIP 文件路径</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={zipPath}
                    onChange={(e) => setZipPath(e.target.value)}
                    placeholder="例如: C:/Users/Documents/source.zip"
                    className="flex-1 bg-[rgba(128,128,128,0.05)] border border-[var(--fluent-border)] rounded-lg py-1.5 px-3 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleZipFileBrowse}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--fluent-border)] cursor-pointer flex items-center justify-center shrink-0 select-none"
                  >
                    浏览文件
                  </button>
                </div>
              </div>

              {/* Diagnostics */}
              <div className="pt-2 border-t border-[var(--fluent-border)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-1.5 border border-[var(--fluent-border)] hover:bg-[rgba(128,128,128,0.08)] bg-[var(--fluent-card)] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none disabled:opacity-50 shrink-0"
                >
                  <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
                  <span>{testingConnection ? "正在验证文件..." : "验证文件合法性"}</span>
                </button>

                {testResult === "success" && (
                  <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    文件验证通过
                  </span>
                )}

                {testResult === "error" && (
                  <span className="text-xs text-red-500 font-bold flex items-center gap-1" title={errorMessage}>
                    <AlertTriangle className="w-4 h-4" />
                    验证失败: {errorMessage}
                  </span>
                )}
              </div>
            </div>
          ) : selectedType === "git_link" ? (
            <div className="space-y-4 pt-2">
              {/* Git URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">Git 克隆链接 (Git Clone HTTPS URL)</label>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="如: https://github.com/username/my-apps.git"
                  className="w-full text-xs font-mono bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
                />
              </div>

              {/* Private Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-yellow-500" />
                  <span>访问凭证 (Token) / 可选</span>
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="私有仓库的个人访问令牌 (PAT / Access Token)"
                  className="w-full text-xs font-mono bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
                />
              </div>

              {/* Diagnostics */}
              <div className="pt-2 border-t border-[var(--fluent-border)] flex items-center gap-2 select-none">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition border border-[var(--fluent-border)] flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
                  <span>{testingConnection ? "正在诊断..." : "测试克隆链接"}</span>
                </button>

                {testResult === "success" && (
                  <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>链接验证成功</span>
                  </span>
                )}

                {testResult === "error" && (
                  <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>验证失败: {errorMessage}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 3. Endpoint Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">连接模式</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setApiEndpointMode("public")}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg border transition",
                      apiEndpointMode === "public"
                        ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)] text-white"
                        : "bg-[var(--fluent-card)] border-[var(--fluent-border)] text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    公网版 (Public)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiEndpointMode("enterprise")}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg border transition",
                      apiEndpointMode === "enterprise"
                        ? "bg-[var(--fluent-accent)] border-[var(--fluent-accent)] text-white"
                        : "bg-[var(--fluent-card)] border-[var(--fluent-border)] text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    企业/私有版 (Enterprise)
                  </button>
                </div>
              </div>

              {/* 4. Enterprise Custom Endpoint */}
              {apiEndpointMode === "enterprise" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-white block">自定义 API 根端点 (Endpoint)</label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder={isGitee ? "https://gitee.com/api/v5" : "https://github-enterprise.company.com/api/v3"}
                    className="w-full text-xs font-mono bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
                  />
                  <p className="text-[10px] text-[var(--fluent-secondary)] leading-relaxed">
                    请配置企业版或私有部署 API 端点。必须以 <code>http://</code> 或 <code>https://</code> 开头。
                  </p>
                </div>
              )}

              {/* 5. API Version for GitHub */}
              {!isGitee && apiEndpointMode === "enterprise" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-white block font-sans">API 版本 (X-GitHub-Api-Version)</label>
                  <input
                    type="text"
                    value={apiVersion}
                    onChange={(e) => setApiVersion(e.target.value)}
                    placeholder="2026-03-10"
                    className="w-full text-xs font-mono bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
                  />
                </div>
              )}

              {/* 6. Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">个人访问令牌 (Token)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder={isGitee ? "请输入 Gitee Access Token..." : "请输入 GitHub Personal Access Token (classic 或 fine-grained)..."}
                    className="w-full text-xs font-mono bg-[var(--fluent-card)] border border-[var(--fluent-border)] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[var(--fluent-accent)]"
                  />
                  <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-[var(--fluent-secondary)] leading-relaxed">
                  留空表示采用匿名拉取。公网源的匿名连接可能会受到较频繁 API 频次限制。
                </p>
              </div>

              {/* Connection Test Diagnostics */}
              <div className="pt-2">
                <div className="flex items-center gap-2 select-none">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition border border-[var(--fluent-border)] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Terminal className={cn("w-3.5 h-3.5", testingConnection && "animate-spin")} />
                    <span>{testingConnection ? "正在诊断..." : "测试连接连通性"}</span>
                  </button>

                  {testResult === "success" && (
                    <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>连通诊断通过 {githubUser && `(账号: ${githubUser})`}</span>
                    </span>
                  )}

                  {testResult === "error" && (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>诊断失败: {errorMessage}</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--fluent-border)] flex items-center gap-3 select-none">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-500/10 active:scale-98"
            >
              保存修改
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer transition border border-[var(--fluent-border)]"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto h-full px-4 md:px-8 py-6 md:py-8 flex flex-col relative select-none">
      {view === "list" ? renderListView() : view === "edit" ? renderEditView() : renderAddSourceView()}
    </div>
  );
}
