import { useRef, useState, useEffect } from 'react';
import { PixiStaticMap } from './PixiStaticMap.tsx';
import PixiViewport from './PixiViewport.tsx';
import { Character } from './Character.tsx';
import { useApp } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import { Stage } from '@pixi/react';
import * as PIXI from 'pixi.js';
import * as gentleMap from '../../data/gentle.js';
import { WorldMap } from '../engine/worldMap.ts';
import { characters } from '../../data/characters.ts';
import { orientationDegrees } from '../engine/geometry.ts';
import { getAssetPath } from '../utils/assets.ts';
import type { OnezGameConfig } from '../onezgame.ts';
import gameController, { type NPCState } from '../gameController.ts';

// 创建静态世界地图
function createStaticWorldMap(config?: OnezGameConfig): WorldMap {
  // 获取 tileset 路径，支持配置的基础路径
  let tileSetUrl = gentleMap.tilesetpath;
  if (config?.assetsBaseUrl) {
    // 从 /assets/gentle-obj.png 提取路径部分
    const path = tileSetUrl.replace(/^\/assets/, '');
    tileSetUrl = getAssetPath(path);
  }
  
  return new WorldMap({
    width: gentleMap.screenxtiles,
    height: gentleMap.screenytiles,
    tileSetUrl,
    tileSetDimX: gentleMap.tilesetpxw,
    tileSetDimY: gentleMap.tilesetpxh,
    tileDim: gentleMap.tiledim,
    bgTiles: gentleMap.bgtiles,
    objectTiles: gentleMap.objmap,
    animatedSprites: gentleMap.animatedsprites,
  });
}

// 玩家状态
interface PlayerState {
  x: number; // 瓦片坐标
  y: number; // 瓦片坐标
  dx: number; // 方向向量
  dy: number;
  speed: number;
  isMoving: boolean;
}

export default function StaticGame({ 
  width, 
  height,
  config 
}: { 
  width: number; 
  height: number;
  config?: OnezGameConfig;
}) {
  const pixiApp = useApp();
  const viewportRef = useRef<Viewport | undefined>();
  const [worldMap] = useState(() => createStaticWorldMap(config));
  
  // 视口状态（用于气泡边界检测）
  const [viewportState, setViewportState] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  // 玩家状态
  const [playerState, setPlayerState] = useState<PlayerState>({
    x: Math.floor(worldMap.width / 2),
    y: Math.floor(worldMap.height / 2),
    dx: 0,
    dy: 1,
    speed: 0,
    isMoving: false,
  });

  const keys = useRef<Set<string>>(new Set());
  // NPC 状态列表（从控制器获取）
  const [npcs, setNpcs] = useState<NPCState[]>([]);
  
  // 获取角色，并应用配置的素材路径
  const basePlayerCharacter = characters.find(c => c.name === 'f1') || characters[0];
  const playerCharacter = {
    ...basePlayerCharacter,
    textureUrl: config?.assetsBaseUrl 
      ? getAssetPath('/32x32folk.png')
      : basePlayerCharacter.textureUrl,
  };

  // 监听控制器的 NPC 更新（仅当控制器主动更新时，如添加/删除 NPC）
  useEffect(() => {
    const unsubscribe = gameController.onNPCUpdate((updatedNpcs) => {
      // 只更新 NPC 列表，不触发位置更新通知
      setNpcs([...updatedNpcs]);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 同步玩家状态到控制器
  useEffect(() => {
    gameController.notifyPlayerUpdate({
      x: playerState.x,
      y: playerState.y,
      dx: playerState.dx,
      dy: playerState.dy,
      isMoving: playerState.isMoving,
    });
  }, [playerState.x, playerState.y, playerState.dx, playerState.dy, playerState.isMoving]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      updatePlayerMovement();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      updatePlayerMovement();
    };

    const updatePlayerMovement = () => {
      const k = keys.current;
      let dx = 0;
      let dy = 0;
      let isMoving = false;

      if (k.has('w') || k.has('arrowup')) {
        dy = -1;
        isMoving = true;
      }
      if (k.has('s') || k.has('arrowdown')) {
        dy = 1;
        isMoving = true;
      }
      if (k.has('a') || k.has('arrowleft')) {
        dx = -1;
        isMoving = true;
      }
      if (k.has('d') || k.has('arrowright')) {
        dx = 1;
        isMoving = true;
      }

      setPlayerState(prev => ({
        ...prev,
        dx: dx || (dx === 0 && dy === 0 ? 0 : prev.dx), // 只有在没有按键时才保持方向
        dy: dy || (dx === 0 && dy === 0 ? 0 : prev.dy),
        isMoving,
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 游戏循环 - 使用原版速度 0.75 tiles per second
    const MOVEMENT_SPEED = 0.75; // tiles per second (从 characters.ts 的 movementSpeed)
    const TICK_DURATION = 16; // ms per frame
    
    const gameLoop = () => {
      // 更新玩家位置
      setPlayerState(prev => {
        if (!prev.isMoving) return prev;

        // 0.75 tiles per second = 0.75 / 1000 * 16 tiles per frame
        const delta = (MOVEMENT_SPEED * TICK_DURATION) / 1000;
        const newX = prev.x + prev.dx * delta;
        const newY = prev.y + prev.dy * delta;

        // 边界检查
        const clampedX = Math.max(0, Math.min(worldMap.width - 1, newX));
        const clampedY = Math.max(0, Math.min(worldMap.height - 1, newY));

        return {
          ...prev,
          x: clampedX,
          y: clampedY,
        };
      });

      // 设置世界地图到控制器（用于寻路）
      if (gameController && worldMap) {
        (gameController as any).setWorldMap(worldMap);
      }

      // 更新所有 NPC 位置（从控制器获取最新状态）
      const currentNpcs = gameController.getNPCs();
      if (currentNpcs.length > 0) {
        const updates = new Map<string, Partial<NPCState>>();
        
        // 先处理 AI 行为（跟随、巡逻等），更新方向
        const player = gameController.getPlayer();
        currentNpcs.forEach(npc => {
          if (npc.behavior === 'follow' && player) {
            const playerTileX = Math.floor(player.x);
            const playerTileY = Math.floor(player.y);
            const npcTileX = Math.floor(npc.x);
            const npcTileY = Math.floor(npc.y);

            if (playerTileX !== npcTileX || playerTileY !== npcTileY) {
              const calcDx = playerTileX > npcTileX ? 1 : playerTileX < npcTileX ? -1 : 0;
              const calcDy = playerTileY > npcTileY ? 1 : playerTileY < npcTileY ? -1 : 0;
              
              // 只有方向真正改变时才更新，避免频繁切换方向导致闪烁
              if (calcDx !== npc.dx || calcDy !== npc.dy) {
                const update = updates.get(npc.id) || {};
                update.dx = calcDx;
                update.dy = calcDy;
                update.isMoving = true;
                updates.set(npc.id, update);
              }
            } else {
              const update = updates.get(npc.id) || {};
              update.isMoving = false;
              update.dx = 0;
              update.dy = 0;
              updates.set(npc.id, update);
            }
          } else if (npc.behavior === 'patrol') {
            // 巡逻行为：在目标点之间移动
            if (npc.targetX !== undefined && npc.targetY !== undefined) {
              const dx = npc.targetX - npc.x;
              const dy = npc.targetY - npc.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 0.5) {
                // 到达目标，选择新目标（简化处理）
                npc.targetX = Math.floor(Math.random() * worldMap.width);
                npc.targetY = Math.floor(Math.random() * worldMap.height);
              }
              
              const calcDx = npc.targetX > npc.x ? 1 : npc.targetX < npc.x ? -1 : 0;
              const calcDy = npc.targetY > npc.y ? 1 : npc.targetY < npc.y ? -1 : 0;
              
              // 只有方向真正改变时才更新
              if (calcDx !== npc.dx || calcDy !== npc.dy) {
                const update = updates.get(npc.id) || {};
                update.dx = calcDx;
                update.dy = calcDy;
                update.isMoving = true;
                updates.set(npc.id, update);
              }
            }
          } else if (npc.behavior === 'random') {
            // 随机游走：保持当前方向，不频繁改变
            // 方向改变由其他逻辑处理
          }
        });

        // 然后更新移动中的 NPC 位置
        currentNpcs.forEach(npc => {
          if (!npc.isMoving) return;
          
          const delta = (MOVEMENT_SPEED * TICK_DURATION) / 1000;
          const newX = npc.x + npc.dx * delta;
          const newY = npc.y + npc.dy * delta;

          // 边界检查
          const clampedX = Math.max(0, Math.min(worldMap.width - 1, newX));
          const clampedY = Math.max(0, Math.min(worldMap.height - 1, newY));

          const update: Partial<NPCState> = {
            x: clampedX,
            y: clampedY,
          };

          // 检查是否到达目标位置（寻路模式）
          if (npc.behavior === 'moveTo') {
            const path = (npc as any).path;
            const pathIndex = (npc as any).pathIndex || 0;
            
            if (path && pathIndex < path.length) {
              // 沿着路径移动
              const target = path[pathIndex];
              const dx = target.x - clampedX;
              const dy = target.y - clampedY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 0.1) {
                // 到达当前路径点，移动到下一个点
                if (pathIndex + 1 < path.length) {
                  const next = path[pathIndex + 1];
                  const nextDx = next.x - target.x;
                  const nextDy = next.y - target.y;
                  const newDx = nextDx > 0 ? 1 : nextDx < 0 ? -1 : 0;
                  const newDy = nextDy > 0 ? 1 : nextDy < 0 ? -1 : 0;
                  
                  // 只有方向真正改变时才更新，避免闪烁
                  if (newDx !== npc.dx || newDy !== npc.dy) {
                    update.dx = newDx;
                    update.dy = newDy;
                  }
                  (npc as any).pathIndex = pathIndex + 1;
                } else {
                  // 到达终点
                  update.isMoving = false;
                  update.dx = 0;
                  update.dy = 0;
                  (npc as any).path = null;
                  (npc as any).pathIndex = 0;
                }
              } else {
                // 继续朝当前路径点移动，但只在方向真正改变时更新
                const newDx = dx > 0.1 ? 1 : dx < -0.1 ? -1 : 0;
                const newDy = dy > 0.1 ? 1 : dy < -0.1 ? -1 : 0;
                
                // 只有方向真正改变时才更新
                if (newDx !== npc.dx || newDy !== npc.dy) {
                  update.dx = newDx;
                  update.dy = newDy;
                }
              }
            } else if (npc.targetX !== undefined && npc.targetY !== undefined) {
              // 没有路径，直接移动到目标（旧的行为）
              const dx = npc.targetX - clampedX;
              const dy = npc.targetY - clampedY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 0.1) {
                update.isMoving = false;
                update.dx = 0;
                update.dy = 0;
              } else {
                // 只在方向真正改变时更新
                const newDx = dx > 0.1 ? 1 : dx < -0.1 ? -1 : 0;
                const newDy = dy > 0.1 ? 1 : dy < -0.1 ? -1 : 0;
                
                if (newDx !== npc.dx || newDy !== npc.dy) {
                  update.dx = newDx;
                  update.dy = newDy;
                }
              }
            }
          }

          updates.set(npc.id, update);
        });

        // 批量更新控制器中的 NPC 状态（不触发回调）
        if (updates.size > 0) {
          gameController.updateNPCsInternal(updates);
        }

        // 更新本地状态用于渲染（从控制器重新获取）
        setNpcs(gameController.getNPCs());
      }
    };

    const interval = setInterval(gameLoop, TICK_DURATION);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [worldMap]);

  // 视口跟随玩家
  useEffect(() => {
    if (!viewportRef.current) return;
    const tileDim = worldMap.tileDim;
    const viewport = viewportRef.current;
    
    // 检查 viewport 是否仍然有效
    if (!viewport || !viewport.parent) return;
    
    viewport.animate({
      position: new PIXI.Point(playerState.x * tileDim, playerState.y * tileDim),
      scale: 1.5,
    });
  }, [playerState.x, playerState.y, worldMap.tileDim]);

  // 更新视口状态（用于气泡边界检测）
  useEffect(() => {
    if (!viewportRef.current) return;
    
    const updateViewportState = () => {
      const viewport = viewportRef.current;
      if (viewport) {
        // viewport.x 和 viewport.y 是视口在世界空间中的位置（通常是负值）
        // 我们需要将其转换为正值，表示视口在世界空间中的偏移
        setViewportState({
          x: -viewport.x, // 转换为正值
          y: -viewport.y,
          scale: viewport.scale.x,
        });
      }
    };
    
    // 初始更新
    updateViewportState();
    
    // 监听视口变化（使用 requestAnimationFrame 优化性能）
    let animationFrameId: number;
    const update = () => {
      updateViewportState();
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 清理 viewport 引用（在组件卸载时）
  useEffect(() => {
    return () => {
      // 只清空引用，让 React 和 PixiComponent 自动处理 viewport 的销毁
      // 手动销毁可能会导致访问已销毁的对象
      if (viewportRef.current) {
        viewportRef.current = undefined;
      }
    };
  }, []);

  // 计算方向角度（度）- 使用原版的 orientationDegrees 逻辑
  // 原版：orientationDegrees 返回 0-360 度，其中 0=右，90=下，180=左，270=上
  const orientation = playerState.dx !== 0 || playerState.dy !== 0
    ? orientationDegrees({ dx: playerState.dx, dy: playerState.dy })
    : 90; // 默认向下

  const tileDim = worldMap.tileDim;
  const playerX = playerState.x * tileDim + tileDim / 2;
  const playerY = playerState.y * tileDim + tileDim / 2;

  return (
    <PixiViewport
      app={pixiApp}
      screenWidth={width}
      screenHeight={height}
      worldWidth={worldMap.width * tileDim}
      worldHeight={worldMap.height * tileDim}
      viewportRef={viewportRef}
    >
      <PixiStaticMap map={worldMap} />
      
      {/* 玩家角色 */}
      <Character
        x={playerX}
        y={playerY}
        orientation={orientation}
        isMoving={playerState.isMoving}
        isViewer={true}
        textureUrl={playerCharacter.textureUrl}
        spritesheetData={playerCharacter.spritesheetData}
        speed={playerCharacter.speed}
        viewportWidth={width}
        viewportHeight={height}
        viewportX={viewportState.x}
        viewportY={viewportState.y}
        viewportScale={viewportState.scale}
        onClick={() => {}}
      />
      
      {/* 渲染所有 NPC */}
      {npcs.map(npc => {
        const npcCharacter = characters.find(c => c.name === npc.characterName) || characters[0];
        const npcOrientation = npc.dx !== 0 || npc.dy !== 0
          ? orientationDegrees({ dx: npc.dx, dy: npc.dy })
          : 90;
        const npcX = npc.x * tileDim + tileDim / 2;
        const npcY = npc.y * tileDim + tileDim / 2;
        
        return (
          <Character
            key={npc.id}
            x={npcX}
            y={npcY}
            orientation={npcOrientation}
            isMoving={npc.isMoving}
            isThinking={npc.isThinking || false}
            textureUrl={config?.assetsBaseUrl 
              ? getAssetPath('/32x32folk.png')
              : npcCharacter.textureUrl}
            spritesheetData={npcCharacter.spritesheetData}
            speed={npcCharacter.speed}
            displayName={npc.displayName}
            namePosition={npc.namePosition || 'top'}
            speechText={npc.speechText}
            speechVisible={npc.speechVisible || false}
            viewportWidth={width}
            viewportHeight={height}
            viewportX={viewportState.x}
            viewportY={viewportState.y}
            viewportScale={viewportState.scale}
            onClick={() => {
              console.log(`NPC ${npc.id} clicked! Behavior: ${npc.behavior}`);
            }}
          />
        );
      })}
    </PixiViewport>
  );
}

