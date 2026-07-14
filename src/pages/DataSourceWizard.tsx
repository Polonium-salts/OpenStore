import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, Terminal, AlertTriangle, Key, Globe, Cpu, Plus, Trash, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DataSource {
  id: string;
  name: string;
  apiEndpointMode: "public" | "enterprise";
  customEndpoint: string;
  apiVersion: string;
  token: string;
  addedAt: string;
}

export default function DataSourceWizard() {
  const { githubToken, setGithubToken, dataSources, addDataSource, deleteDataSource } = useApp();

  // Navigation state: 'list' | 'add'
  const [view, setView] = useState<"list" | "add">("list");

  // Wizard Flow States (active when view === 'add')
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [apiEndpointMode, setApiEndpointMode] = useState<"public" | "enterprise">("public");
  const [customEndpoint, setCustomEndpoint] = useState("https://github-enterprise.company.com/api/v3");
  const [apiVersion, setApiVersion] = useState("2026-03-10");
  const [tokenInput, setTokenInput] = useState("");

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

  const handleSelectType = (id: string) => {
    setSelectedType(id);
  };

  const handleNext = () => {
    if (step === 1 && selectedType) {
      setStep(2);
    } else if (step === 2) {
      // Add source to list
      const newSource: DataSource = {
        id: `source_${Date.now()}`,
        name: apiEndpointMode === "public" ? "GitHub 公网数据源" : "GitHub 企业版数据源",
        apiEndpointMode,
        customEndpoint: apiEndpointMode === "public" ? "https://api.github.com" : customEndpoint.trim(),
        apiVersion,
        token: tokenInput.trim(),
        addedAt: new Date().toLocaleDateString()
      };

      addDataSource(newSource);

      // Set as active GitHub Token in global context
      if (tokenInput.trim()) {
        setGithubToken(tokenInput.trim());
        localStorage.setItem("git_store_token", tokenInput.trim());
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

    const baseEndpoint = apiEndpointMode === "public" ? "https://api.github.com" : customEndpoint.trim();
    const requestUrl = `${baseEndpoint}/user`;

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": apiVersion,
      };

      if (tokenInput.trim()) {
        headers.Authorization = `Bearer ${tokenInput.trim()}`;
      }

      const res = await fetch(requestUrl, { headers });
      
      const limitHeader = res.headers.get("x-ratelimit-limit");
      const remainingHeader = res.headers.get("x-ratelimit-remaining");
      if (limitHeader && remainingHeader) {
        setRateLimit({
          limit: parseInt(limitHeader, 10),
          remaining: parseInt(remainingHeader, 10),
        });
      }

      if (res.ok) {
        const data = await res.json();
        setGithubUser(data.login);
        setTestResult("success");
      } else {
        throw new Error(`API 诊断失败 (状态码: ${res.status})`);
      }
    } catch (err: any) {
      setTestResult("error");
      setErrorMessage(err.message || "请求超时，无法连接至 GitHub。");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestListSource = async (source: DataSource) => {
    setListTestingId(source.id);
    setListTestResults((prev) => ({ ...prev, [source.id]: "idle" }));

    const baseEndpoint = source.apiEndpointMode === "public" ? "https://api.github.com" : source.customEndpoint.trim();
    const requestUrl = `${baseEndpoint}/user`;

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": source.apiVersion,
      };

      if (source.token.trim()) {
        headers.Authorization = `Bearer ${source.token.trim()}`;
      }

      const res = await fetch(requestUrl, { headers });
      if (res.ok) {
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

  const isCurrentlyActive = (source: DataSource) => {
    const activeToken = localStorage.getItem("git_store_token") || githubToken || "";
    const activeMode = localStorage.getItem("git_store_api_mode") || "public";
    return source.token === activeToken && source.apiEndpointMode === activeMode;
  };

  const handleActivateSource = (source: DataSource) => {
    setGithubToken(source.token);
    localStorage.setItem("git_store_token", source.token);
    localStorage.setItem("git_store_api_mode", source.apiEndpointMode);
    localStorage.setItem("git_store_custom_endpoint", source.customEndpoint);
    localStorage.setItem("git_store_api_version", source.apiVersion);
  };

  const handleDeleteSource = (id: string) => {
    if (confirm("确定要删除此数据源配置吗？")) {
      const deleted = dataSources.find((s) => s.id === id);
      deleteDataSource(id);

      // If active source is deleted, clear global token
      if (deleted && deleted.token === githubToken) {
        setGithubToken("");
        localStorage.removeItem("git_store_token");
      }
    }
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
              const active = isCurrentlyActive(source);

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
                      <GithubIcon className="w-5 h-5" />
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
                        端点: <span className="font-mono text-zinc-400">{source.apiEndpointMode === "public" ? "公网 API" : source.customEndpoint}</span>
                      </p>
                      <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
                        版本: <span className="font-mono text-zinc-400">{source.apiVersion}</span>
                      </p>
                      <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
                        密钥: <span className="font-mono text-zinc-500">
                          {source.token ? `ghp_••••••••${source.token.slice(-4)}` : "未配置公开访问"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/10 dark:border-zinc-800/30 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[9px] text-[var(--fluent-secondary)] opacity-60">
                      创建时间: {source.addedAt}
                    </span>

                    <div className="flex items-center gap-2 select-none">
                      {!active && (
                        <button
                          onClick={() => handleActivateSource(source)}
                          className="px-2.5 py-1 bg-[var(--fluent-accent)] hover:bg-[var(--fluent-accent-hover)] text-white rounded-lg cursor-pointer transition"
                        >
                          启用
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
                      
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer transition"
                        title="移除此数据源"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
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
    const isSelected = selectedType === "github";
    return (
      <div className="space-y-6 flex-1">
        <div className="text-left shrink-0">
          <h3 className="text-sm font-bold text-white">请选择您的数据源类型</h3>
        </div>

        <div className="max-w-md">
          <div
            onClick={() => handleSelectType("github")}
            className={cn(
              "p-5 border rounded-xl bg-[var(--fluent-card)] hover:bg-[rgba(128,128,128,0.02)] transition-all cursor-pointer flex flex-col justify-between min-h-[140px] text-left shadow-sm relative",
              isSelected
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
                  对接 GitHub API。支持设置自定义企业版 API 端点、指定 API 版本标头以及过滤特定组织/开发分支的仓库资源。
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
                  isSelected
                    ? "bg-[var(--fluent-accent)] text-white"
                    : "bg-[rgba(128,128,128,0.08)] border border-[var(--fluent-border)] text-[var(--fluent-text)] hover:bg-[rgba(128,128,128,0.15)]"
                )}
              >
                {isSelected ? "已选择" : "选择"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-6 flex-1 max-w-2xl mx-auto text-left">
        <div>
          <h3 className="text-sm font-bold text-white">配置 GitHub REST API 数据源</h3>
          <p className="text-[10px] text-[var(--fluent-secondary)] mt-0.5">
            根据 GitHub 开发文档，请指定您的连接服务器类型、API 版本以及相应的安全令牌。
          </p>
        </div>

        <div className="border border-[var(--fluent-border)] bg-[var(--fluent-card)] p-6 rounded-xl space-y-4 shadow-sm">
          <div className="space-y-4">
            
            {/* API Endpoint Mode */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>API 服务端点类型 (API Endpoint Type)</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
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
                  GitHub 公网版 (api.github.com)
                </button>
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
                  GitHub 企业版 (Enterprise Server)
                </button>
              </div>
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

            {/* API Version Matching REST Docs */}
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

            {/* Authentication Token */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--fluent-secondary)] uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-yellow-500" />
                <span>GitHub 个人访问令牌 (Token / PAT)</span>
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx 或 github_pat_xxxx"
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
              <span>{testingConnection ? "正在验证 GitHub API..." : "测试连接"}</span>
            </button>

            {testResult === "success" && (
              <div className="text-right">
                <span className="text-xs text-green-500 font-bold flex items-center gap-1 animate-fade-in justify-end">
                  <CheckCircle2 className="w-4 h-4" />
                  验证成功: {githubUser}
                </span>
                {rateLimit && (
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
        <h3 className="text-base font-extrabold text-white">GitHub 数据源配置成功</h3>
        <p className="text-xs text-[var(--fluent-secondary)] mt-2 leading-relaxed">
          GitHub REST API 数据源配置流程已经全部完成。我们已将该访问凭据同步录入您的数据源管理器列表。您现在可以调用 GitHub API 进行超额请求以及下载受信任的私有和公开仓库。
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

  return (
    <div className="flex-1 overflow-y-auto h-full px-8 py-8 flex flex-col relative select-none">
      {view === "list" ? renderListView() : renderAddSourceView()}
    </div>
  );
}
