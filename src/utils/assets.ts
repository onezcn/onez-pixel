// 获取资源基础路径
export function getAssetsBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__ONEZGAME_ASSETS_BASE__) {
    return (window as any).__ONEZGAME_ASSETS_BASE__;
  }
  return '/assets';
}

// 获取资源完整路径
export function getAssetPath(path: string): string {
  const base = getAssetsBaseUrl();
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // 确保 base 不以 / 结尾
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalizedBase}${normalizedPath}`;
}

