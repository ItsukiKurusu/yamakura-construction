/**
 * 組み立ての動きに使うイージング。
 * 部材（tenshu.ts）と大量配置（instanced.ts）の両方から使うので独立させてある。
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

/** 叩き込む動き。3 回に分けて入る */
export const easeHammer = (t: number) => {
  const steps = 3
  const s = Math.min(Math.floor(t * steps), steps - 1)
  const local = t * steps - s
  return (s + (1 - Math.pow(1 - local, 3))) / steps
}
