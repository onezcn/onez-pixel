import { useState, useEffect } from 'react';
import { Stage } from '@pixi/react';
import StaticGame from './StaticGame.tsx';
import type { OnezGameConfig } from '../onezgame.ts';

interface StaticGameAppProps {
  config?: OnezGameConfig;
}

export default function StaticGameApp({ config }: StaticGameAppProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    // 初始化时也更新一次尺寸
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const backgroundColor = config?.backgroundColor ?? 0x7ab5ff;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundColor }}>
        <StaticGame width={dimensions.width} height={dimensions.height} config={config} />
      </Stage>
    </div>
  );
}

