import * as THREE from "three"

import type { DeviceProfile } from "@/lib/renderer"
import { FIRE, IGNITE } from "./constants"
import { mergeGeometries } from "./surfaces"

/**
 * 篝火。天守台のまわりの平場に並べ、**完成の瞬間に円を描いて順に燃え上がる**。
 *
 * 画面上の大きさは 1% にも満たないので、物としての作り込みはしない。
 * 効かせるのは光のほうで、3 つの層に分けてある。
 *   炎       … 揺らぐシェーダーを描いた板。ブルームでにじんで「火」に見える
 *   足元の円 … 地面に置いた加算の円。点光源の代わりに照り返しを作る（安い）
 *   点光源   … 石垣と壁を下から照らす本物の光。**重いので篝火より少なくする**
 *
 * 点光源は最初から置いておき、明るさだけを 0 から上げる。
 * 途中で足すと、光の数が変わった瞬間に全マテリアルのシェーダーが
 * 組み直され、見せ場の真ん中で一瞬止まる。
 */

export type FiresHandle = {
  group: THREE.Group
  /** 生のスクロール進行度で点け、時間で揺らす。レンダーループから毎フレーム呼ぶ */
  update: (t: number, raw: number) => void
  dispose: () => void
}

const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function createFires(profile: DeviceProfile): FiresHandle {
  const group = new THREE.Group()
  const disposables: Array<{ dispose: () => void }> = []
  const N = FIRE.count

  // 置き場所。平場の上なので高さは 0（地形は半径 66 まで完全に水平）
  const spots: THREE.Vector3[] = []
  for (let i = 0; i < N; i++) {
    const a = THREE.MathUtils.degToRad(FIRE.startAz + (360 / N) * i)
    spots.push(new THREE.Vector3(Math.sin(a) * FIRE.radius, 0, Math.cos(a) * FIRE.radius))
  }

  // --- 篝台（鉄の三脚と籠）---
  {
    const parts: THREE.BufferGeometry[] = []
    const H = FIRE.standH
    for (const p of spots) {
      // 三脚。上ですぼまる
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2
        const leg = new THREE.CylinderGeometry(0.07, 0.09, H, 5)
        leg.translate(0, H / 2, 0)
        leg.rotateZ(0.13)
        leg.rotateY(a)
        leg.translate(p.x, 0, p.z)
        parts.push(leg)
      }
      // 籠。口の開いた円筒
      const basket = new THREE.CylinderGeometry(1.05, 0.7, 1.1, 10, 1, true)
      basket.translate(p.x, H + 0.3, p.z)
      parts.push(basket)
    }
    const geo = mergeGeometries(parts)
    for (const g of parts) g.dispose()
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1d1a17,
      roughness: 0.55,
      metalness: 0.6,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    group.add(mesh)
    disposables.push(geo, mat)
  }

  // --- 炎 ---
  // 1 基 = 板 1 枚。頂点シェーダーで縦軸だけを残してカメラに向ける
  // （完全にカメラへ向けると、見下ろしたときに炎が寝てしまう）
  const flameMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uW: { value: FIRE.flameW },
      uH: { value: FIRE.flameH },
      uBrightness: { value: FIRE.brightness },
      uIgnite: { value: new Array(N).fill(0) },
    },
    vertexShader: /* glsl */ `
      #define N ${N}
      attribute vec3 aCenter;
      attribute vec2 aCorner;
      attribute float aIndex;
      uniform float uW, uH;
      uniform float uIgnite[N];
      varying vec2 vUv;
      varying float vIgnite;
      varying float vSeed;

      void main() {
        float ign = uIgnite[int(aIndex)];
        vIgnite = ign;
        vSeed = aIndex * 7.13;
        vUv = vec2(aCorner.x * 0.5 + 0.5, aCorner.y);
        // 点いた直後は小さく、燃え上がるにつれて背が伸びる
        float h = uH * mix(0.25, 1.0, ign);
        vec4 mv = viewMatrix * vec4(aCenter + vec3(0.0, aCorner.y * h, 0.0), 1.0);
        mv.x += aCorner.x * uW * 0.5;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uBrightness;
      varying vec2 vUv;
      varying float vIgnite;
      varying float vSeed;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                   mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
        return s;
      }

      void main() {
        if (vIgnite < 0.001) discard;
        vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y);

        // 上へ流れるノイズで輪郭を揺らす
        float n = fbm(vec2(p.x * 2.4 + vSeed, p.y * 2.2 - uTime * 2.6 + vSeed));
        float n2 = fbm(vec2(p.x * 5.0 - vSeed, p.y * 4.0 - uTime * 4.1));

        // 根元が太く、先へ行くほど細い
        float w = mix(0.95, 0.04, pow(p.y, 0.75));
        float d = abs(p.x + (n - 0.5) * 0.5 * p.y) / w;
        float body = smoothstep(1.0, 0.15, d + (n2 - 0.5) * 0.6);
        float tip = smoothstep(1.0, 0.45, p.y + (n - 0.5) * 0.4);
        float base = smoothstep(0.0, 0.07, p.y);
        float flame = body * tip * base;
        if (flame < 0.01) discard;

        // 温度。芯と根元ほど高い。赤 → 橙 → 黄白
        float t = flame * (1.15 - p.y * 0.75);
        vec3 col = mix(vec3(0.9, 0.18, 0.03), vec3(1.0, 0.5, 0.1), smoothstep(0.15, 0.55, t));
        col = mix(col, vec3(1.0, 0.88, 0.6), smoothstep(0.7, 1.05, t));

        gl_FragColor = vec4(col * flame * uBrightness * vIgnite, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
  {
    const center = new Float32Array(N * 4 * 3)
    const corner = new Float32Array(N * 4 * 2)
    const index = new Float32Array(N * 4)
    const tris: number[] = []
    const C = [
      [-1, 0],
      [1, 0],
      [1, 1],
      [-1, 1],
    ]
    for (let i = 0; i < N; i++) {
      const p = spots[i]
      for (let k = 0; k < 4; k++) {
        const v = i * 4 + k
        center.set([p.x, FIRE.standH + 0.25, p.z], v * 3)
        corner.set(C[k], v * 2)
        index[v] = i
      }
      const b = i * 4
      tris.push(b, b + 1, b + 2, b, b + 2, b + 3)
    }
    const geo = new THREE.BufferGeometry()
    // position は three の都合で要る（境界の計算）。実際の位置はシェーダーで決める
    geo.setAttribute("position", new THREE.BufferAttribute(center.slice(), 3))
    geo.setAttribute("aCenter", new THREE.BufferAttribute(center, 3))
    geo.setAttribute("aCorner", new THREE.BufferAttribute(corner, 2))
    geo.setAttribute("aIndex", new THREE.BufferAttribute(index, 1))
    geo.setIndex(tris)
    const mesh = new THREE.Mesh(geo, flameMat)
    mesh.frustumCulled = false
    mesh.renderOrder = 5
    group.add(mesh)
    disposables.push(geo, flameMat)
  }

  // --- 火の粉 ---
  // 1 粒ごとに位相と速さを持たせ、頂点シェーダーの中で時間から位置を出す。
  // CPU は毎フレーム時間を渡すだけ
  const emberMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRise: { value: FIRE.emberRise },
      uLife: { value: FIRE.emberLife },
      uPixelRatio: { value: 1 },
      uIgnite: { value: new Array(N).fill(0) },
    },
    vertexShader: /* glsl */ `
      #define N ${N}
      attribute vec4 aRand;
      attribute float aIndex;
      uniform float uTime, uRise, uLife, uPixelRatio;
      uniform float uIgnite[N];
      varying float vAlpha;

      void main() {
        float ign = uIgnite[int(aIndex)];
        // 0..1 で一生を回す。粒ごとに寿命と位相をずらす
        float life = uLife * (0.6 + aRand.y * 0.8);
        float t = fract(uTime / life + aRand.x);
        vec3 p = position;
        p.y += t * uRise * (0.5 + aRand.z * 0.7);
        // 昇るほど風に流され、ゆらゆらと揺れる
        p.x += sin(t * 6.0 + aRand.w * 6.28) * 0.8 * t + t * t * 3.0;
        p.z += cos(t * 5.0 + aRand.x * 6.28) * 0.8 * t;
        // 生まれてすぐ明るく、昇りながら冷えて消える
        vAlpha = ign * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.35, 1.0, t));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((1.2 + aRand.z * 1.6) * uPixelRatio * (140.0 / max(-mv.z, 1.0)), 1.0, 4.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.01) discard;
        float r = length(gl_PointCoord - 0.5);
        float a = (1.0 - smoothstep(0.1, 0.5, r)) * vAlpha;
        // 橙。閾値を少し超えて、ブルームでわずかににじむ
        gl_FragColor = vec4(vec3(1.0, 0.55, 0.18) * 2.2 * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
  {
    const per = profile.isMobile ? FIRE.embersMobile : FIRE.embers
    const count = per * N
    const pos = new Float32Array(count * 3)
    const rand = new Float32Array(count * 4)
    const index = new Float32Array(count)
    let seed = 99
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      const f = Math.floor(i / per)
      const a = rnd() * Math.PI * 2
      const r = rnd() * 0.7
      pos.set([spots[f].x + Math.cos(a) * r, FIRE.standH + 0.6, spots[f].z + Math.sin(a) * r], i * 3)
      rand.set([rnd(), rnd(), rnd(), rnd()], i * 4)
      index[i] = f
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4))
    geo.setAttribute("aIndex", new THREE.BufferAttribute(index, 1))
    const points = new THREE.Points(geo, emberMat)
    points.frustumCulled = false
    points.renderOrder = 6
    group.add(points)
    disposables.push(geo, emberMat)
  }

  // --- 足元の照り返し ---
  const poolMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(FIRE.lightColor) },
      uOpacity: { value: FIRE.poolOpacity },
      uIgnite: { value: new Array(N).fill(0) },
    },
    vertexShader: /* glsl */ `
      #define N ${N}
      attribute float aIndex;
      uniform float uIgnite[N];
      varying vec2 vUv;
      varying float vIgnite;
      void main() {
        vUv = uv;
        vIgnite = uIgnite[int(aIndex)];
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vIgnite;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        // 逆二乗に近い落ち方。中心が強く、外へ急に弱まる
        float a = pow(max(0.0, 1.0 - r), 2.4) * uOpacity * vIgnite;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  {
    // 1 基 = 地面に寝かせた板 1 枚。篝火ごとの番号を持たせて、点く順番を合わせる
    const pos = new Float32Array(N * 4 * 3)
    const uv = new Float32Array(N * 4 * 2)
    const index = new Float32Array(N * 4)
    const tris: number[] = []
    const R = FIRE.poolRadius
    const C = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < 4; k++) {
        const v = i * 4 + k
        // 地形の平場は y = -0.2（terrain.ts）。わずかに浮かせる
        pos.set([spots[i].x + C[k][0] * R, -0.12, spots[i].z + C[k][1] * R], v * 3)
        uv.set([C[k][0] * 0.5 + 0.5, C[k][1] * 0.5 + 0.5], v * 2)
        index[v] = i
      }
      const b = i * 4
      // 上から見て表になる向き
      tris.push(b, b + 2, b + 1, b, b + 3, b + 2)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
    geo.setAttribute("aIndex", new THREE.BufferAttribute(index, 1))
    geo.setIndex(tris)
    const mesh = new THREE.Mesh(geo, poolMat)
    mesh.renderOrder = 4
    group.add(mesh)
    disposables.push(geo, poolMat)
  }

  // --- 点光源 ---
  const nLights = Math.min(N, profile.isMobile ? FIRE.lightsMobile : FIRE.lights)
  const lights: Array<{ light: THREE.PointLight; fire: number }> = []
  for (let k = 0; k < nLights; k++) {
    // 篝火を等間隔に間引いて受け持たせる
    const fire = Math.floor((k * N) / nLights)
    const light = new THREE.PointLight(FIRE.lightColor, 0, FIRE.lightDistance, 2)
    light.position.copy(spots[fire]).setY(FIRE.standH + 1.4)
    group.add(light)
    lights.push({ light, fire })
  }

  const ignite = new Array<number>(N).fill(0)

  return {
    group,
    update(t, raw) {
      for (let i = 0; i < N; i++) {
        const start = IGNITE.fireStart + i * IGNITE.fireStep
        const full = smooth01(start, start + IGNITE.fireRamp, raw)
        // 作業の火は最初から焚いておき、完成の瞬間に勢いを増す
        ignite[i] = FIRE.workFires.includes(i) ? FIRE.workLevel + (1 - FIRE.workLevel) * full : full
      }
      flameMat.uniforms.uTime.value = t
      flameMat.uniforms.uIgnite.value = ignite
      poolMat.uniforms.uIgnite.value = ignite
      emberMat.uniforms.uTime.value = t
      emberMat.uniforms.uIgnite.value = ignite
      emberMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
      for (const { light, fire } of lights) {
        // 炎の揺らぎ。灯（±6%）より大きく、しかし点滅には見えない程度に
        const n = 0.55 * Math.sin(t * 9.1 + fire * 2.3) + 0.45 * Math.sin(t * 15.7 + fire * 5.1)
        light.intensity = FIRE.lightIntensity * ignite[fire] * (1 + 0.14 * n)
      }
    },
    dispose() {
      for (const d of disposables) d.dispose()
      for (const { light } of lights) light.dispose()
      group.clear()
    },
  }
}
