import { BaseTexture, ISpritesheetData, Spritesheet, TextStyle } from 'pixi.js';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatedSprite, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

// 共享的文本样式对象（避免在条件渲染中使用 hooks）
const nameTextStyle = new TextStyle({
  fontSize: 12,
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 2,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 'bold',
});

// 创建文本样式函数，用于动态计算
const createSpeechTextStyle = (maxWidth: number) => new TextStyle({
  fontSize: 14,
  fill: 0x333333,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  wordWrap: true,
  wordWrapWidth: maxWidth,
  align: 'center',
  breakWords: true, // 允许在单词中间换行（对中文很重要）
});

export const Character = ({
  textureUrl,
  spritesheetData,
  x,
  y,
  orientation,
  isMoving = false,
  isThinking = false,
  isSpeaking = false,
  emoji = '',
  isViewer = false,
  speed = 0.1,
  onClick,
  displayName,
  namePosition = 'top',
  speechText,
  speechVisible = false,
  viewportWidth,
  viewportHeight,
  viewportX = 0,
  viewportY = 0,
  viewportScale = 1,
}: {
  // Path to the texture packed image.
  textureUrl: string;
  // The data for the spritesheet.
  spritesheetData: ISpritesheetData;
  // The pose of the NPC.
  x: number;
  y: number;
  orientation: number;
  isMoving?: boolean;
  // Shows a thought bubble if true.
  isThinking?: boolean;
  // Shows a speech bubble if true.
  isSpeaking?: boolean;
  emoji?: string;
  // Highlights the player.
  isViewer?: boolean;
  // The speed of the animation. Can be tuned depending on the side and speed of the NPC.
  speed?: number;
  onClick: () => void;
  // 显示名称
  displayName?: string;
  namePosition?: 'top' | 'bottom';
  // 讲话气泡
  speechText?: string;
  speechVisible?: boolean;
  // 视口信息（用于边界检测）
  viewportWidth?: number;
  viewportHeight?: number;
  viewportX?: number;
  viewportY?: number;
  viewportScale?: number;
}) => {
  const [spriteSheet, setSpriteSheet] = useState<Spritesheet>();
  useEffect(() => {
    const parseSheet = async () => {
      const sheet = new Spritesheet(
        BaseTexture.from(textureUrl, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        }),
        spritesheetData,
      );
      await sheet.parse();
      setSpriteSheet(sheet);
    };
    void parseSheet();
  }, []);

  // The first "left" is "right" but reflected.
  const roundedOrientation = Math.floor(orientation / 90);
  const direction = ['right', 'down', 'left', 'up'][roundedOrientation];

  // Prevents the animation from stopping when the texture changes
  // (see https://github.com/pixijs/pixi-react/issues/359)
  const ref = useRef<PIXI.AnimatedSprite | null>(null);
  useEffect(() => {
    if (isMoving) {
      ref.current?.play();
    }
  }, [direction, isMoving]);

  if (!spriteSheet) return null;

  let blockOffset = { x: 0, y: 0 };
  switch (roundedOrientation) {
    case 2:
      blockOffset = { x: -20, y: 0 };
      break;
    case 0:
      blockOffset = { x: 20, y: 0 };
      break;
    case 3:
      blockOffset = { x: 0, y: -20 };
      break;
    case 1:
      blockOffset = { x: 0, y: 20 };
      break;
  }

  // 计算名称和气泡的位置
  // 角色精灵的中心在 Container 的 (0, 0)，因为 anchor 是 0.5, 0.5
  const nameY = namePosition === 'top' ? -28 : 24;
  // speechY 不再使用，气泡位置由 SpeechBubble 内部计算

  return (
    <Container x={x} y={y} interactive={true} pointerdown={onClick} cursor="pointer">
      {/* 先渲染角色，确保气泡在角色上方 */}
      {isViewer && <ViewerIndicator />}
      <AnimatedSprite
        ref={ref}
        isPlaying={isMoving}
        textures={spriteSheet.animations[direction]}
        animationSpeed={speed}
        anchor={{ x: 0.5, y: 0.5 }}
      />
      {emoji && (
        <Text x={0} y={-24} scale={{ x: -0.8, y: 0.8 }} text={emoji} anchor={{ x: 0.5, y: 0.5 }} />
      )}

      {/* 名称显示 */}
      {displayName && (
        <Text
          x={0}
          y={nameY}
          text={displayName}
          anchor={{ x: 0.5, y: 0.5 }}
          style={nameTextStyle}
        />
      )}

      {/* 思考气泡 */}
      {isThinking && (
        <Text x={-20} y={-10} scale={{ x: -0.8, y: 0.8 }} text={'💭'} anchor={{ x: 0.5, y: 0.5 }} />
      )}

      {/* 讲话气泡 - 最后渲染，确保在最上层 */}
      {/* 气泡在 Container 内部，使用相对坐标（相对于角色中心 0,0） */}
      {/* 气泡应该在名称上方，不覆盖角色 */}
      {(isSpeaking || (speechVisible && speechText)) && (
        <SpeechBubble 
          text={speechText || '💬'} 
          characterWorldX={x}
          characterWorldY={y}
          nameY={displayName ? nameY : undefined}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          viewportX={viewportX}
          viewportY={viewportY}
          viewportScale={viewportScale}
        />
      )}
    </Container>
  );
};

// 讲话气泡组件
// 注意：这个组件在 Character Container 内部，使用相对坐标（相对于角色中心 0,0）
function SpeechBubble({ 
  text, 
  characterWorldX,
  characterWorldY,
  nameY,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
  viewportScale,
}: { 
  text: string; 
  characterWorldX: number;
  characterWorldY: number;
  nameY?: number; // 名称的 Y 坐标（相对于角色中心）
  viewportWidth?: number;
  viewportHeight?: number;
  viewportX?: number;
  viewportY?: number;
  viewportScale?: number;
}) {
  // 气泡配置
  const padding = 10; // 内边距
  const maxBubbleWidth = 180; // 最大气泡宽度
  const fontSize = 14;
  const tailHeight = 10; // 箭头高度（三角形的高度）
  const tailWidth = 12; // 箭头宽度（三角形底边的一半）
  
  // 使用 PIXI.TextMetrics 准确测量文本尺寸
  const tempStyle = createSpeechTextStyle(maxBubbleWidth - padding * 2);
  const textMetrics = PIXI.TextMetrics.measureText(text, tempStyle);
  
  // 计算实际的气泡尺寸（确保文字不超出）
  const actualTextWidth = Math.min(textMetrics.width, maxBubbleWidth - padding * 2);
  const actualTextHeight = textMetrics.height;
  const bubbleWidth = actualTextWidth + padding * 2;
  const bubbleHeight = actualTextHeight + padding * 2;
  
  // 创建实际的文本样式（使用实际宽度）
  const textStyle = createSpeechTextStyle(actualTextWidth);
  
  // 计算气泡位置：应该在名称上方
  // 如果有名称，气泡应该在名称上方；如果没有名称，在角色上方
  // 名称通常在 -28（上方）或 24（下方）
  // 气泡底部应该在名称上方，所以气泡的 Y 坐标应该更小（更负）
  const nameHeight = 12; // 名称文本的大概高度
  const spacing = 8; // 气泡和名称之间的间距
  
  let defaultBubbleY: number;
  if (nameY !== undefined) {
    // 有名称：气泡应该在名称上方
    // nameY 是名称中心的 Y 坐标，名称高度约 12，所以名称顶部在 nameY - 6
    // 气泡底部应该在名称顶部上方，所以气泡底部在 nameY - 6 - spacing
    // 气泡中心在气泡底部上方 bubbleHeight/2，所以：
    defaultBubbleY = nameY - nameHeight / 2 - spacing - bubbleHeight;
  } else {
    // 没有名称：气泡在角色上方
    defaultBubbleY = -(bubbleHeight + tailHeight + 20);
  }
  
  let bubbleX = 0; // 默认居中
  let bubbleY = defaultBubbleY;
  let showBelow = false; // 是否显示在角色下方
  
  // 如果有视口信息，进行边界检测和位置调整
  if (viewportWidth && viewportHeight && viewportScale !== undefined && viewportScale > 0 && viewportX !== undefined && viewportY !== undefined) {
    // 将角色世界坐标转换为屏幕坐标
    const characterScreenX = (characterWorldX - viewportX) * viewportScale;
    const characterScreenY = (characterWorldY - viewportY) * viewportScale;
    
    // 计算气泡在屏幕空间中的位置（默认在角色上方）
    const bubbleScreenX = characterScreenX;
    const bubbleScreenY = characterScreenY + defaultBubbleY * viewportScale;
    
    // 边界检测和调整
    const margin = 10; // 边距
    let offsetX = 0;
    let offsetY = 0;
    
    // 检查左右边界
    const bubbleHalfWidth = (bubbleWidth * viewportScale) / 2;
    if (bubbleScreenX - bubbleHalfWidth < margin) {
      // 左边界超出，向右偏移
      offsetX = (margin - (bubbleScreenX - bubbleHalfWidth)) / viewportScale;
    } else if (bubbleScreenX + bubbleHalfWidth > viewportWidth - margin) {
      // 右边界超出，向左偏移
      offsetX = ((viewportWidth - margin) - (bubbleScreenX + bubbleHalfWidth)) / viewportScale;
    }
    
    // 检查上边界（如果气泡超出屏幕上方，显示在角色下方）
    if (bubbleScreenY < margin) {
      showBelow = true;
      // 显示在角色下方
      offsetY = bubbleHeight + tailHeight + 30; // 在角色下方，留出足够空间
    }
    
    bubbleX = offsetX;
    bubbleY = defaultBubbleY + offsetY;
  }
  
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    
    if (!text) return;
    
    const cornerRadius = 8;
    
    // 气泡背景
    g.beginFill(0xffffff, 0.95);
    g.lineStyle(2, 0x333333, 1);
    
    // 绘制气泡主体（圆角矩形）
    // bubbleY 是负值（在角色上方）或正值（在角色下方）
    g.drawRoundedRect(bubbleX - bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);
    
    // 绘制气泡箭头（在框的底部，指向角色中心 0,0）
    const tailX = bubbleX; // 箭头在气泡中心
    if (showBelow) {
      // 气泡在角色下方，箭头在气泡框的顶部，向上指向角色中心 (0, 0)
      const tailY = bubbleY; // 气泡框的顶部
      g.beginFill(0xffffff, 0.95);
      g.lineStyle(2, 0x333333, 1);
      g.moveTo(tailX - tailWidth, tailY);
      g.lineTo(tailX, tailY - tailHeight); // 指向角色中心 (0, 0)
      g.lineTo(tailX + tailWidth, tailY);
      g.closePath();
    } else {
      // 气泡在角色上方，箭头在气泡框的底部，向下指向角色中心 (0, 0)
      const tailY = bubbleY + bubbleHeight; // 气泡框的底部
      g.beginFill(0xffffff, 0.95);
      g.lineStyle(2, 0x333333, 1);
      g.moveTo(tailX - tailWidth, tailY);
      g.lineTo(tailX, tailY + tailHeight); // 指向角色中心 (0, 0)
      g.lineTo(tailX + tailWidth, tailY);
      g.closePath();
    }
    
    g.endFill();
  }, [text, bubbleX, bubbleY, bubbleWidth, bubbleHeight, showBelow, tailHeight, tailWidth]);

  return (
    <Container>
      <Graphics draw={draw} />
      <Text
        x={bubbleX}
        y={bubbleY + bubbleHeight / 2}
        text={text}
        anchor={{ x: 0.5, y: 0.5 }}
        style={textStyle}
      />
    </Container>
  );
}

function ViewerIndicator() {
  const draw = useCallback((g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0xffff0b, 0.5);
    g.drawRoundedRect(-10, 10, 20, 10, 100);
    g.endFill();
  }, []);

  return <Graphics draw={draw} />;
}
