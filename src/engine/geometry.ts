// 游戏引擎：几何工具函数
// 从 convex/util/geometry.ts 提取，移除 Convex 依赖

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  dx: number;
  dy: number;
}

export function distance(p0: Point, p1: Point): number {
  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointsEqual(p0: Point, p1: Point): boolean {
  return p0.x == p1.x && p0.y == p1.y;
}

export function manhattanDistance(p0: Point, p1: Point) {
  return Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y);
}

export const EPSILON = 0.0001;

export function vector(p0: Point, p1: Point): Vector {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  return { dx, dy };
}

export function vectorLength(vector: Vector): number {
  return Math.sqrt(vector.dx * vector.dx + vector.dy * vector.dy);
}

export function normalize(vector: Vector): Vector | null {
  const len = vectorLength(vector);
  if (len < EPSILON) {
    return null;
  }
  const { dx, dy } = vector;
  return {
    dx: dx / len,
    dy: dy / len,
  };
}

export function orientationDegrees(vector: Vector): number {
  if (Math.sqrt(vector.dx * vector.dx + vector.dy * vector.dy) < EPSILON) {
    throw new Error(`Can't compute the orientation of too small vector ${JSON.stringify(vector)}`);
  }
  const twoPi = 2 * Math.PI;
  const radians = (Math.atan2(vector.dy, vector.dx) + twoPi) % twoPi;
  return (radians / twoPi) * 360;
}

