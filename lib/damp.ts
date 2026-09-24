/**
 * フレームレート非依存の減衰。
 *
 * `x += (target - x) * 0.1` 形式は使わない。あれは「1フレームあたり 10%」なので、
 * 120Hz のモニタでは 60Hz の倍の速さで追従してしまい、環境ごとに手触りが変わる。
 * 指数減衰なら経過時間 dt を基準にするため、fps に関係なく同じ速さで追いつく。
 *
 * three の `MathUtils.damp()` と同じ式だが、**ここでは three を import しない**。
 * このファイルが three を引き込むと、3D を使わない下層ページのバンドルにまで
 * three が載ってしまうため。
 */

/**
 * 補間係数だけを返す。Vector3 / Quaternion など three のオブジェクトに対しては
 * `vec.lerp(target, dampAlpha(lambda, dt))` の形で使う。
 */
export function dampAlpha(lambda: number, dt: number): number {
  return 1 - Math.exp(-lambda * dt);
}

/**
 * スカラー値を target へ減衰追従させる。
 *
 * @param lambda 追従の速さ。大きいほど機敏。
 *               2.0〜3.5 = 重い・高級（金属や什器の印象）
 *               4〜6     = 標準
 *               8〜12    = 機敏・UI 寄り
 *               本サイトは「百年もつ仕事」を表すため、意図的に遅い側を使う。
 * @param dt    前フレームからの経過秒数
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * dampAlpha(lambda, dt);
}

/**
 * 角度用。-π..π に巻き戻してから補間するので、境界をまたぐときに
 * 逆回りの大回転をしない。
 */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const TAU = Math.PI * 2;
  let delta = (target - current) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return current + delta * dampAlpha(lambda, dt);
}
