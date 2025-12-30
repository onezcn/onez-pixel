import StaticGameApp from './components/StaticGameApp.tsx';
import type { OnezGameConfig } from './onezgame.ts';

interface StaticAppProps {
  config?: OnezGameConfig;
}

export default function StaticApp({ config }: StaticAppProps) {
  const showUI = config?.showUI !== false;
  const title = config?.title || 'AI Town - Static';
  const hint = config?.hint || '使用 WASD 或方向键移动角色';

  return (
    <main className="relative w-full h-screen font-body game-background overflow-hidden">
      {/* 游戏画布 - 占据整个视口 */}
      <StaticGameApp config={config} />
      
      {/* UI 覆盖层 */}
      {showUI && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-start p-4">
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold font-display leading-none tracking-wide game-title mb-4">
            {title}
          </h1>
          <div className="text-base sm:text-xl md:text-2xl text-white leading-tight shadow-solid text-center">
            {hint}
          </div>
        </div>
      )}
    </main>
  );
}

