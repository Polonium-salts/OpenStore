/**
 * Winget (winget.run) 到 OpenStore 统一 API 的转换适配器
 */

const BASE_URL = "https://api.winget.run/v2";

/**
 * 搜索应用
 * @param {string} query 搜索关键词
 * @returns {Promise<Array>} 符合 OpenStore 标准的应用列表
 */
export async function searchApps(query) {
  try {
    const url = query ? `${BASE_URL}/packages?query=${encodeURIComponent(query)}` : `${BASE_URL}/packages`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Winget API Error");
    
    const data = await res.json();
    const packages = data.Packages || [];
    
    const promises = packages.map(async (pkg) => {
      const latest = pkg.Latest || {};
      const firstDot = pkg.Id.indexOf(".");
      let publisher = "";
      let name = "";
      if (firstDot !== -1) {
        publisher = pkg.Id.substring(0, firstDot);
        name = pkg.Id.substring(firstDot + 1);
      } else {
        publisher = latest.Publisher || pkg.Id;
        name = latest.Name || pkg.Id;
      }
      
      const version = pkg.Versions && pkg.Versions[0] ? pkg.Versions[0] : "Latest";
      let installers = [];
      
      if (version && version !== "Latest") {
        try {
          const pubChar = publisher[0].toLowerCase();
          // 尝试构建官方社区 manifests 的 URL 获取 installer 安装包链接
          const yamlUrl = `https://raw.githubusercontent.com/microsoft/winget-pkgs/master/manifests/${pubChar}/${publisher}/${name}/${version}/${publisher}.${name}.installer.yaml`;
          
          const yamlRes = await fetch(yamlUrl);
          if (yamlRes.ok) {
            const yamlText = await yamlRes.text();
            const lines = yamlText.split("\n");
            let currentInstaller = {};
            for (let line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("- Architecture:") || trimmed.startsWith("Architecture:")) {
                if (currentInstaller.url) {
                  installers.push(currentInstaller);
                }
                const parts = trimmed.split(":");
                currentInstaller = { arch: parts[1] ? parts[1].trim() : "x64" };
              } else if (trimmed.startsWith("InstallerUrl:")) {
                const urlVal = trimmed.substring(trimmed.indexOf(":") + 1).trim();
                currentInstaller.url = urlVal;
              }
            }
            if (currentInstaller.url) {
              installers.push(currentInstaller);
            }
          }
        } catch (e) {
          console.warn("Failed to fetch installer manifest for", pkg.Id, e);
        }
      }

      // 转换为 OpenStore 资产列表格式
      const assets = installers.map((inst) => {
        const fileExt = inst.url.split("?")[0].split(".").pop() || "exe";
        return {
          name: `${publisher}.${name}_${inst.arch}.${fileExt}`,
          browser_download_url: inst.url,
          size: 0
        };
      });

      return {
        app_id: pkg.Id,
        title: latest.Name || pkg.Id,
        owner: publisher,
        repo: name,
        publisher: latest.Publisher || publisher,
        description: latest.Description || "暂无描述",
        url: latest.Homepage || "",
        version: version,
        readme: latest.Description || "暂无详细描述",
        tags: latest.Tags || [],
        category: "WinGet 工具",
        stars: 0,
        language: "C++",
        icon: pkg.IconUrl || pkg.Logo || "",
        assets: assets,
        license: latest.License || "商业/闭源专有",
        createdAt: pkg.CreatedAt || pkg.createdAt || "",
        updatedAt: pkg.UpdatedAt || pkg.updatedAt || "",
        versionsCount: pkg.Versions ? pkg.Versions.length : 0
      };
    });

    return await Promise.all(promises);
  } catch (err) {
    console.error("搜索 Winget 失败:", err);
    return [];
  }
}
