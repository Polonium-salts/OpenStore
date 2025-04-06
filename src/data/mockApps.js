// 模拟应用数据，提供应用程序展示所需的数据

// 特色应用，用于轮播展示
export const featuredApps = [
  {
    id: 1,
    name: 'Visual Studio Code',
    developer: 'Microsoft',
    description: '微软开发的强大代码编辑器，支持多种编程语言和丰富的扩展插件。',
    rating: 4.8,
    ratingCount: 124850,
    price: '免费',
    category: 'dev-tools',
    icon: 'https://code.visualstudio.com/favicon.ico',
    featuredImage: 'https://code.visualstudio.com/assets/home/home-screenshot-win.png',
    screenshots: [
      'https://code.visualstudio.com/assets/home/home-screenshot-win.png',
      'https://code.visualstudio.com/assets/docs/languages/javascript/overview.png'
    ],
    source: 'official'
  },
  {
    id: 2,
    name: 'Notion',
    developer: 'Notion Labs, Inc.',
    description: '一站式笔记、知识库和项目管理工具，支持丰富的内容编辑和团队协作。',
    rating: 4.7,
    ratingCount: 89325,
    price: '免费/订阅',
    category: 'software',
    icon: 'https://www.notion.so/front-static/favicon.ico',
    featuredImage: 'https://www.notion.so/cdn-cgi/image/format=webp,width=1080/https://img.youtube.com/vi/bOATCZGNUhM/maxresdefault.jpg',
    screenshots: [
      'https://www.notion.so/cdn-cgi/image/format=webp,width=1080/https://img.youtube.com/vi/bOATCZGNUhM/maxresdefault.jpg',
      'https://www.notion.so/cdn-cgi/image/quality=100,format=webp/front-static/pages/product/home-page-hero-refreshed-v3.png'
    ],
    source: 'cn-mirror'
  },
  {
    id: 3,
    name: 'ChatGPT',
    developer: 'OpenAI',
    description: '基于先进AI技术的对话助手，可回答问题、创作内容、提供帮助。',
    rating: 4.9,
    ratingCount: 203769,
    price: '免费/订阅',
    category: 'ai-models',
    icon: 'https://chat.openai.com/apple-touch-icon.png',
    featuredImage: 'https://static.vecteezy.com/system/resources/previews/021/608/790/original/chatgpt-logo-chat-gpt-icon-on-black-background-free-vector.jpg',
    screenshots: [
      'https://static.vecteezy.com/system/resources/previews/021/608/790/original/chatgpt-logo-chat-gpt-icon-on-black-background-free-vector.jpg',
      'https://images.unsplash.com/photo-1684391545095-231e3471c75d'
    ],
    source: 'cn-mirror'
  }
];

// 热门应用
export const topApps = [
  {
    id: 4,
    name: 'Google Chrome',
    developer: 'Google LLC',
    description: '快速、安全的网络浏览器，由Google开发。',
    rating: 4.6,
    ratingCount: 147892,
    price: '免费',
    category: 'software',
    icon: 'https://www.google.com/chrome/static/images/chrome-logo.svg',
    screenshots: [
      'https://www.google.com/chrome/static/images/homepage/homepage.png'
    ],
    source: 'official'
  },
  {
    id: 5,
    name: 'Spotify',
    developer: 'Spotify AB',
    description: '全球最大的音乐流媒体服务，提供数百万首歌曲和播客。',
    rating: 4.5,
    ratingCount: 178293,
    price: '免费/订阅',
    category: 'others',
    icon: 'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico',
    screenshots: [
      'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Design_Screenshot.png'
    ],
    source: 'official'
  },
  {
    id: 6,
    name: 'Adobe Photoshop',
    developer: 'Adobe Inc.',
    description: '专业图像编辑和设计软件。',
    rating: 4.4,
    ratingCount: 95467,
    price: '订阅',
    category: 'software',
    icon: 'https://www.adobe.com/content/dam/cc/icons/photoshop.svg',
    screenshots: [
      'https://www.adobe.com/content/dam/cc/us/en/creativecloud/photography/discover/photoshop-vs-lightroom/thumbnail.jpg'
    ],
    source: 'cn-mirror'
  }
];

// 新应用
export const newApps = [
  {
    id: 7,
    name: 'Obsidian',
    developer: 'Obsidian',
    description: '强大的知识库和笔记应用，基于本地Markdown文件。',
    rating: 4.8,
    ratingCount: 42789,
    price: '免费/付费',
    category: 'others',
    icon: 'https://obsidian.md/favicon.ico',
    screenshots: [
      'https://obsidian.md/images/screenshot.png'
    ],
    source: 'official'
  },
  {
    id: 8,
    name: 'Discord',
    developer: 'Discord Inc.',
    description: '为社区设计的语音、视频和文字聊天应用。',
    rating: 4.7,
    ratingCount: 156798,
    price: '免费',
    category: 'software',
    icon: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico',
    screenshots: [
      'https://discord.com/assets/3f43dd981da2f7064925a708d3982460.svg'
    ],
    source: 'official'
  },
  {
    id: 9,
    name: 'VLC Media Player',
    developer: 'VideoLAN',
    description: '免费开源的跨平台多媒体播放器，可播放大多数多媒体文件。',
    rating: 4.6,
    ratingCount: 87456,
    price: '免费',
    category: 'software',
    icon: 'https://www.videolan.org/images/vlc-logo.png',
    screenshots: [
      'https://www.videolan.org/images/vlc-ios-appletv/playlist-4.0.jpg'
    ],
    source: 'cn-mirror'
  }
];

// 工作应用
export const workApps = [
  {
    id: 10,
    name: 'Microsoft Office',
    developer: 'Microsoft',
    description: '微软办公套件，包括Word、Excel、PowerPoint等应用。',
    rating: 4.7,
    ratingCount: 203456,
    price: '订阅',
    category: 'software',
    icon: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b',
    screenshots: [
      'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWOeOY'
    ],
    source: 'official'
  },
  {
    id: 11,
    name: 'Slack',
    developer: 'Slack Technologies',
    description: '团队协作工具，提供组织沟通和工作管理功能。',
    rating: 4.5,
    ratingCount: 123789,
    price: '免费/订阅',
    category: 'software',
    icon: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    screenshots: [
      'https://a.slack-edge.com/0f40c/marketing/img/features/desktop/desktop-product-ui-get-more-done.ko-KR.png'
    ],
    source: 'official'
  },
  {
    id: 12,
    name: 'Trello',
    developer: 'Atlassian',
    description: '可视化项目管理工具，使用看板方法组织任务。',
    rating: 4.4,
    ratingCount: 89764,
    price: '免费/订阅',
    category: 'software',
    icon: 'https://trello.com/favicon.ico',
    screenshots: [
      'https://images.ctfassets.net/rz1oowkt5gyp/75rDABL8fyMtNLJPtI5hZa/8f52a51713c627d165fe1eb975812555/hero-2.png'
    ],
    source: 'cn-mirror'
  }
];

// 游戏应用
export const gameApps = [
  {
    id: 13,
    name: 'Minecraft',
    developer: 'Mojang Studios',
    description: '开放世界沙盒游戏，玩家可以探索、建造和创造。',
    rating: 4.8,
    ratingCount: 345678,
    price: '付费',
    category: 'games',
    icon: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_Minecraft-300x365.jpg',
    screenshots: [
      'https://www.minecraft.net/content/dam/minecraft/home/home-hero-1200x600.jpg'
    ],
    source: 'official'
  },
  {
    id: 14,
    name: 'Steam',
    developer: 'Valve Corporation',
    description: '数字游戏分发平台，提供大量PC游戏和社区功能。',
    rating: 4.7,
    ratingCount: 254789,
    price: '免费',
    category: 'games',
    icon: 'https://store.steampowered.com/favicon.ico',
    screenshots: [
      'https://cdn.cloudflare.steamstatic.com/store/home/store_home_share.jpg'
    ],
    source: 'official'
  },
  {
    id: 15,
    name: 'Among Us',
    developer: 'InnerSloth',
    description: '多人在线派对游戏，玩家合作完成任务或找出内鬼。',
    rating: 4.6,
    ratingCount: 187456,
    price: '付费',
    category: 'games',
    icon: 'https://play-lh.googleusercontent.com/8ddL1kuoNUB5vUvgDVjYY3_6HwQcrg1K2fd_R8soD-e2QYj8fT9cfhfh3G0hnSruLKec',
    screenshots: [
      'https://cdn.cloudflare.steamstatic.com/steam/apps/945360/ss_47f3523dbf251a6f142e4912d82f1c58cc9a3944.1920x1080.jpg'
    ],
    source: 'cn-mirror'
  }
];

// AI 大模型应用
export const aiApps = [
  {
    id: 16,
    name: 'Claude',
    developer: 'Anthropic',
    description: 'Anthropic开发的对话式AI助手，注重安全和有用性。',
    rating: 4.7,
    ratingCount: 45678,
    price: '免费/订阅',
    category: 'ai-models',
    icon: 'https://claude.ai/favicon.ico',
    screenshots: [
      'https://assets-global.website-files.com/639d36b8b8b42a18d3edfeae/649b2361be0fd38a0d1a9ac1_Homepage%20(1).png'
    ],
    source: 'official'
  },
  {
    id: 17,
    name: 'Midjourney',
    developer: 'Midjourney, Inc.',
    description: '由AI驱动的图像生成工具，通过文本描述创作艺术作品。',
    rating: 4.8,
    ratingCount: 78945,
    price: '订阅',
    category: 'ai-models',
    icon: 'https://www.midjourney.com/apple-touch-icon.png',
    screenshots: [
      'https://cdn.midjourney.com/12c7b25e-79d5-4ecc-805e-e5a642a0c216/0_1.png'
    ],
    source: 'official'
  },
  {
    id: 18,
    name: 'Stable Diffusion',
    developer: 'Stability AI',
    description: '开源AI图像生成模型，能从文本描述创建详细图像。',
    rating: 4.6,
    ratingCount: 56789,
    price: '免费/开源',
    category: 'ai-models',
    icon: 'https://stability.ai/favicon.ico',
    screenshots: [
      'https://cdn.sparrowai.com/sdk-ui-desktop-stable-diffusion.png'
    ],
    source: 'cn-mirror'
  }
]; 