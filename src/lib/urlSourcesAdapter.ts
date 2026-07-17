/**
 * URL 数据源适配器
 *
 * 把任意 HTTP 端点(标准 JSON / simple_app_list / openstore_api)转换为 OpenStore
 * 统一格式 `UnifiedApp`。内置超时、内存缓存、size 提取、连接测试等基础能力。
 */

export type UrlAdapterType =
  | "standard"
  | "simple_app_list"
  | "openstore_api"
  | string;

export interface UrlSourceConfig {
  id: string;
  name: string;
  /** 远端数据源 URL(GitHub raw / 自家网关 / 任何返回 JSON 的端点) */
  url: string;
  /** 适配器类型 */
  adapterType: UrlAdapterType;
  /** 是否启用,关闭后会被所有上层调用跳过 */
  enabled: boolean;
  /**
   * 仅对 openstore_api 类型生效。openstore_api 类型的源在"发现首页"展示时,
   * 会按这个列表里的关键词逐个请求 `/api/apps/:id` 然后合并去重。
   * 留空时,会尝试请求 `/api/apps/list` 列表端点(若网关支持)。
   */
  homepageQueries?: string[];
  /** 任意附加 HTTP 头,例如鉴权 */
  headers?: Record<string, string>;
  /** UI 上的最后诊断状态(由 wizard/test 写入,只读) */
  lastTest?: UrlSourceTestResult;
  /** 用户添加/修改时间戳,用于 UI 排序 */
  addedAt?: string;
}

export interface UrlSourceTestResult {
  status: "success" | "error";
  message: string;
  /** 远端返回的应用数量(若可解析) */
  appCount?: number;
  testedAt: number;
}

export interface UrlSourceAsset {
  name: string;
  browser_download_url: string;
  size?: number;
}

export interface UnifiedApp {
  owner: string;
  repo: string;
  title: string;
  publisher: string;
  description: string;
  category: string;
  icon?: string;
  stars: number;
  language: string;
  rating?: number;
  url: string;
  bannerGradient?: string;
  sourceId: string;
  sourceName: string;
  /** 标记数据来源平台 */
  platform: "github" | "gitee" | "winget" | "url_source" | "zip" | "openstore_api";
  winget_id?: string;
  winget_version?: string;
  version?: string;
  readme?: string;
  assets?: UrlSourceAsset[];
}

export interface UrlSourceLoadResult {
  apps: UnifiedApp[];
  error?: string;
  status?: number;
  /** 远端应用数量(只统计解析成功的) */
  appCount: number;
}

interface SimpleAppItem {
  appName: string;
  author: string;
  summary: string;
  downloadUrl: string;
  icon?: string;
  category?: string;
  language?: string;
  version?: string;
  readme?: string;
  stars?: number;
  size?: number;
  sizeKb?: number;
}

const BANNER_GRADIENTS = [
  "from-blue-600/20 to-zinc-900/10",
  "from-purple-600/20 to-zinc-900/10",
  "from-emerald-600/20 to-zinc-900/10",
  "from-indigo-600/20 to-zinc-900/10",
  "from-zinc-700/30 to-zinc-950/20",
  "from-amber-600/20 to-zinc-900/10",
];

const pickGradient = (index: number) =>
  BANNER_GRADIENTS[Math.abs(index) % BANNER_GRADIENTS.length];

/* -------------------------------------------------------------------------- */
/*  HTTP utilities                                                            */
/* -------------------------------------------------------------------------- */

const DEFAULT_TIMEOUT_MS = 8000;

export class UrlSourceHttpError extends Error {
  status?: number;
  cause?: unknown;
  constructor(message: string, opts: { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = "UrlSourceHttpError";
    this.status = opts.status;
    this.cause = opts.cause;
  }
}

export async function httpGetJson<T = any>(
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    if (!res.ok) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 240);
      } catch {
        /* ignore */
      }
      throw new UrlSourceHttpError(
        `HTTP ${res.status} ${res.statusText || ""}`.trim() +
          (body ? ` — ${body}` : ""),
        { status: res.status }
      );
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new UrlSourceHttpError(`请求超时 (${timeoutMs}ms): ${url}`);
    }
    if (err instanceof UrlSourceHttpError) throw err;
    throw new UrlSourceHttpError(
      `网络错误: ${(err as Error)?.message || String(err)}`,
      { cause: err }
    );
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/*  In-memory cache                                                           */
/* -------------------------------------------------------------------------- */

interface CacheEntry {
  expireAt: number;
  result: UrlSourceLoadResult;
}

const TTL_OK = 60_000; // 60s
const TTL_ERR = 10_000; // 10s 失败也短缓存,避免反复打挂掉的源
const cache = new Map<string, CacheEntry>();

function cacheKey(source: UrlSourceConfig) {
  return `${source.id}::${source.url}::${source.adapterType}`;
}

export function clearUrlSourceCache(sourceId?: string) {
  if (!sourceId) {
    cache.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(`${sourceId}::`)) cache.delete(key);
  }
}

/* -------------------------------------------------------------------------- */
/*  Size extraction                                                           */
/* -------------------------------------------------------------------------- */

function bytesFromAny(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

/**
 * 尝试从多种字段名 / 单位约定中推断文件字节大小。
 * 优先级:`size`(字节) > `sizeKb`(KB) > `sizeKB` / `fileSize` / `installer_size` > 字符串尾部单位
 */
function inferBytes(item: Record<string, any>): number | undefined {
  const direct = bytesFromAny(item.size)
    ?? bytesFromAny(item.sizeKb)         // simple_app_list 风格
    ?? bytesFromAny(item.sizeKB)
    ?? bytesFromAny(item.fileSize)
    ?? bytesFromAny(item.installer_size)
    ?? bytesFromAny(item.installerSize)
    ?? bytesFromAny(item.bytes);
  if (direct !== undefined) return direct;

  // 字符串带单位的兜底: "12.3 MB" / "1.4 GB" / "512 KB"
  const candidates = [item.sizeText, item.size_text, item.humanSize];
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const m = c.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|KiB|MiB|GiB)$/i);
    if (!m) continue;
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n)) continue;
    const unit = m[2].toUpperCase();
    if (unit === "B") return n;
    if (unit === "KB" || unit === "KIB") return n * 1024;
    if (unit === "MB" || unit === "MIB") return n * 1024 * 1024;
    if (unit === "GB" || unit === "GIB") return n * 1024 * 1024 * 1024;
  }
  return undefined;
}

function formatBytes(bytes?: number): string | undefined {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return undefined;
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/* -------------------------------------------------------------------------- */
/*  Adapters                                                                  */
/* -------------------------------------------------------------------------- */

function adaptStandardList(data: any, source: UrlSourceConfig): UnifiedApp[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, idx: number) => {
    const assetsRaw: any[] | undefined = Array.isArray(item.assets) ? item.assets : undefined;
    const assets: UrlSourceAsset[] | undefined = assetsRaw?.map((a) => {
      const bytes = inferBytes(a);
      return {
        name: a.name || a.filename || "download",
        browser_download_url:
          a.browser_download_url || a.downloadUrl || a.url || "",
        size: bytes,
      };
    });
    return {
      owner: item.owner || item.author || item.publisher || "community",
      repo: item.repo || item.app_id || item.name || `app-${idx}`,
      title: item.title || item.name || item.appName || `App ${idx + 1}`,
      publisher: item.publisher || item.owner || item.author || "社区",
      description: item.description || item.summary || "暂无描述",
      category: item.category || "应用",
      icon: item.icon || item.icon_url || item.iconUrl,
      stars: item.stars ?? 0,
      language: item.language || "Unknown",
      rating: item.rating,
      url: item.url || item.html_url || item.homepage || "",
      bannerGradient: pickGradient(idx),
      sourceId: source.id,
      sourceName: source.name,
      platform: "url_source",
      version: item.version || item.tag_name,
      readme: item.readme || item.description,
      assets,
    } as UnifiedApp;
  });
}

function adaptSimpleAppList(data: any, source: UrlSourceConfig): UnifiedApp[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: SimpleAppItem, index) => {
    const appName = item.appName || `App-${index}`;
    const author = item.author || "社区";
    const downloadUrl = item.downloadUrl || "";
    const sizeBytes = inferBytes(item as any);

    return {
      owner: author,
      repo: appName,
      title: appName,
      publisher: author,
      description: item.summary || "暂无描述",
      category: item.category || "常用工具",
      icon: item.icon,
      stars: item.stars || 0,
      language: item.language || "HTML",
      url: downloadUrl,
      bannerGradient: pickGradient(index),
      sourceId: source.id,
      sourceName: source.name,
      platform: "url_source",
      version: item.version || "1.0.0",
      readme: item.readme || item.summary || "暂无详细描述说明。",
      assets: downloadUrl
        ? [
            {
              name: appName + (downloadUrl.endsWith(".zip") ? ".zip" : downloadUrl.endsWith(".exe") ? ".exe" : ""),
              browser_download_url: downloadUrl,
              size: sizeBytes,
            },
          ]
        : [],
    };
  });
}

function adaptOpenStoreApiList(data: any, source: UrlSourceConfig): UnifiedApp[] {
  // 兼容网关的外壳 { code, data } / 直接数组 / 兼容 openstore_api plugin
  let appList: any[] = [];
  if (Array.isArray(data)) {
    appList = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.data)) {
      appList = data.data;
    } else if (Array.isArray(data.apps)) {
      appList = data.apps;
    } else if (Array.isArray(data.results)) {
      appList = data.results;
    } else if (data.data && typeof data.data === "object") {
      appList = [data.data];
    }
  }
  if (!Array.isArray(appList)) return [];

  return appList.map((app: any, index: number) => {
    const winPlatform = app.platforms?.windows || {};
    const macPlatform = app.platforms?.macos || {};
    const linuxPlatform = app.platforms?.linux || {};
    const downloadUrl =
      winPlatform.download_url || macPlatform.download_url || linuxPlatform.download_url || app.download_url || "";
    const sizeFromPlatforms =
      inferBytes(winPlatform) ?? inferBytes(macPlatform) ?? inferBytes(linuxPlatform);
    const sizeFromApp = inferBytes(app);
    const size = sizeFromPlatforms ?? sizeFromApp;

    return {
      owner: app.developer || "未知",
      repo: app.app_id || `app-${index}`,
      title: app.name || "未知应用",
      publisher: app.developer || "未知",
      description: app.description || "暂无描述",
      category: app.category || "应用软件",
      icon: app.icon_url || app.icon || app.iconUrl,
      stars: app.stars ?? 0,
      language: app.language || "Multi",
      url: downloadUrl,
      bannerGradient: pickGradient(index),
      sourceId: source.id,
      sourceName: source.name,
      platform: "url_source",
      version: app.version || "1.0.0",
      readme: app.readme || app.description || "",
      assets: downloadUrl
        ? [
            {
              name: `${app.name || "App"} 安装包${formatBytes(size) ? ` (${formatBytes(size)})` : ""}`,
              browser_download_url: downloadUrl,
              size,
            },
          ]
        : [],
    } as UnifiedApp;
  });
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * 获取并转换远程 URL 数据源。带超时、内存缓存、错误归一化。
 * 永远不抛错:错误会作为 result.error 返回,便于上层列表展示具体哪个源失败。
 */
export async function fetchAndAdaptUrlSource(
  source: UrlSourceConfig,
  opts: { query?: string; skipCache?: boolean; timeoutMs?: number } = {}
): Promise<UrlSourceLoadResult> {
  if (!source.enabled) {
    return { apps: [], appCount: 0 };
  }
  if (!source.url) {
    return {
      apps: [],
      appCount: 0,
      error: "数据源 URL 为空",
    };
  }

  const key = cacheKey(source) + (opts.query ? `::q=${opts.query}` : "");
  if (!opts.skipCache) {
    const hit = cache.get(key);
    if (hit && hit.expireAt > Date.now()) {
      return hit.result;
    }
  }

  try {
    const data = await httpGetJson(source.url, {
      headers: source.headers,
      timeoutMs: opts.timeoutMs,
    });
    let apps: UnifiedApp[];
    switch (source.adapterType) {
      case "standard":
        apps = adaptStandardList(data, source);
        break;
      case "simple_app_list":
        apps = adaptSimpleAppList(data, source);
        break;
      case "openstore_api":
        apps = adaptOpenStoreApiList(data, source);
        break;
      default:
        console.warn(
          `未知的适配器类型 [${source.adapterType}],尝试按 standard 解析`
        );
        apps = adaptStandardList(data, source);
    }
    // 可选 query 过滤:对 openstore_api 拉全量,但给上层过滤用
    if (opts.query) {
      const q = opts.query.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.publisher.toLowerCase().includes(q) ||
          a.repo.toLowerCase().includes(q)
      );
    }
    const result: UrlSourceLoadResult = {
      apps,
      appCount: apps.length,
    };
    cache.set(key, { result, expireAt: Date.now() + TTL_OK });
    return result;
  } catch (err) {
    const message =
      err instanceof UrlSourceHttpError
        ? err.message
        : (err as Error)?.message || String(err);
    const result: UrlSourceLoadResult = {
      apps: [],
      appCount: 0,
      error: message,
      status: err instanceof UrlSourceHttpError ? err.status : undefined,
    };
    cache.set(key, { result, expireAt: Date.now() + TTL_ERR });
    return result;
  }
}

/**
 * 仅测试连接性,返回简要诊断结果(供 wizard 列表里的"测试"按钮使用)。
 */
export async function testUrlSource(
  source: UrlSourceConfig,
  opts: { timeoutMs?: number } = {}
): Promise<UrlSourceTestResult> {
  if (!source.url) {
    return {
      status: "error",
      message: "URL 为空",
      testedAt: Date.now(),
    };
  }
  const t0 = performance.now();
  try {
    const result = await fetchAndAdaptUrlSource(source, {
      timeoutMs: opts.timeoutMs,
      skipCache: true,
    } as any);
    if (result.error) {
      return {
        status: "error",
        message: result.error,
        testedAt: Date.now(),
      };
    }
    return {
      status: "success",
      message: `已连通, 解析到 ${result.appCount} 个应用 (${Math.round(performance.now() - t0)}ms)`,
      appCount: result.appCount,
      testedAt: Date.now(),
    };
  } catch (err) {
    return {
      status: "error",
      message: (err as Error)?.message || String(err),
      testedAt: Date.now(),
    };
  }
}
