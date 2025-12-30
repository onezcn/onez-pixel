// Based on https://codepen.io/inlet/pen/yLVmPWv.
// Copyright (c) 2018 Patrick Brouwer, distributed under the MIT license.

import { PixiComponent, useApp } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import { Application } from 'pixi.js';
import { MutableRefObject, ReactNode } from 'react';

export type ViewportProps = {
  app: Application;
  viewportRef?: MutableRefObject<Viewport | undefined>;

  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  children?: ReactNode;
};

// https://davidfig.github.io/pixi-viewport/jsdoc/Viewport.html
export default PixiComponent('Viewport', {
  create(props: ViewportProps) {
    const { app, children, viewportRef, ...viewportProps } = props;
    
    // 确保 app.renderer.events 存在
    if (!app || !app.renderer || !app.renderer.events) {
      console.error('PixiViewport: app.renderer.events is not available');
      // 创建一个基本的 viewport，即使没有 events
      const viewport = new Viewport({
        passiveWheel: false,
        ...viewportProps,
      } as any);
      if (viewportRef) {
        viewportRef.current = viewport;
      }
      return viewport;
    }
    
    const events = app.renderer.events;
    const viewport = new Viewport({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      events,
      passiveWheel: false,
      ...viewportProps,
    });
    
    // 重写 destroy 方法，在销毁前检查 events 是否仍然有效
    const originalDestroy = viewport.destroy.bind(viewport);
    viewport.destroy = function(options?: any) {
      try {
        // 检查 events 是否仍然有效（通过检查是否有 removeEventListener 方法）
        const eventsValid = events && 
          (events as any).removeEventListener && 
          typeof (events as any).removeEventListener === 'function';
        
        if (eventsValid) {
          originalDestroy(options);
        } else {
          // 如果 events 已经无效，手动清理，避免调用 input.destroy()
          try {
            // 从父容器移除
            if ((this as any).parent) {
              (this as any).parent.removeChild(this);
            }
            // 清理插件引用
            if ((this as any).plugins) {
              try {
                (this as any).plugins.remove('drag');
                (this as any).plugins.remove('pinch');
                (this as any).plugins.remove('wheel');
                (this as any).plugins.remove('decelerate');
                (this as any).plugins.remove('clamp');
                (this as any).plugins.remove('clamp-zoom');
              } catch (e) {
                // 忽略插件清理错误
              }
            }
            // 标记为已销毁
            (this as any).destroyed = true;
          } catch (e) {
            // 忽略清理错误
          }
        }
      } catch (error) {
        // 忽略销毁错误
        console.warn('Viewport destroy warning:', error);
      }
    };
    
    if (viewportRef) {
      viewportRef.current = viewport;
    }
    // Activate plugins
    try {
      viewport
        .drag()
        .pinch({})
        .wheel()
        .decelerate()
        .clamp({ direction: 'all', underflow: 'center' })
        .setZoom(-10)
        .clampZoom({
          minScale: (1.04 * props.screenWidth) / (props.worldWidth / 2),
          maxScale: 3.0,
        });
    } catch (error) {
      console.warn('PixiViewport: Error activating plugins:', error);
    }
    return viewport;
  },
  applyProps(viewport, oldProps: any, newProps: any) {
    Object.keys(newProps).forEach((p) => {
      if (p !== 'app' && p !== 'viewportRef' && p !== 'children' && oldProps[p] !== newProps[p]) {
        // @ts-expect-error Ignoring TypeScript here
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        viewport[p] = newProps[p];
      }
    });
  },
});
