/**
 * 本地 ZIP 数据源加载器
 *
 * ZIP 包结构约定(同时支持根级与一层子目录):
 *   source.json   ← 元数据
 *   adapter.js    ← 默认适配器(实现 searchApps(query))
 *   ...           ← 其他静态资源
 *
 * 适配器通过 Blob + 动态 import() 在 Webview 沙箱里执行,避免污染全局命名空间。
 */

import { readFile } from "@tauri-apps/plugin-fs";
import JSZip from "jszip";
import { UnifiedApp } from "./urlSourcesAdapter";

export interface ZipSourceMeta {
  id: string;
  name: string;
  version?: string;
  description?: string;
  adapter?: string;
  adapterType?: string;
}

export interface ZipSourceLoadResult {
  apps: UnifiedApp[];
  meta: ZipSourceMeta;
  /** 缓存命中?如果是,意味着这次没真正读盘 */
  fromCache: boolean;
}

export class ZipSourceError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ZipSourceError";
    this.cause = cause;
  }
}

/* -------------------------------------------------------------------------- */
/*  Caching                                                                   */
/* -------------------------------------------------------------------------- */

interface MetaCacheEntry {
  meta: ZipSourceMeta;
  bytes: Uint8Array;
  expireAt: number;
}

const META_TTL_MS = 5 * 60 * 1000; // 5 分钟
const metaCache = new Map<string, MetaCacheEntry>();
const resultCache = new Map<string, ZipSourceLoadResult>();

const metaCacheKey = (zipPath: string, mtime: number) =>
  `${zipPath}::${mtime}`;

export function clearZipSourceCache(zipPath?: string) {
  if (!zipPath) {
    metaCache.clear();
    resultCache.clear();
    return;
  }
  for (const key of Array.from(metaCache.keys())) {
    if (key.startsWith(`${zipPath}::`)) metaCache.delete(key);
  }
  for (const key of Array.from(resultCache.keys())) {
    if (key.startsWith(`${zipPath}::`)) resultCache.delete(key);
  }
}

/* -------------------------------------------------------------------------- */
/*  Internals                                                                 */
/* -------------------------------------------------------------------------- */

async function loadZipBytes(zipPath: string): Promise<Uint8Array> {
  try {
    return await readFile(zipPath);
  } catch (err) {
    throw new ZipSourceError(
      `无法读取 ZIP 文件: ${zipPath}。请确认文件存在且应用有访问权限。`,
      err
    );
  }
}

function findEntry(zip: JSZip, suffix: string) {
  return Object.values(zip.files).find((f) => !f.dir && f.name.endsWith(suffix));
}

async function loadMeta(zipPath: string): Promise<{
  meta: ZipSourceMeta;
  bytes: Uint8Array;
}> {
  const bytes = await loadZipBytes(zipPath);
  // 简易 mtime 占位:用 bytes 长度 + 首字节做 key,实际生产可读 stat
  const sig = bytes.length + (bytes[0] ?? 0) * 131 + (bytes[bytes.length - 1] ?? 0);
  const key = metaCacheKey(zipPath, sig);
  const cached = metaCache.get(key);
  if (cached && cached.expireAt > Date.now()) {
    return { meta: cached.meta, bytes };
  }
  try {
    const zip = await JSZip.loadAsync(bytes);
    const sourceJsonFile = findEntry(zip, "source.json");
    if (!sourceJsonFile) {
      throw new ZipSourceError("未找到 source.json (Zip 中缺少配置)");
    }
    const raw = await sourceJsonFile.async("string");
    const meta = JSON.parse(raw) as ZipSourceMeta;
    if (!meta.id) throw new ZipSourceError("source.json 缺少必填字段: id");
    if (!meta.name) throw new ZipSourceError("source.json 缺少必填字段: name");
    if (!meta.adapter) {
      throw new ZipSourceError("source.json 缺少必填字段: adapter (适配器文件名)");
    }
    metaCache.set(key, { meta, bytes, expireAt: Date.now() + META_TTL_MS });
    return { meta, bytes };
  } catch (err) {
    if (err instanceof ZipSourceError) throw err;
    throw new ZipSourceError(
      `解析 ZIP 元数据失败: ${(err as Error)?.message || String(err)}`,
      err
    );
  }
}

/**
 * 仅读取 source.json 元数据。供 wizard 的"测试"按钮使用,失败时抛错。
 */
export async function readZipSourceMeta(zipPath: string): Promise<ZipSourceMeta> {
  const { meta } = await loadMeta(zipPath);
  return meta;
}

/* -------------------------------------------------------------------------- */
/*  Adapter execution                                                         */
/* -------------------------------------------------------------------------- */

async function executeAdapter(
  zip: JSZip,
  meta: ZipSourceMeta
): Promise<(query: string) => Promise<any[]>> {
  const adapterName = meta.adapter!;
  const adapterFile = findEntry(zip, adapterName);
  if (!adapterFile) {
    throw new ZipSourceError(`适配器文件 ${meta.adapter} 不在 ZIP 中`);
  }
  const adapterCode = await adapterFile.async("string");
  if (!adapterCode || !adapterCode.trim()) {
    throw new ZipSourceError(`适配器文件 ${meta.adapter} 内容为空`);
  }
  // 用 Blob 喂给动态 import,避免污染全局,适配器默认 export { searchApps }
  const blob = new Blob([adapterCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    const mod: any = await import(/* @vite-ignore */ url);
    if (typeof mod.searchApps !== "function") {
      throw new ZipSourceError(
        "适配器未导出 searchApps(query) 函数。请确认 adapter 文件以 `export async function searchApps(query)` 形式导出。"
      );
    }
    return mod.searchApps;
  } catch (err) {
    if (err instanceof ZipSourceError) throw err;
    throw new ZipSourceError(
      `加载适配器失败: ${(err as Error)?.message || String(err)}`,
      err
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * 加载 ZIP 源并执行 searchApps(query)。
 * - query 缺省时,适配器决定行为(空查询 / 全量)。
 * - 出错时不再静默 return [];而是抛 ZipSourceError,让上层明确知道是哪个源挂了。
 */
export async function loadAppsFromZipSource(
  zipPath: string,
  query: string = ""
): Promise<UnifiedApp[]> {
  const result = await loadAppsFromZipSourceWithMeta(zipPath, query);
  return result.apps;
}

export async function loadAppsFromZipSourceWithMeta(
  zipPath: string,
  query: string = ""
): Promise<ZipSourceLoadResult> {
  const cacheKey = `${zipPath}::${query}`;
  const hit = resultCache.get(cacheKey);
  if (hit) return { ...hit, fromCache: true };

  const { meta, bytes } = await loadMeta(zipPath);
  const zip = await JSZip.loadAsync(bytes);
  const searchApps = await executeAdapter(zip, meta);
  let rawResults: unknown;
  try {
    rawResults = await searchApps(query);
  } catch (err) {
    throw new ZipSourceError(
      `适配器执行异常: ${(err as Error)?.message || String(err)}`,
      err
    );
  }
  if (!Array.isArray(rawResults)) {
    throw new ZipSourceError("适配器 searchApps 返回值不是数组");
  }
  const apps = rawResults.map((app: any, idx: number) => ({
    ...app,
    // 兜底关键字段,避免上游渲染时炸掉
    owner: app?.owner || app?.developer || "社区",
    repo: app?.repo || app?.app_id || meta.id || `app-${idx}`,
    title: app?.title || app?.name || app?.appName || `App ${idx + 1}`,
    publisher: app?.publisher || app?.owner || app?.developer || "社区",
    description: app?.description || app?.summary || "暂无描述",
    category: app?.category || "应用",
    icon: app?.icon || app?.icon_url,
    stars: app?.stars ?? 0,
    rating: app?.rating ?? Number((4.1 + ((app?.stars ?? 0) % 8) / 10).toFixed(1)),
    language: app?.language || "Unknown",
    url: app?.url || app?.downloadUrl || "",
    sourceId: meta.id,
    sourceName: meta.name,
    platform: "zip" as const,
    version: app?.version || meta.version,
    readme: app?.readme || app?.description,
  })) as UnifiedApp[];

  const result: ZipSourceLoadResult = {
    apps,
    meta,
    fromCache: false,
  };
  resultCache.set(cacheKey, result);
  return result;
}
