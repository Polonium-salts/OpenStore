import { OpenStoreApp } from "../types.js";

/**
 * WinGet 适配器：将 WinGet 原始包数据映射清洗为 OpenStore 统一格式
 */
export function adaptWingetToOpenStore(rawData: any): OpenStoreApp {
  // 安全地提取默认的安装器信息
  const installers = rawData.Installers || [];
  const installer = installers[0] || {};
  const switches = installer.InstallerSwitches || {};

  const appId = (rawData.PackageIdentifier || "unknown").toLowerCase();

  return {
    app_id: appId,
    name: rawData.PackageName || "未知应用",
    version: rawData.PackageVersion || "0.0.0",
    description: rawData.ShortDescription || "暂无描述",
    icon_url: `https://cdn.openstore.com/icons/${appId}.png`, 
    developer: rawData.Publisher || "未知开发者",
    license: rawData.License || "Freeware",
    sources: ["winget"],
    platforms: {
      windows: {
        available: true,
        download_url: installer.InstallerUrl || null,
        installer_type: installer.InstallerType || "exe",
        sha256: installer.Sha256 || null,
        silent_args: switches.Silent || "/S"
      },
      macos: {
        available: false,
        download_url: null,
        installer_type: null,
        sha256: null,
        silent_args: null
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
