/**
 * 图标服务 - 提供根据应用名称和类别自动匹配图标的功能
 */

// 图标类别映射
const CATEGORY_ICONS = {
  'software': 'https://cdn-icons-png.flaticon.com/512/2099/2099174.png',
  'utilities': 'https://cdn-icons-png.flaticon.com/512/2099/2099174.png',
  'games': 'https://cdn-icons-png.flaticon.com/512/1083/1083822.png',
  'productivity': 'https://cdn-icons-png.flaticon.com/512/2621/2621070.png',
  'development': 'https://cdn-icons-png.flaticon.com/512/6062/6062646.png',
  'education': 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png',
  'entertainment': 'https://cdn-icons-png.flaticon.com/512/4315/4315512.png',
  'ai-models': 'https://cdn-icons-png.flaticon.com/512/8637/8637.png',
  'default': 'https://cdn-icons-png.flaticon.com/512/732/732250.png'
};

// 常见应用图标映射
const APP_ICONS = {
  // 开发工具
  'vscode': 'https://cdn.icon-icons.com/icons2/2107/PNG/512/file_type_vscode_icon_130084.png',
  'visual studio code': 'https://cdn.icon-icons.com/icons2/2107/PNG/512/file_type_vscode_icon_130084.png',
  'visual studio': 'https://cdn.icon-icons.com/icons2/2415/PNG/512/visualstudio_plain_logo_icon_146377.png',
  'github': 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  'git': 'https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png',
  'node': 'https://cdn-icons-png.flaticon.com/512/919/919825.png',
  'nodejs': 'https://cdn-icons-png.flaticon.com/512/919/919825.png',
  'npm': 'https://cdn-icons-png.flaticon.com/512/5968/5968322.png',
  'react': 'https://cdn-icons-png.flaticon.com/512/919/919851.png',
  'angular': 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
  'vue': 'https://cdn-icons-png.flaticon.com/512/4926/4926464.png',
  'javascript': 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
  'python': 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
  'java': 'https://cdn-icons-png.flaticon.com/512/226/226777.png',

  // 多媒体和娱乐
  'vlc': 'https://cdn-icons-png.flaticon.com/512/732/732250.png',
  'spotify': 'https://cdn-icons-png.flaticon.com/512/2111/2111624.png',
  'netflix': 'https://cdn-icons-png.flaticon.com/512/5977/5977590.png',
  'youtube': 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',

  // 生产力工具
  'microsoft office': 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
  'office': 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
  'word': 'https://cdn-icons-png.flaticon.com/512/732/732226.png',
  'excel': 'https://cdn-icons-png.flaticon.com/512/732/732220.png',
  'powerpoint': 'https://cdn-icons-png.flaticon.com/512/732/732224.png',
  'adobe': 'https://cdn-icons-png.flaticon.com/512/5968/5968428.png',
  'photoshop': 'https://cdn-icons-png.flaticon.com/512/5968/5968520.png',
  'illustrator': 'https://cdn-icons-png.flaticon.com/512/5968/5968472.png',
  'premiere': 'https://cdn-icons-png.flaticon.com/512/5968/5968525.png',
  'aftereffects': 'https://cdn-icons-png.flaticon.com/512/5968/5968428.png',

  // 浏览器
  'chrome': 'https://cdn-icons-png.flaticon.com/512/732/732205.png',
  'firefox': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
  'safari': 'https://cdn-icons-png.flaticon.com/512/732/732210.png',
  'edge': 'https://cdn-icons-png.flaticon.com/512/5968/5968890.png',
  'opera': 'https://cdn-icons-png.flaticon.com/512/732/732233.png',

  // 通讯工具
  'skype': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
  'zoom': 'https://cdn-icons-png.flaticon.com/512/4138/4138623.png',
  'slack': 'https://cdn-icons-png.flaticon.com/512/2111/2111615.png',
  'teams': 'https://cdn-icons-png.flaticon.com/512/2504/2504903.png',
  'discord': 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
  'whatsapp': 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
  'telegram': 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
  'messenger': 'https://cdn-icons-png.flaticon.com/512/5968/5968772.png',

  // 游戏
  'steam': 'https://cdn-icons-png.flaticon.com/512/3670/3670382.png',
  'epic': 'https://cdn-icons-png.flaticon.com/512/5969/5969113.png',
  'epic games': 'https://cdn-icons-png.flaticon.com/512/5969/5969113.png',
  'minecraft': 'https://cdn-icons-png.flaticon.com/512/2989/2989972.png',
  'roblox': 'https://cdn-icons-png.flaticon.com/512/5969/5969272.png',
  'fortnite': 'https://cdn-icons-png.flaticon.com/512/3570/3570254.png',

  // AI 模型
  'chatgpt': 'https://cdn-icons-png.flaticon.com/512/4336/4336844.png',
  'gpt': 'https://cdn-icons-png.flaticon.com/512/4336/4336844.png',
  'llama': 'https://cdn-icons-png.flaticon.com/512/7016/7016575.png',
  'stable diffusion': 'https://cdn-icons-png.flaticon.com/512/10212/10212240.png',
  'midjourney': 'https://cdn-icons-png.flaticon.com/512/6295/6295417.png',
  'copilot': 'https://cdn-icons-png.flaticon.com/512/2721/2721310.png',
  'github copilot': 'https://cdn-icons-png.flaticon.com/512/2721/2721310.png',
};

// 关键词匹配图标映射
const KEYWORD_ICONS = {
  'chat': 'https://cdn-icons-png.flaticon.com/512/6571/6571852.png',
  'music': 'https://cdn-icons-png.flaticon.com/512/7566/7566380.png',
  'video': 'https://cdn-icons-png.flaticon.com/512/1179/1179069.png',
  'movie': 'https://cdn-icons-png.flaticon.com/512/2991/2991406.png',
  'photo': 'https://cdn-icons-png.flaticon.com/512/1375/1375106.png',
  'image': 'https://cdn-icons-png.flaticon.com/512/1375/1375106.png',
  'editor': 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png',
  'text': 'https://cdn-icons-png.flaticon.com/512/2911/2911228.png',
  'code': 'https://cdn-icons-png.flaticon.com/512/1005/1005141.png',
  'browser': 'https://cdn-icons-png.flaticon.com/512/718/718064.png',
  'download': 'https://cdn-icons-png.flaticon.com/512/3031/3031707.png',
  'system': 'https://cdn-icons-png.flaticon.com/512/892/892916.png',
  'tool': 'https://cdn-icons-png.flaticon.com/512/1186/1186500.png',
  'utility': 'https://cdn-icons-png.flaticon.com/512/2099/2099174.png',
  'game': 'https://cdn-icons-png.flaticon.com/512/3612/3612569.png',
  'security': 'https://cdn-icons-png.flaticon.com/512/2346/2346112.png',
  'antivirus': 'https://cdn-icons-png.flaticon.com/512/4149/4149878.png',
  'backup': 'https://cdn-icons-png.flaticon.com/512/1091/1091916.png',
  'mail': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
  'email': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
  'calendar': 'https://cdn-icons-png.flaticon.com/512/2738/2738255.png',
  'note': 'https://cdn-icons-png.flaticon.com/512/3075/3075908.png',
  'ai': 'https://cdn-icons-png.flaticon.com/512/2103/2103652.png',
  'meeting': 'https://cdn-icons-png.flaticon.com/512/9255/9255333.png',
  'vpn': 'https://cdn-icons-png.flaticon.com/512/6017/6017588.png',
  'remote': 'https://cdn-icons-png.flaticon.com/512/4149/4149706.png',
  'network': 'https://cdn-icons-png.flaticon.com/512/1239/1239682.png',
  'social': 'https://cdn-icons-png.flaticon.com/512/6928/6928929.png',
};

/**
 * 根据应用名称和类别智能匹配图标
 * @param {Object} app 应用对象，包含name和category属性
 * @returns {string} 图标URL
 */
export function getSmartIcon(app) {
  if (!app) return CATEGORY_ICONS.default;
  
  // 如果应用已经有图标，则直接使用
  if (app.icon && app.icon.length > 0 && !app.icon.includes('placeholder')) {
    return app.icon;
  }

  const appName = app.name.toLowerCase();
  const appCategory = app.category ? app.category.toLowerCase() : '';
  
  // 1. 先尝试根据应用名称精确匹配
  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (appName === key || appName.includes(key)) {
      return icon;
    }
  }
  
  // 2. 尝试关键词匹配
  for (const [keyword, icon] of Object.entries(KEYWORD_ICONS)) {
    if (appName.includes(keyword)) {
      return icon;
    }
  }
  
  // 3. 根据类别匹配
  if (appCategory && CATEGORY_ICONS[appCategory]) {
    return CATEGORY_ICONS[appCategory];
  }
  
  // 4. 返回默认图标
  return CATEGORY_ICONS.default;
}

/**
 * 验证图标URL是否有效
 * @param {string} iconUrl 图标URL
 * @returns {Promise<boolean>} 是否有效
 */
export function validateIconUrl(iconUrl) {
  return new Promise((resolve) => {
    if (!iconUrl || iconUrl.trim() === '') {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = iconUrl;
  });
}

export default {
  getSmartIcon,
  validateIconUrl,
  CATEGORY_ICONS,
  APP_ICONS,
  KEYWORD_ICONS
}; 