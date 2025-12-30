/**
 * 游戏控制器 - 提供全局 API 用于控制游戏中的角色
 * 通过 window.OnezGameController 访问
 */

// NPC 状态接口
export interface NPCState {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  isMoving: boolean;
  characterName: string;
  behavior?: 'random' | 'follow' | 'patrol' | 'idle' | 'moveTo';
  targetX?: number;
  targetY?: number;
  // 名称显示
  displayName?: string;
  namePosition?: 'top' | 'bottom'; // 名称位置：上方或下方
  // 讲话气泡
  speechText?: string; // 讲话内容
  speechVisible?: boolean; // 是否显示讲话气泡
  speechDuration?: number; // 讲话持续时间（毫秒），0 表示永久显示
  // 思考状态
  isThinking?: boolean; // 是否显示思考状态（💭）
}

// 控制器回调类型
export type NPCUpdateCallback = (npcs: NPCState[]) => void;
export type PlayerUpdateCallback = (player: { x: number; y: number; dx: number; dy: number; isMoving: boolean }) => void;

class OnezGameController {
  private npcUpdateCallbacks: Set<NPCUpdateCallback> = new Set();
  private playerUpdateCallbacks: Set<PlayerUpdateCallback> = new Set();
  private npcs: Map<string, NPCState> = new Map();
  private playerState: { x: number; y: number; dx: number; dy: number; isMoving: boolean } | null = null;
  private isNotifying = false; // 防止递归调用的标志
  private worldMap: any = null; // 存储世界地图引用（用于寻路）
  
  /**
   * 设置世界地图（用于寻路）
   */
  setWorldMap(map: any) {
    this.worldMap = map;
  }

  /**
   * 注册 NPC 更新回调
   */
  onNPCUpdate(callback: NPCUpdateCallback) {
    this.npcUpdateCallbacks.add(callback);
    return () => this.npcUpdateCallbacks.delete(callback);
  }

  /**
   * 注册玩家更新回调
   */
  onPlayerUpdate(callback: PlayerUpdateCallback) {
    this.playerUpdateCallbacks.add(callback);
    if (this.playerState) {
      callback(this.playerState);
    }
    return () => this.playerUpdateCallbacks.delete(callback);
  }

  /**
   * 通知 NPC 状态更新（会触发回调）
   */
  notifyNPCUpdate(npcs: NPCState[]) {
    // 防止递归调用
    if (this.isNotifying) {
      // 只更新内部状态，不触发回调
      this.npcs.clear();
      npcs.forEach(npc => this.npcs.set(npc.id, npc));
      return;
    }
    
    this.isNotifying = true;
    try {
      this.npcs.clear();
      npcs.forEach(npc => this.npcs.set(npc.id, npc));
      this.npcUpdateCallbacks.forEach(callback => callback(npcs));
    } finally {
      this.isNotifying = false;
    }
  }

  /**
   * 内部更新 NPC 状态（不触发回调，用于游戏循环）
   */
  updateNPCInternal(id: string, updates: Partial<NPCState>) {
    const npc = this.npcs.get(id);
    if (npc) {
      Object.assign(npc, updates);
    }
  }

  /**
   * 批量内部更新 NPC 状态（不触发回调）
   */
  updateNPCsInternal(updates: Map<string, Partial<NPCState>>) {
    updates.forEach((update, id) => {
      const npc = this.npcs.get(id);
      if (npc) {
        Object.assign(npc, update);
      }
    });
  }

  /**
   * 通知玩家状态更新
   */
  notifyPlayerUpdate(player: { x: number; y: number; dx: number; dy: number; isMoving: boolean }) {
    this.playerState = player;
    this.playerUpdateCallbacks.forEach(callback => callback(player));
  }

  /**
   * 添加 NPC
   */
  addNPC(
    id: string, 
    x: number, 
    y: number, 
    characterName: string = 'f2', 
    behavior: NPCState['behavior'] = 'idle',
    displayName?: string,
    namePosition: 'top' | 'bottom' = 'top'
  ): NPCState {
    const npc: NPCState = {
      id,
      x,
      y,
      dx: 0,
      dy: 0,
      speed: 0.75,
      isMoving: false,
      characterName,
      behavior,
      displayName: displayName || id,
      namePosition,
      speechVisible: false,
    };
    this.npcs.set(id, npc);
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
    return npc;
  }

  /**
   * 移除 NPC
   */
  removeNPC(id: string) {
    this.npcs.delete(id);
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 获取所有 NPC
   */
  getNPCs(): NPCState[] {
    return Array.from(this.npcs.values());
  }

  /**
   * 获取指定 NPC
   */
  getNPC(id: string): NPCState | undefined {
    return this.npcs.get(id);
  }

  /**
   * 移动 NPC 到指定位置
   */
  moveNPCTo(id: string, x: number, y: number) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    const dx = x - npc.x;
    const dy = y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      npc.isMoving = false;
      npc.dx = 0;
      npc.dy = 0;
    } else {
      npc.dx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      npc.dy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      npc.isMoving = true;
      npc.targetX = x;
      npc.targetY = y;
      npc.behavior = 'moveTo';
    }

    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 设置 NPC 移动方向
   */
  setNPCDirection(id: string, dx: number, dy: number) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    const newDx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const newDy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const newIsMoving = dx !== 0 || dy !== 0;
    
    // 如果值没有变化，不触发更新
    if (npc.dx === newDx && npc.dy === newDy && npc.isMoving === newIsMoving) {
      return;
    }

    npc.dx = newDx;
    npc.dy = newDy;
    npc.isMoving = newIsMoving;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 设置 NPC 行为
   */
  setNPCBehavior(id: string, behavior: NPCState['behavior']) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.behavior = behavior;
    if (behavior === 'idle') {
      npc.isMoving = false;
      npc.dx = 0;
      npc.dy = 0;
    }
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 停止 NPC 移动
   */
  stopNPC(id: string) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.isMoving = false;
    npc.dx = 0;
    npc.dy = 0;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 获取玩家状态
   */
  getPlayer() {
    return this.playerState;
  }

  /**
   * 设置玩家位置（如果支持）
   */
  setPlayerPosition(x: number, y: number) {
    if (this.playerState) {
      this.playerState.x = x;
      this.playerState.y = y;
      this.notifyPlayerUpdate(this.playerState);
    }
  }

  /**
   * 显示 NPC 讲话气泡
   */
  showSpeech(id: string, text: string, duration: number = 3000) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.speechText = text;
    npc.speechVisible = true;
    npc.speechDuration = duration;

    this.notifyNPCUpdate(Array.from(this.npcs.values()));

    // 如果设置了持续时间，自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        this.hideSpeech(id);
      }, duration);
    }
  }

  /**
   * 隐藏 NPC 讲话气泡
   */
  hideSpeech(id: string) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.speechVisible = false;
    npc.speechText = undefined;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 设置 NPC 显示名称
   */
  setDisplayName(id: string, name: string, position: 'top' | 'bottom' = 'top') {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.displayName = name;
    npc.namePosition = position;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 隐藏 NPC 名称
   */
  hideDisplayName(id: string) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.displayName = undefined;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 设置 NPC 思考状态（显示 💭）
   */
  setThinking(id: string, duration: number = 3000) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.isThinking = true;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));

    // 如果设置了持续时间，自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        this.hideThinking(id);
      }, duration);
    }
  }

  /**
   * 隐藏 NPC 思考状态
   */
  hideThinking(id: string) {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return;
    }

    npc.isThinking = false;
    this.notifyNPCUpdate(Array.from(this.npcs.values()));
  }

  /**
   * 检查位置是否可通行
   */
  private isWalkable(x: number, y: number): boolean {
    if (!this.worldMap) return true; // 如果没有地图，假设所有位置可通行
    
    // 检查边界
    if (x < 0 || y < 0 || x >= this.worldMap.width || y >= this.worldMap.height) {
      return false;
    }
    
    // 检查障碍物（objectTiles 层中的非 -1 值表示障碍物）
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    
    for (const layer of this.worldMap.objectTiles) {
      if (layer && layer[tileX] && layer[tileX][tileY] !== undefined && layer[tileX][tileY] !== -1) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * A* 寻路算法
   */
  findPath(startX: number, startY: number, endX: number, endY: number): Array<{ x: number; y: number }> | null {
    if (!this.worldMap) {
      console.warn('World map not set, cannot find path');
      return null;
    }

    const start = { x: Math.floor(startX), y: Math.floor(startY) };
    const end = { x: Math.floor(endX), y: Math.floor(endY) };

    // 如果起点或终点不可通行，返回 null
    if (!this.isWalkable(start.x, start.y) || !this.isWalkable(end.x, end.y)) {
      return null;
    }

    // A* 算法
    const openSet: Array<{ x: number; y: number; f: number; g: number; h: number; parent?: { x: number; y: number } }> = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, { x: number; y: number }>();

    const heuristic = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // 曼哈顿距离
    };

    const getKey = (pos: { x: number; y: number }) => `${pos.x},${pos.y}`;

    openSet.push({
      x: start.x,
      y: start.y,
      f: 0,
      g: 0,
      h: heuristic(start, end),
    });

    while (openSet.length > 0) {
      // 找到 f 值最小的节点
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet.splice(currentIndex, 1)[0];
      const currentKey = getKey(current);

      if (current.x === end.x && current.y === end.y) {
        // 找到路径，重构路径
        const path: Array<{ x: number; y: number }> = [];
        let node: { x: number; y: number } | undefined = { x: current.x, y: current.y };
        while (node) {
          path.unshift(node);
          const nodeKey = getKey(node);
          node = cameFrom.get(nodeKey);
        }
        return path;
      }

      closedSet.add(currentKey);

      // 检查四个方向的邻居
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const neighborKey = getKey(neighbor);

        if (closedSet.has(neighborKey)) {
          continue;
        }

        if (!this.isWalkable(neighbor.x, neighbor.y)) {
          continue;
        }

        const tentativeG = current.g + 1;
        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!existingNode) {
          const h = heuristic(neighbor, end);
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            f: tentativeG + h,
            g: tentativeG,
            h,
            parent: { x: current.x, y: current.y },
          });
          cameFrom.set(neighborKey, { x: current.x, y: current.y });
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = { x: current.x, y: current.y };
          cameFrom.set(neighborKey, { x: current.x, y: current.y });
        }
      }
    }

    // 没有找到路径
    return null;
  }

  /**
   * 让 NPC 寻路到指定位置
   */
  pathfindTo(id: string, targetX: number, targetY: number): boolean {
    const npc = this.npcs.get(id);
    if (!npc) {
      console.warn(`NPC ${id} not found`);
      return false;
    }

    const path = this.findPath(npc.x, npc.y, targetX, targetY);
    if (!path || path.length === 0) {
      console.warn(`No path found for NPC ${id} from (${npc.x}, ${npc.y}) to (${targetX}, ${targetY})`);
      return false;
    }

    // 存储路径
    (npc as any).path = path;
    (npc as any).pathIndex = 0;
    npc.behavior = 'moveTo';
    npc.targetX = targetX;
    npc.targetY = targetY;

    // 移动到路径的第一个点
    if (path.length > 1) {
      const next = path[1];
      const dx = next.x - npc.x;
      const dy = next.y - npc.y;
      npc.dx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      npc.dy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      npc.isMoving = true;
    }

    this.notifyNPCUpdate(Array.from(this.npcs.values()));
    return true;
  }
}

// 创建全局实例
const controller = new OnezGameController();

// 导出到全局
declare global {
  interface Window {
    OnezGameController: typeof OnezGameController;
    onezGameController: OnezGameController;
  }
}

if (typeof window !== 'undefined') {
  window.OnezGameController = OnezGameController;
  window.onezGameController = controller;
}

export default controller;

