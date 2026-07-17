import { OpenStoreApp } from "../types.js";

/**
 * Homebrew 适配器：将 Homebrew Cask/Formula 原始数据清洗映射为 OpenStore 统一格式
 */
export function adaptHomebrewToOpenStore(rawData: any): OpenStoreApp {
  const token = rawData.token || "unknown";
  const name = Array.isArray(rawData.name) ? rawData.name[0] : (rawData.name || "未知应用");

  return {
    app_id: token.toLowerCase(),
    name: name,
    version: rawData.version || "0.0.0",
    description: rawData.desc || "暂无描述",
    icon_url: `https://cdn.openstore.com/icons/${token}.png`,
    developer: rawData.developer || "未知开发者",
    license: rawData.license || "Open Source",
    sources: ["homebrew"],
    platforms: {
      windows: {
        available: false,
        download_url: null,
        installer_type: null,
        sha256: null,
        silent_args: null
      },
      macos: {
        available: true,
        download_url: rawData.url || null,
        installer_type: rawData.url?.endsWith(".zip") ? "zip" : "dmg",
        sha256: rawData.sha256 || null,
        silent_args: "cp -r \"Visual Studio Code.app\" /Applications/"
      },
      linux: {
        available: false,
        download_url: null,
        installer_type: null,
        sha256: null,
        silent_args: null
      }
    }
  };
}
