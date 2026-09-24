import * as THREE from "three"

import { clamp01, easeOutQuart } from "./ease"

/**
 * 同じ形が大量に並ぶものを 1 ドローコールで描く層。
 *
 * 天主は石垣の石だけで 600 を超える。1 石 1 メッシュにすると、
 * それだけでドローコールが予算を食い潰す。
 *
 * 動きは個別に付けたいので、**毎フレーム行列を書き直す**方式にしている。
 * 600 個の行列合成は 1 フレームあたり 0.1ms 程度で、描画側で浮く時間に見合う。
 *
 * もう一つの節約が `count`。InstancedMesh は先頭から count 個だけを描くので、
 * **出番の早い順に並べておけば、まだ出ていない分は頂点処理ごと省ける**。
 */

export type InstanceSpec = {
  /** 据わる位置（3D 単位） */
  pos: THREE.Vector3
  /** 据わる姿勢 */
  quat: THREE.Quaternion
  /** ジオメトリに対する倍率。既定は等倍 */
  scale?: THREE.Vector3
  /** 個体色。省略すると材のまま */
  color?: THREE.Color
  /** 組み上がる前のずれ（3D 単位） */
  scatter: THREE.Vector3
  /** 散開時の姿勢の崩し（据わり姿勢に対する相対） */
  spin?: THREE.Quaternion
  delay: number
  span: number
}

export type InstancedBank = {
  mesh: THREE.InstancedMesh
  setProgress: (p: number) => void
  dispose: () => void
}

const _m = new THREE.Matrix4()
const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const ONE = new THREE.Vector3(1, 1, 1)

export function createInstancedBank(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  input: InstanceSpec[]
): InstancedBank {
  // 出番の早い順に並べる。count を切って未出現ぶんを丸ごと省くため
  const specs = [...input].sort((a, b) => a.delay - b.delay)

  const mesh = new THREE.InstancedMesh(geometry, material, specs.length)
  mesh.castShadow = true
  mesh.receiveShadow = true
  // 頂点シェーダーではなく行列で動かすので境界は正しいが、
  // 散開位置まで含めた境界を three は知らない。自前で切らない
  mesh.frustumCulled = false
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  const scatterQuats = specs.map((s) =>
    s.spin ? s.quat.clone().multiply(s.spin) : s.quat.clone()
  )

  if (specs.some((s) => s.color)) {
    for (let i = 0; i < specs.length; i++) {
      mesh.setColorAt(i, specs[i].color ?? new THREE.Color(0xffffff))
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  function setProgress(p: number) {
    let count = 0

    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      if (p < s.delay) break // 以降は全部まだ出番前（delay 昇順なので）
      count = i + 1

      const local = clamp01((p - s.delay) / Math.max(s.span, 1e-4))
      const t = easeOutQuart(local)

      _p.copy(s.scatter).multiplyScalar(1 - t).add(s.pos)
      _q.slerpQuaternions(scatterQuats[i], s.quat, easeOutQuart(clamp01(local / 0.4)))
      _m.compose(_p, _q, s.scale ?? ONE)
      mesh.setMatrixAt(i, _m)
    }

    mesh.count = count
    mesh.instanceMatrix.needsUpdate = true
  }

  setProgress(0)

  return {
    mesh,
    setProgress,
    dispose() {
      mesh.dispose()
      geometry.dispose()
    },
  }
}
