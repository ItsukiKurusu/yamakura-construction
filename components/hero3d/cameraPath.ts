import * as THREE from "three"

import {
  ASPECT_REFERENCE, CAMERA, CAMERA_KEYS, CAMERA_SAFE_RADIUS, MAX_DISTANCE_SCALE, MAX_FOV,
} from "./constants"

/**
 * カメラの通り道。
 *
 * **極座標で持つ**のが肝。
 * 位置を x/z で直接置くと、キーを結んだ結果カメラが右へ行ったり左へ戻ったりする。
 * 方位角を単調増加の数列として持てば、**スクロールを下げるほど同じ向きに
 * 回り続ける**ことが数値の上で保証され、絵を作る側は「どこまで回すか」
 * だけを考えればよくなる。
 *
 * 方位角・距離・高さはスカラーの Catmull-Rom、注視点は Catmull-Rom 曲線で繋ぐ。
 * 区間ごとのイージングだとキーの位置で速度が不連続になり、スクラブしたときに
 * 「カクッ」と引っかかって見える。
 *
 * 一方で「どの進行度でどのキーに居るか」は自分で決めたいので、
 * **進行度 → 曲線パラメータ**の写像だけ別に持つ（キーの p を折れ線で繋ぐ）。
 */

export type CameraPose = {
  pos: THREE.Vector3
  look: THREE.Vector3
  /** 縦の画角（度）。縦長の画面では、引ききれない分をここで広げる */
  fov: number
}

export type CameraPath = {
  sample: (p: number, aspect: number, out: CameraPose) => void
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** 等間隔に並んだ数列を Catmull-Rom で引く。t は 0..1 で全体をまたぐ */
function crScalar(v: readonly number[], t: number): number {
  const n = v.length - 1
  const f = clamp01(t) * n
  const i = Math.min(Math.floor(f), n - 1)
  const s = f - i
  const p0 = v[Math.max(i - 1, 0)]
  const p1 = v[i]
  const p2 = v[i + 1]
  const p3 = v[Math.min(i + 2, n)]
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * s +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s +
      (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s)
  )
}

export function createCameraPath(): CameraPath {
  const keys = CAMERA_KEYS
  const last = keys.length - 1

  const az = keys.map((k) => k.az)
  const dist = keys.map((k) => k.dist)
  const height = keys.map((k) => k.y)

  const lookCurve = new THREE.CatmullRomCurve3(
    keys.map((k) => new THREE.Vector3(...k.look)),
    false,
    "catmullrom",
    0.5
  )

  // i 番目のキーはちょうど t = i / last に乗る。
  // 進行度のほうは不等間隔で置きたいので、ここで折れ線に通す。
  function toCurveT(p: number): number {
    const v = clamp01(p)
    for (let i = 0; i < last; i++) {
      const a = keys[i].p
      const b = keys[i + 1].p
      if (v <= b) {
        const local = b > a ? (v - a) / (b - a) : 0
        return (i + clamp01(local)) / last
      }
    }
    return 1
  }

  const _look = new THREE.Vector3()

  function sample(p: number, aspect: number, out: CameraPose) {
    const t = toCurveT(p)
    lookCurve.getPoint(t, _look)

    const a = crScalar(az, t) * THREE.MathUtils.DEG2RAD
    const d = crScalar(dist, t)
    const y = crScalar(height, t)

    // 縦長の画面では水平画角が足りず天主が収まらない。どれだけ引く必要があるか
    const need = Math.min(MAX_DISTANCE_SCALE, Math.max(1, ASPECT_REFERENCE / Math.max(aspect, 0.2)))

    // まず**注視点からの離れ方**を伸ばす（高さの差も一緒に伸ばさないと構図が変わる）。
    // ただし城からの半径 CAMERA_SAFE_RADIUS より外へは出さない。
    // 出ると森と尾根に入り、スマホでは最後の構図が山の中に埋まっていた
    const reach = Math.hypot(_look.x + Math.sin(a) * d, _look.z + Math.cos(a) * d)
    const dolly = Math.max(1, Math.min(need, CAMERA_SAFE_RADIUS / Math.max(reach, 1e-3)))

    // 引ききれなかった分は画角を広げて補う。
    // 注視点に置いた物の写る大きさは、引いた場合と同じになる
    const rest = need / dolly
    const half = THREE.MathUtils.degToRad(CAMERA.fov / 2)
    out.fov = Math.min(MAX_FOV, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) * rest)))

    out.look.copy(_look)
    out.pos.set(
      _look.x + Math.sin(a) * d * dolly,
      _look.y + (y - _look.y) * dolly,
      _look.z + Math.cos(a) * d * dolly
    )
  }

  return { sample }
}
