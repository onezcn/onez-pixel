import React from 'react';
import ReactDOM from 'react-dom/client';
import StaticApp from './StaticApp.tsx';
import './index.css';
import gameController from './gameController.ts';

// OnezGame 配置接口
export interface OnezGameConfig {
  // 容器元素 ID 或元素本身
  container?: string | HTMLElement;
  // 素材基础路径
  assetsBaseUrl?: string;
  // 是否显示 UI 覆盖层
  showUI?: boolean;
  // 自定义标题
  title?: string;
  // 自定义提示文字
  hint?: string;
  // 背景色
  backgroundColor?: number;
}

// 默认配置
const defaultConfig: Required<Omit<OnezGameConfig, 'container'>> & { container?: string | HTMLElement } = {
  container: 'onezgame-container',
  assetsBaseUrl: '/assets',
  showUI: true,
  title: 'AI Town - Static',
  hint: '使用 WASD 或方向键移动角色',
  backgroundColor: 0x7ab5ff,
};

// 全局 OnezGame 类
class OnezGame {
  private config: OnezGameConfig;
  private root: ReactDOM.Root | null = null;
  private containerElement: HTMLElement | null = null;

  constructor(config: OnezGameConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 初始化游戏
  init() {
    // 获取容器元素
    let container: HTMLElement | null = null;
    
    if (typeof this.config.container === 'string') {
      container = document.getElementById(this.config.container);
      if (!container) {
        // 如果找不到，尝试创建
        container = document.createElement('div');
        container.id = this.config.container;
        document.body.appendChild(container);
      }
    } else if (this.config.container instanceof HTMLElement) {
      container = this.config.container;
    } else {
      // 默认使用 body
      container = document.body;
    }

    this.containerElement = container;

    // 设置容器样式
    if (container !== document.body) {
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
    }

    // 应用素材基础路径到全局配置
    if (this.config.assetsBaseUrl) {
      (window as any).__ONEZGAME_ASSETS_BASE__ = this.config.assetsBaseUrl;
    }

    // 创建 React 根
    this.root = ReactDOM.createRoot(container);

    // 渲染游戏
    this.root.render(
      React.createElement(StaticApp, {
        config: this.config,
      })
    );
  }

  // 销毁游戏
  destroy() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.containerElement && this.containerElement !== document.body) {
      this.containerElement.remove();
    }
  }

  // 更新配置
  updateConfig(config: Partial<OnezGameConfig>) {
    this.config = { ...this.config, ...config };
    // 如果游戏已初始化，重新初始化
    if (this.root) {
      this.destroy();
      this.init();
    }
  }
}

// 导出全局函数和类
export default OnezGame;

// 全局命名空间
declare global {
  interface Window {
    OnezGame: typeof OnezGame;
    onezgame: OnezGame | null;
    // OnezGameController 和 onezGameController 在 gameController.ts 中声明
  }
}

// 如果在浏览器环境中，注册到全局
if (typeof window !== 'undefined') {
  window.OnezGame = OnezGame;
  
  // 确保控制器已注册到全局（gameController 模块会在导入时自动注册）
  // 这里只是确保类型正确，实际的注册在 gameController.ts 中完成
  if (!window.onezGameController && gameController) {
    window.onezGameController = gameController;
  }
  
  // 便捷的初始化函数
  (window as any).onezgame = function(config?: OnezGameConfig) {
    const game = new OnezGame(config);
    game.init();
    window.onezgame = game;
    return game;
  };
  
  // 确保控制器在游戏初始化后可用
  // 延迟检查，因为模块可能还在加载
  setTimeout(() => {
    if (!window.onezGameController) {
      console.warn('OnezGameController 未找到，请确保 gameController 模块已正确加载');
    }
  }, 100);
}

