// 从所有启用的软件源获取应用列表
export const fetchAppsFromSources = async () => {
  try {
    // 从本地存储获取软件源列表
    const sourcesJson = localStorage.getItem('appSources');
    if (!sourcesJson) {
      return [];
    }

    const sources = JSON.parse(sourcesJson);
    const enabledSources = sources.filter(source => source.enabled);
    
    console.log('正在加载启用的软件源:', enabledSources.map(s => s.name));

    // 从每个启用的软件源获取应用列表
    const appsPromises = enabledSources.map(async source => {
      try {
        let apps;
        
        // 检查并处理Github URL
        let sourceUrl = source.url;
        
        // 检查是否为GitHub链接但尚未转换为raw链接
        if (sourceUrl.includes('github.com') && !sourceUrl.includes('raw.githubusercontent.com')) {
          const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/(main|master)\/(.+\.json)/i;
          const match = sourceUrl.match(githubRegex);
          
          if (match) {
            // 将GitHub普通链接转换为raw链接
            sourceUrl = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
            console.log(`自动转换GitHub链接: ${source.url} -> ${sourceUrl}`);
          }
        }
        
        if (source.isLocalBlob && source.blobSourceId) {
          // 如果是本地源，从 localStorage 获取数据
          console.log(`正在加载本地源: ${source.name} (ID: ${source.blobSourceId})`);
          const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
          const blobSource = blobSources.find(bs => bs.id === source.blobSourceId);
          
          if (blobSource) {
            console.log(`找到本地源数据: ${source.name}, 包含 ${blobSource.data ? blobSource.data.length : 0} 个应用`);
            apps = blobSource.data || [];
          } else {
            console.error(`未找到本地源数据: ${source.name} (ID: ${source.blobSourceId})`);
            apps = [];
          }
        } else {
          // 如果是远程源，从 URL 获取数据
          console.log(`正在从URL加载: ${sourceUrl}`);
          const response = await fetch(sourceUrl);
          const responseData = await response.json();
          
          if (Array.isArray(responseData)) {
            console.log(`成功从 ${source.name} 加载了 ${responseData.length} 个应用`);
            apps = responseData;
          } else {
            console.error(`从 ${source.name} 获取的数据不是数组:`, responseData);
            apps = [];
          }
        }

        // 为每个应用添加来源信息
        return apps.map(app => ({
          ...app,
          source: {
            name: source.name,
            url: source.url
          }
        }));
      } catch (error) {
        console.error(`从软件源 ${source.name} 获取应用失败:`, error);
        return [];
      }
    });

    // 等待所有请求完成并合并结果
    const appsArrays = await Promise.all(appsPromises);
    const allApps = appsArrays.flat();
    
    console.log('合并后的应用总数:', allApps.length);

    // 按应用ID去重
    const uniqueApps = allApps.reduce((acc, current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    
    console.log('去重后的应用总数:', uniqueApps.length);

    return uniqueApps;
  } catch (error) {
    console.error('获取应用列表失败:', error);
    return [];
  }
};

// 从所有软件源获取指定分类的应用
export const fetchAppsByCategory = async (category) => {
  try {
    const allApps = await fetchAppsFromSources();
    return allApps.filter(app => app.category === category);
  } catch (error) {
    console.error(`获取${category}分类应用失败:`, error);
    return [];
  }
};

// 从指定软件源获取单个应用信息
export const fetchAppFromSource = async (appId, sourceUrl) => {
  try {
    const response = await fetch(sourceUrl);
    const apps = await response.json();
    return apps.find(app => app.id === appId);
  } catch (error) {
    console.error('获取应用信息失败:', error);
    return null;
  }
};

// 验证软件源JSON格式
export const validateSourceFormat = (data) => {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(app => {
    return (
      app.id &&
      app.name &&
      app.icon &&
      app.description &&
      typeof app.price !== 'undefined' &&
      app.downloadUrl &&
      typeof app.id === 'number' &&
      typeof app.name === 'string' &&
      typeof app.icon === 'string' &&
      typeof app.description === 'string' &&
      (typeof app.price === 'number' || app.price === 0) &&
      typeof app.downloadUrl === 'string'
    );
  });
}; 