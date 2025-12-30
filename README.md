# ⚡ Onez Pixel (佳蓝像素引擎)

> 专为 AI 交互与社区插件打造的轻量级像素游戏引擎。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()

**Onez Pixel** 是 [OnezGame](https://github.com/your-org/onezgame) 旗下的像素化极速分支。它剥离了复杂的后端逻辑，提供了一个基于 PixiJS 的纯前端渲染微内核。

旨在帮助开发者通过 CDN 极速构建 **MVP 级像素游戏**、**论坛伴侣插件** 或 **AI 可视化社区**。

## ✨ 核心特性

*   🎨 **开箱即用的像素流**：内置基于 Tiled 的地图解析与图层管理系统。
*   🚀 **CDN 极速集成**：无需 Webpack/Vite 配置，一个 `<script>` 标签即可运行。
*   🤖 **AI 友好型架构**：专为 LLM 驱动的 NPC 设计，内置状态机（闲逛、对话、寻路）。
*   📱 **全端适配**：自动处理 DPI 缩放与移动端触摸事件。
*   🎭 **多角色编排**：支持海量 NPC 同屏渲染与行为控制。

## 📦 安装

### 方式一：CDN 引入（推荐用于插件/MVP）

无需安装任何依赖，直接在 HTML 中引入构建好的文件：

```html
<!-- 引入样式 -->
<link rel="stylesheet" href="https://cdn.your-domain.com/onezgame.css">
<!-- 引入脚本 -->
<script src="https://cdn.your-domain.com/onezgame.min.js"></script>
```

### 方式二：NPM 安装（推荐用于 React/Vue 项目）

```bash
npm install onez-pixel
```

## 🚀 3分钟快速上手

创建一个 `index.html`，复制以下代码即可看到一个完整的像素世界：

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        #game-root { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="game-root"></div>
    
    <script src="./dist/cdn/onezgame.min.js"></script>
    <script>
        // 1. 初始化引擎
        const game = window.onezgame({
            container: 'game-root',     // 挂载节点
            assetsBaseUrl: './assets',  // 素材目录
            showUI: true,               // 是否显示默认UI
            title: 'Onez Community',    // 游戏标题
            backgroundColor: 0x7ab5ff   // 天空蓝背景
        });

        // 2. 等待加载完成后添加 NPC
        game.on('ready', () => {
            // 添加一个名为 "Admin" 的 NPC
            window.onezGameController.addNPC({
                id: 'admin_01',
                x: 10, y: 10,
                characterName: 'f1',    // 对应 assets 中的角色ID
                displayName: '社区管理员',
                behavior: 'patrol'      // 行为：巡逻
            });
            
            console.log("像素世界已启动！");
        });
    </script>
</body>
</html>
```

## 🎮 控制器 API (GameController)

引擎暴露了全局对象 `window.onezGameController` 用于与外部业务逻辑交互：

```javascript
// ➤ 添加角色
controller.addNPC({
    id: 'user_123',
    x: 15, y: 20,
    characterName: 'f1',
    behavior: 'random' // 随机游走
});

// ➤ 强制移动 (例如响应论坛新帖事件)
controller.moveNPCTo('user_123', 25, 25);

// ➤ 气泡说话 (支持打字机效果)
controller.npcSpeak('user_123', '这也太酷了吧！', 3000);

// ➤ 销毁角色
controller.removeNPC('user_123');
```

## 📂 素材目录规范

为了引擎能正确加载资源，请确保你的 `assetsBaseUrl` 目录下包含以下结构：

```text
/assets
  ├── gentle-obj.png         # [必需] 地图瓦片集 (Tileset)
  ├── 32x32folk.png          # [必需] 角色精灵表 (Spritesheet)
  └── spritesheets/          # [可选] 场景动画
      ├── campfire.png
      └── windmill.png
```

## 📄 许可证与版权说明 (License & Credits)

本项目采用 **双重许可模式**，请仔细阅读：

### 1. 源代码 (Source Code)
引擎核心代码采用 **MIT License**。
您可以免费用于商业项目，修改或闭源使用，仅需保留代码中的版权声明。

> Copyright (c) 2024 OnezGame Team

### 2. 默认演示素材 (Default Assets)
本项目 `public/assets` 目录下自带的演示素材受不同的开源协议保护。**如果您在商业产品中使用这些素材，必须遵守其原始协议（通常需要署名）。**

*   **Tileset / Map Assets**:
    *   *16x16 Game Assets* by [George Bailey](https://opengameart.org/content/16x16-game-assets) (CC-BY 3.0)
    *   *16x16 RPG Tileset* by [hilau](https://opengameart.org/content/16x16-rpg-tileset) (CC-BY 3.0)
*   **Characters**:
    *   *Tiny RPG Forest* by [ansimuz](https://opengameart.org/content/tiny-rpg-forest) (CC-BY 3.0)
*   **UI Elements**:
    *   *Pixel Art GUI* by [Mounir Tohami](https://mounirtohami.itch.io/)

**⚠️ 商业使用建议**：建议在正式发布产品时，替换为 OnezGame 提供的无版权素材或您购买的商业素材，以避免复杂的署名义务。

### 3. 致谢 (Acknowledgements)
本项目核心架构灵感与部分基础代码衍生自 **[AI Town](https://github.com/a16z-infra/ai-town)** (MIT License)。感谢 a16z-infra 团队对开源社区的贡献。

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/onezcn">Onez Team</a>
</p>
```