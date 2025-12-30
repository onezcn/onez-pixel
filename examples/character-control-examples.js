/**
 * OnezGame 人物控制示例代码
 * 
 * 使用方法：
 * 1. 在 HTML 中引入 onezgame.min.js
 * 2. 初始化游戏：window.onezgame({ ... })
 * 3. 使用 window.onezGameController 控制人物
 * 
 * 注意：这些示例需要在游戏初始化后使用
 */

// ============================================
// 基础操作示例
// ============================================

/**
 * 示例 1: 添加一个 NPC
 */
function example1_AddNPC() {
  const controller = window.onezGameController;
  
  // 添加一个 NPC，ID 为 'npc1'，位置在 (10, 10)，使用角色 'f2'
  controller.addNPC('npc1', 10, 10, 'f2', 'idle');
  
  console.log('NPC 已添加:', controller.getNPC('npc1'));
}

/**
 * 示例 2: 移动 NPC 到指定位置
 */
function example2_MoveNPCTo() {
  const controller = window.onezGameController;
  
  // 移动 NPC 到位置 (20, 20)
  controller.moveNPCTo('npc1', 20, 20);
  
  console.log('NPC 正在移动到 (20, 20)');
}

/**
 * 示例 3: 设置 NPC 移动方向
 */
function example3_SetNPCDirection() {
  const controller = window.onezGameController;
  
  // 设置 NPC 向右移动
  controller.setNPCDirection('npc1', 1, 0);
  
  // 设置 NPC 向上移动
  controller.setNPCDirection('npc1', 0, -1);
  
  // 停止移动
  controller.stopNPC('npc1');
}

/**
 * 示例 4: 设置 NPC 行为
 */
function example4_SetNPCBehavior() {
  const controller = window.onezGameController;
  
  // 设置为随机游走
  controller.setNPCBehavior('npc1', 'random');
  
  // 设置为跟随玩家
  controller.setNPCBehavior('npc1', 'follow');
  
  // 设置为巡逻
  controller.setNPCBehavior('npc1', 'patrol');
  
  // 设置为静止
  controller.setNPCBehavior('npc1', 'idle');
}

/**
 * 示例 5: 移除 NPC
 */
function example5_RemoveNPC() {
  const controller = window.onezGameController;
  
  controller.removeNPC('npc1');
  console.log('NPC 已移除');
}

// ============================================
// 高级行为示例
// ============================================

/**
 * 示例 6: 随机游走 NPC
 */
function example6_RandomWalkNPC() {
  const controller = window.onezGameController;
  
  // 添加 NPC
  const npc = controller.addNPC('walker1', 15, 15, 'f3', 'random');
  
  // 每 3 秒随机改变方向
  setInterval(() => {
    const directions = [
      { dx: 0, dy: -1 },  // 上
      { dx: 0, dy: 1 },   // 下
      { dx: -1, dy: 0 },  // 左
      { dx: 1, dy: 0 },   // 右
    ];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    controller.setNPCDirection('walker1', randomDir.dx, randomDir.dy);
  }, 3000);
}

/**
 * 示例 7: 跟随玩家的 NPC
 */
function example7_FollowPlayerNPC() {
  const controller = window.onezGameController;
  
  // 添加跟随 NPC
  controller.addNPC('follower1', 10, 10, 'f4', 'follow');
  
  // 监听玩家位置更新，自动跟随
  controller.onPlayerUpdate((player) => {
    const npc = controller.getNPC('follower1');
    if (npc && npc.behavior === 'follow') {
      const dx = player.x - npc.x;
      const dy = player.y - npc.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果距离大于 1，则跟随
      if (distance > 1) {
        controller.setNPCDirection('follower1', dx, dy);
      } else {
        controller.stopNPC('follower1');
      }
    }
  });
}

/**
 * 示例 8: 巡逻 NPC
 */
function example8_PatrolNPC() {
  const controller = window.onezGameController;
  
  // 添加巡逻 NPC
  controller.addNPC('patrol1', 10, 10, 'f5', 'patrol');
  
  // 定义巡逻点
  const patrolPoints = [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 20, y: 20 },
    { x: 10, y: 20 },
  ];
  
  let currentIndex = 0;
  
  // 巡逻逻辑
  setInterval(() => {
    const npc = controller.getNPC('patrol1');
    if (!npc || npc.behavior !== 'patrol') return;
    
    const target = patrolPoints[currentIndex];
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 0.5) {
      // 到达目标，前往下一个点
      currentIndex = (currentIndex + 1) % patrolPoints.length;
      const nextTarget = patrolPoints[currentIndex];
      controller.moveNPCTo('patrol1', nextTarget.x, nextTarget.y);
    } else {
      // 继续向目标移动
      controller.setNPCDirection('patrol1', dx, dy);
    }
  }, 100);
}

/**
 * 示例 9: 多个 NPC 交互
 */
function example9_MultipleNPCs() {
  const controller = window.onezGameController;
  
  // 添加多个 NPC
  controller.addNPC('npc1', 10, 10, 'f2', 'random');
  controller.addNPC('npc2', 15, 15, 'f3', 'random');
  controller.addNPC('npc3', 20, 20, 'f4', 'random');
  
  // 监听所有 NPC 更新
  controller.onNPCUpdate((npcs) => {
    console.log('NPC 状态更新:', npcs);
    
    // 检查 NPC 之间的碰撞
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        const npc1 = npcs[i];
        const npc2 = npcs[j];
        const dx = npc1.x - npc2.x;
        const dy = npc1.y - npc2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) {
          // 碰撞检测，可以在这里添加碰撞处理逻辑
          console.log(`NPC ${npc1.id} 和 NPC ${npc2.id} 发生碰撞`);
        }
      }
    }
  });
}

/**
 * 示例 10: 响应式 NPC 行为
 */
function example10_ReactiveNPC() {
  const controller = window.onezGameController;
  
  // 添加一个响应式 NPC
  controller.addNPC('reactive1', 15, 15, 'f6', 'idle');
  
  // 监听玩家位置，当玩家靠近时改变行为
  controller.onPlayerUpdate((player) => {
    const npc = controller.getNPC('reactive1');
    if (!npc) return;
    
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      // 玩家靠近，开始跟随
      controller.setNPCBehavior('reactive1', 'follow');
    } else if (distance > 10) {
      // 玩家远离，停止跟随
      controller.setNPCBehavior('reactive1', 'idle');
    }
  });
}

/**
 * 示例 11: NPC 队列移动
 */
function example11_NPCQueue() {
  const controller = window.onezGameController;
  
  // 创建一队 NPC
  const queue = ['queue1', 'queue2', 'queue3', 'queue4'];
  queue.forEach((id, index) => {
    controller.addNPC(id, 10 + index * 2, 10, 'f2', 'idle');
  });
  
  // 让队列跟随第一个 NPC
  let leader = controller.getNPC('queue1');
  if (leader) {
    controller.moveNPCTo('queue1', 20, 20);
  }
  
  // 其他 NPC 跟随前一个（使用防抖避免频繁更新）
  let updateTimer = null;
  const updateQueue = () => {
    if (updateTimer) return; // 如果已经有待处理的更新，跳过
    
    updateTimer = setTimeout(() => {
      for (let i = 1; i < queue.length; i++) {
        const current = controller.getNPC(queue[i]);
        const previous = controller.getNPC(queue[i - 1]);
        
        if (current && previous) {
          const dx = previous.x - current.x;
          const dy = previous.y - current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 2) {
            controller.setNPCDirection(queue[i], dx, dy);
          } else {
            controller.stopNPC(queue[i]);
          }
        }
      }
      updateTimer = null;
    }, 50); // 50ms 防抖
  };
  
  controller.onNPCUpdate(updateQueue);
}

/**
 * 示例 12: 定时任务控制 NPC
 */
function example12_ScheduledTasks() {
  const controller = window.onezGameController;
  
  controller.addNPC('worker1', 10, 10, 'f7', 'idle');
  
  // 创建一个时间表
  const schedule = [
    { time: 0, action: () => controller.moveNPCTo('worker1', 20, 10) },
    { time: 5000, action: () => controller.moveNPCTo('worker1', 20, 20) },
    { time: 10000, action: () => controller.moveNPCTo('worker1', 10, 20) },
    { time: 15000, action: () => controller.moveNPCTo('worker1', 10, 10) },
  ];
  
  schedule.forEach((task) => {
    setTimeout(() => {
      task.action();
    }, task.time);
  });
  
  // 循环执行
  setInterval(() => {
    schedule.forEach((task) => {
      setTimeout(() => {
        task.action();
      }, task.time);
    });
  }, 20000);
}

/**
 * 示例 13: 键盘控制 NPC
 */
function example13_KeyboardControlNPC() {
  const controller = window.onezGameController;
  
  controller.addNPC('keyboardNPC', 15, 15, 'f8', 'idle');
  
  // 使用数字键控制 NPC
  const keyMap = {
    '8': { dx: 0, dy: -1 },  // 上
    '2': { dx: 0, dy: 1 },   // 下
    '4': { dx: -1, dy: 0 },  // 左
    '6': { dx: 1, dy: 0 },   // 右
    '5': () => controller.stopNPC('keyboardNPC'), // 停止
  };
  
  window.addEventListener('keydown', (e) => {
    const action = keyMap[e.key];
    if (action) {
      if (typeof action === 'function') {
        action();
      } else {
        controller.setNPCDirection('keyboardNPC', action.dx, action.dy);
      }
    }
  });
}

/**
 * 示例 14: 鼠标点击控制 NPC
 */
function example14_MouseControlNPC() {
  const controller = window.onezGameController;
  
  controller.addNPC('mouseNPC', 15, 15, 'f2', 'idle');
  
  // 注意：这需要游戏支持点击事件
  // 假设游戏会触发自定义事件 'game:click'
  window.addEventListener('game:click', (e) => {
    const { x, y } = e.detail; // 瓦片坐标
    controller.moveNPCTo('mouseNPC', x, y);
  });
}

/**
 * 示例 15: NPC 状态查询和监控
 */
function example15_NPCMonitoring() {
  const controller = window.onezGameController;
  
  // 添加几个 NPC
  controller.addNPC('monitor1', 10, 10, 'f2', 'random');
  controller.addNPC('monitor2', 15, 15, 'f3', 'follow');
  
  // 定期查询 NPC 状态
  setInterval(() => {
    const npcs = controller.getNPCs();
    console.log('当前 NPC 状态:');
    npcs.forEach(npc => {
      console.log(`  ${npc.id}: 位置(${npc.x.toFixed(2)}, ${npc.y.toFixed(2)}), 移动: ${npc.isMoving}, 行为: ${npc.behavior}`);
    });
  }, 2000);
  
  // 监听 NPC 更新
  controller.onNPCUpdate((npcs) => {
    console.log('NPC 更新:', npcs.length, '个 NPC');
  });
  
  // 监听玩家更新
  controller.onPlayerUpdate((player) => {
    console.log('玩家位置:', `(${player.x.toFixed(2)}, ${player.y.toFixed(2)})`);
  });
}

// ============================================
// 工具函数
// ============================================

/**
 * 工具函数: 计算两点之间的距离
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 工具函数: 检查 NPC 是否到达目标
 */
function hasReachedTarget(npc, targetX, targetY, threshold = 0.5) {
  return distance(npc.x, npc.y, targetX, targetY) < threshold;
}

/**
 * 工具函数: 获取所有 NPC 的位置
 */
function getAllNPCPositions() {
  const controller = window.onezGameController;
  return controller.getNPCs().map(npc => ({
    id: npc.id,
    x: npc.x,
    y: npc.y,
  }));
}

// ============================================
// 讲话气泡和名称显示示例
// ============================================

/**
 * 示例 16: 添加带名称的 NPC（名称在上方）
 */
function example16_AddNPCWithName() {
  const controller = window.onezGameController;
  
  // 添加 NPC，并设置名称显示在上方
  controller.addNPC('npc1', 10, 10, 'f2', 'idle', '小明', 'top');
  
  console.log('NPC 已添加，名称显示在上方');
}

/**
 * 示例 17: 添加名称显示在下方的 NPC
 */
function example17_AddNPCWithNameBottom() {
  const controller = window.onezGameController;
  
  // 添加 NPC，名称显示在下方
  controller.addNPC('npc2', 15, 15, 'f3', 'idle', '小红', 'bottom');
  
  console.log('NPC 已添加，名称显示在下方');
}

/**
 * 示例 18: 显示讲话气泡
 */
function example18_ShowSpeech() {
  const controller = window.onezGameController;
  
  // 显示讲话气泡，3秒后自动消失
  controller.showSpeech('npc1', '你好！欢迎来到游戏世界！', 3000);
  
  console.log('讲话气泡已显示，3秒后自动消失');
}

/**
 * 示例 19: 显示永久讲话气泡
 */
function example19_ShowSpeechPermanent() {
  const controller = window.onezGameController;
  
  // 显示永久讲话气泡（duration = 0）
  controller.showSpeech('npc1', '这是一条永久显示的对话', 0);
  
  console.log('永久讲话气泡已显示');
}

/**
 * 示例 20: 隐藏讲话气泡
 */
function example20_HideSpeech() {
  const controller = window.onezGameController;
  
  controller.hideSpeech('npc1');
  
  console.log('讲话气泡已隐藏');
}

/**
 * 示例 21: 设置 NPC 名称
 */
function example21_SetDisplayName() {
  const controller = window.onezGameController;
  
  // 设置名称显示在上方
  controller.setDisplayName('npc1', '新名称', 'top');
  
  console.log('NPC 名称已更新');
}

/**
 * 示例 22: 更改名称位置
 */
function example22_ChangeNamePosition() {
  const controller = window.onezGameController;
  
  // 将名称从上方改为下方
  controller.setDisplayName('npc1', '小明', 'bottom');
  
  console.log('名称位置已更改');
}

/**
 * 示例 23: 隐藏名称
 */
function example23_HideName() {
  const controller = window.onezGameController;
  
  controller.hideDisplayName('npc1');
  
  console.log('名称已隐藏');
}

/**
 * 示例 24: 对话序列
 */
function example24_DialogueSequence() {
  const controller = window.onezGameController;
  
  // 创建对话序列
  const dialogues = [
    '你好！',
    '欢迎来到我的世界！',
    '希望你能玩得开心！',
  ];
  
  let index = 0;
  const showNext = () => {
    if (index < dialogues.length) {
      controller.showSpeech('npc1', dialogues[index], 2000);
      index++;
      setTimeout(showNext, 2500); // 等待当前对话结束 + 500ms 间隔
    }
  };
  
  showNext();
  console.log('对话序列已开始');
}

/**
 * 示例 25: 多个 NPC 同时讲话
 */
function example25_MultipleSpeeches() {
  const controller = window.onezGameController;
  
  // 多个 NPC 同时显示讲话气泡
  controller.showSpeech('npc1', '我是第一个 NPC', 3000);
  controller.showSpeech('npc2', '我是第二个 NPC', 3000);
  
  console.log('多个 NPC 同时讲话');
}

// ============================================
// 思考状态示例
// ============================================

/**
 * 示例 26: 显示 NPC 思考状态（💭）
 */
function example26_ShowThinking() {
  const controller = window.onezGameController;
  
  controller.addNPC('thinker1', 10, 10, 'f5', 'idle', '思考者');
  controller.setThinking('thinker1', 3000); // 显示 3 秒后自动隐藏
  
  console.log('NPC thinker1 正在思考');
}

/**
 * 示例 27: 永久显示思考状态
 */
function example27_ShowThinkingPermanent() {
  const controller = window.onezGameController;
  
  controller.addNPC('thinker2', 15, 15, 'f6', 'idle', '永久思考者');
  controller.setThinking('thinker2', 0); // 0 表示永久显示
  
  console.log('NPC thinker2 永久思考状态');
}

/**
 * 示例 28: 隐藏思考状态
 */
function example28_HideThinking() {
  const controller = window.onezGameController;
  
  controller.hideThinking('thinker1');
  controller.hideThinking('thinker2');
  
  console.log('思考状态已隐藏');
}

/**
 * 示例 29: 思考后讲话
 */
function example29_ThinkingThenSpeaking() {
  const controller = window.onezGameController;
  
  controller.addNPC('philosopher', 20, 20, 'f7', 'idle', '哲学家');
  
  // 先思考
  controller.setThinking('philosopher', 2000);
  
  // 2 秒后讲话
  setTimeout(() => {
    controller.hideThinking('philosopher');
    controller.showSpeech('philosopher', '我想明白了！', 3000);
  }, 2000);
  
  console.log('NPC philosopher 先思考后讲话');
}

/**
 * 示例 30: 多个 NPC 同时思考
 */
function example30_MultipleThinking() {
  const controller = window.onezGameController;
  
  // 创建多个 NPC
  const npcs = ['thinker1', 'thinker2', 'thinker3'];
  npcs.forEach((id, index) => {
    controller.addNPC(id, 10 + index * 3, 10, 'f' + (index + 2), 'idle', `思考者${index + 1}`);
  });
  
  // 让它们同时思考
  npcs.forEach((id) => {
    controller.setThinking(id, 5000);
  });
  
  console.log('多个 NPC 同时思考');
}

// ============================================
// 寻路示例
// ============================================

/**
 * 示例 31: 基本寻路
 */
function example31_BasicPathfinding() {
  const controller = window.onezGameController;
  
  // 添加 NPC
  controller.addNPC('pathfinder1', 10, 10, 'f5', 'idle', '寻路者');
  
  // 寻路到目标位置
  const success = controller.pathfindTo('pathfinder1', 30, 20);
  
  if (success) {
    console.log('NPC pathfinder1 开始寻路到 (30, 20)');
  } else {
    console.log('寻路失败，可能目标位置不可到达');
  }
}

/**
 * 示例 32: 寻路到玩家位置
 */
function example32_PathfindToPlayer() {
  const controller = window.onezGameController;
  
  // 添加 NPC
  controller.addNPC('follower2', 5, 5, 'f6', 'idle', '跟随者');
  
  // 获取玩家位置
  const player = controller.getPlayer();
  if (player) {
    const success = controller.pathfindTo('follower2', player.x, player.y);
    if (success) {
      console.log(`NPC follower2 寻路到玩家位置 (${player.x}, ${player.y})`);
    }
  } else {
    console.log('玩家位置不可用');
  }
}

/**
 * 示例 33: 多个 NPC 寻路到不同目标
 */
function example33_MultiplePathfinding() {
  const controller = window.onezGameController;
  
  // 创建多个 NPC
  const npcs = [
    { id: 'path1', x: 10, y: 10, targetX: 30, targetY: 10 },
    { id: 'path2', x: 15, y: 15, targetX: 25, targetY: 25 },
    { id: 'path3', x: 20, y: 5, targetX: 35, targetY: 20 },
  ];
  
  npcs.forEach((npc, index) => {
    controller.addNPC(npc.id, npc.x, npc.y, 'f' + (index + 2), 'idle', `寻路者${index + 1}`);
    controller.pathfindTo(npc.id, npc.targetX, npc.targetY);
  });
  
  console.log('多个 NPC 同时寻路到不同目标');
}

/**
 * 示例 34: 寻路后执行动作
 */
function example34_PathfindThenAction() {
  const controller = window.onezGameController;
  
  controller.addNPC('actor1', 10, 10, 'f7', 'idle', '演员');
  
  // 寻路到目标
  controller.pathfindTo('actor1', 25, 25);
  
  // 监听 NPC 更新，当到达目标后执行动作
  const unsubscribe = controller.onNPCUpdate((npcs) => {
    const npc = npcs.find(n => n.id === 'actor1');
    if (npc && !npc.isMoving && npc.behavior === 'moveTo') {
      // 到达目标，显示讲话气泡
      controller.showSpeech('actor1', '我到达了！', 3000);
      unsubscribe();
    }
  });
  
  console.log('NPC actor1 寻路到 (25, 25)，到达后讲话');
}

/**
 * 示例 35: 寻路绕过障碍物
 */
function example35_PathfindAroundObstacles() {
  const controller = window.onezGameController;
  
  // 添加 NPC 在障碍物一侧
  controller.addNPC('obstacle_avoider', 5, 15, 'f8', 'idle', '避障者');
  
  // 寻路到障碍物另一侧（寻路算法会自动绕过障碍物）
  controller.pathfindTo('obstacle_avoider', 40, 15);
  
  console.log('NPC obstacle_avoider 寻路绕过障碍物');
}

// ============================================
// 导出所有示例（用于测试）
// ============================================

if (typeof window !== 'undefined') {
  window.OnezGameExamples = {
    // 使用简短名称，方便调用
    example1: example1_AddNPC,
    example2: example2_MoveNPCTo,
    example3: example3_SetNPCDirection,
    example4: example4_SetNPCBehavior,
    example5: example5_RemoveNPC,
    example6: example6_RandomWalkNPC,
    example7: example7_FollowPlayerNPC,
    example8: example8_PatrolNPC,
    example9: example9_MultipleNPCs,
    example10: example10_ReactiveNPC,
    example11: example11_NPCQueue,
    example12: example12_ScheduledTasks,
    example13: example13_KeyboardControlNPC,
    example14: example14_MouseControlNPC,
    example15: example15_NPCMonitoring,
    // 讲话气泡和名称显示示例
    example16: example16_AddNPCWithName,
    example17: example17_AddNPCWithNameBottom,
    example18: example18_ShowSpeech,
    example19: example19_ShowSpeechPermanent,
    example20: example20_HideSpeech,
    example21: example21_SetDisplayName,
    example22: example22_ChangeNamePosition,
    example23: example23_HideName,
    example24: example24_DialogueSequence,
    example25: example25_MultipleSpeeches,
    // 思考状态示例
    example26: example26_ShowThinking,
    example27: example27_ShowThinkingPermanent,
    example28: example28_HideThinking,
    example29: example29_ThinkingThenSpeaking,
    example30: example30_MultipleThinking,
    // 寻路示例
    example31: example31_BasicPathfinding,
    example32: example32_PathfindToPlayer,
    example33: example33_MultiplePathfinding,
    example34: example34_PathfindThenAction,
    example35: example35_PathfindAroundObstacles,
    // 也保留完整名称，方便直接调用
    example1_AddNPC,
    example2_MoveNPCTo,
    example3_SetNPCDirection,
    example4_SetNPCBehavior,
    example5_RemoveNPC,
    example6_RandomWalkNPC,
    example7_FollowPlayerNPC,
    example8_PatrolNPC,
    example9_MultipleNPCs,
    example10_ReactiveNPC,
    example11_NPCQueue,
    example12_ScheduledTasks,
    example13_KeyboardControlNPC,
    example14_MouseControlNPC,
    example15_NPCMonitoring,
    example16_AddNPCWithName,
    example17_AddNPCWithNameBottom,
    example18_ShowSpeech,
    example19_ShowSpeechPermanent,
    example20_HideSpeech,
    example21_SetDisplayName,
    example22_ChangeNamePosition,
    example23_HideName,
    example24_DialogueSequence,
    example25_MultipleSpeeches,
    example26_ShowThinking,
    example27_ShowThinkingPermanent,
    example28_HideThinking,
    example29_ThinkingThenSpeaking,
    example30_MultipleThinking,
    example31_BasicPathfinding,
    example32_PathfindToPlayer,
    example33_MultiplePathfinding,
    example34_PathfindThenAction,
    example35_PathfindAroundObstacles,
    utils: {
      distance,
      hasReachedTarget,
      getAllNPCPositions,
    },
  };
  
  console.log('OnezGame 控制示例已加载！');
  console.log('使用 window.OnezGameExamples 访问所有示例');
  console.log('使用 window.onezGameController 访问控制器');
}

