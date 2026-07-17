import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { OpenStoreApp, UnifiedApiResponse } from "./types.js";
import { adaptWingetToOpenStore } from "./adapters/winget.js";
import { adaptHomebrewToOpenStore } from "./adapters/homebrew.js";

const app = new Hono();

// 模拟数据库/远程包管理器抓取到的脏数据
const MOCK_RAW_WINGET_DATABASE: Record<string, any> = {
  "vscode": {
    PackageIdentifier: "Microsoft.VisualStudioCode",
    PackageName: "Visual Studio Code",
    PackageVersion: "1.80.0",
    ShortDescription: "功能强大的现代化跨平台代码编辑器。",
    Publisher: "Microsoft",
    License: "Freeware",
    Installers: [
      {
        Architecture: "x64",
        InstallerUrl: "https://az764295.vo.msecnd.net/stable/30a19c2203c238e3f92de1bc7709a96c32d4bd2c/VSCodeSetup-x64-1.80.0.exe",
        InstallerType: "exe",
        Sha256: "a3b6f272a8d38f972b9a7c36a28d54bd2c6e6e2f1f3d8a9f62626e2e28a5433a",
        InstallerSwitches: {
          Silent: "/VERYSILENT /SUPPRESSMSGBOXES /MERGETASKS=!runcode,desktopicon"
        }
      }
    ]
  }
};

const MOCK_RAW_HOMEBREW_DATABASE: Record<string, any> = {
  "vscode": {
    token: "visual-studio-code",
    name: ["Visual Studio Code", "VS Code"],
    version: "1.80.0",
    desc: "Code editing. Redefined.",
    developer: "Microsoft",
    license: "Freeware",
    url: "https://az764295.vo.msecnd.net/stable/30a19c2203c238e3f92de1bc7709a96c32d4bd2c/VSCode-darwin-universal.zip",
    sha256: "c4d791bc8d38f972b9a7c36a28d54bd2c6e6e2f1f3d8a9f62626e2e28a5433a"
  }
};

/**
 * 深度合并两个适配后生成的标准化 OpenStore 软件数据
 */
function mergeApps(wingetApp: OpenStoreApp, homebrewApp: OpenStoreApp): OpenStoreApp {
  return {
    app_id: wingetApp.app_id,
    name: wingetApp.name || homebrewApp.name,
    version: wingetApp.version || homebrewApp.version,
    description: wingetApp.description || homebrewApp.description,
    icon_url: wingetApp.icon_url || homebrewApp.icon_url,
    developer: wingetApp.developer || homebrewApp.developer,
    license: wingetApp.license || homebrewApp.license,
    // 自动去重合并数据源列表
    sources: Array.from(new Set([...wingetApp.sources, ...homebrewApp.sources])),
    // 收拢多平台支持详情到标准的 platforms 对象下
    platforms: {
      windows: wingetApp.platforms.windows.available ? wingetApp.platforms.windows : homebrewApp.platforms.windows,
      macos: homebrewApp.platforms.macos.available ? homebrewApp.platforms.macos : wingetApp.platforms.macos,
      linux: wingetApp.platforms.linux.available ? wingetApp.platforms.linux : homebrewApp.platforms.linux,
    }
  };
}

// 统一数据网关核心 API
app.get("/api/apps/:id", (c) => {
  const appId = c.req.param("id").toLowerCase();
  
  const rawWinget = MOCK_RAW_WINGET_DATABASE[appId];
  const rawHomebrew = MOCK_RAW_HOMEBREW_DATABASE[appId];

  if (!rawWinget && !rawHomebrew) {
    const errorResponse: UnifiedApiResponse = {
      code: 404,
      message: `未找到 ID 为 ${appId} 的应用`,
      data: null
    };
    return c.json(errorResponse, 404);
  }

  let finalApp: OpenStoreApp | null = null;

  if (rawWinget && rawHomebrew) {
    // 如果同时存在 WinGet 与 Homebrew 源，进行适配并深度合并
    const wingetAdapted = adaptWingetToOpenStore(rawWinget);
    const homebrewAdapted = adaptHomebrewToOpenStore(rawHomebrew);
    finalApp = mergeApps(wingetAdapted, homebrewAdapted);
  } else if (rawWinget) {
    finalApp = adaptWingetToOpenStore(rawWinget);
  } else {
    finalApp = adaptHomebrewToOpenStore(rawHomebrew!);
  }

  const response: UnifiedApiResponse<OpenStoreApp> = {
    code: 200,
    message: "success",
    data: finalApp
  };

  return c.json(response);
});

// 监听本地端口
const port = 3000;
console.log(`OpenStore 网关服务已启动：http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
