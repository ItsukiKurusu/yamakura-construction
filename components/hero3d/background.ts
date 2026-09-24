import * as THREE from "three"
import type { DeviceProfile } from "@/lib/renderer"
import { BG_COLOR, DUST, LIGHT, MOON, SKY, STARS } from "./constants"

/**
 * 背景。空のドーム・月・星・空気中の塵。山は terrain.ts が持つ。
 *
 * 空は Poly Haven の HDRI（CC0・夜のクリアスカイ）から起こした正距円筒図を
 * ドームの内側に貼る。**同じ元データから作った小さい 1 枚を環境マップにも回す**
 * ので（scene.ts）、背景と映り込みが必ず一致する。
 *
 * **地形は HDRI から借りない。** CC0 の HDRI に「日本らしい森の山・夜」は
 * まず存在せず、実際に探して 2 回とも外れた（森の中から撮ったもの／
 * 真っ平らな農地）。空だけ借り、山は本物の起伏として作る（terrain.ts）。
 * HDRI 側の地形は、書き出しの時点で消してある
 * （scripts/build-material-textures.py の SKY_GROUND_FADE）。
 *
 * **月は光源そのもの。** キーライトの方位は月の方位から決めている（constants.ts）。
 * 月と星はカメラの位置に追従させて、無限遠にあるように振る舞わせる。
 * 原点に置いたままだと、カメラが 300 単位も回り込むたびに月の位置が
 * 数十度ずれて見え、「近くにぶら下がった電球」になってしまう。
 *
 * 塵と星の動きは**全部頂点シェーダーでやる**ので、CPU は毎フレーム何もしない。
 */

export type BackgroundHandle = {
  /** レンダーループから時間を渡す。カメラの位置に月と星を追従させる */
  update: (t: number) => void
  dispose: () => void
}

/** 月の方向（単位ベクトル）。見える月の仰角で出す */
function moonDirection(): THREE.Vector3 {
  const a = THREE.MathUtils.degToRad(MOON.azimuth)
  const e = THREE.MathUtils.degToRad(MOON.elevation)
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e))
}

/**
 * 月面のテクスチャを描く。
 *
 * 写真を持ち込まないのは、実物の月面写真だと解像度に対して情報が多すぎ、
 * 画面上の 30px ほどの円では**模様が潰れて灰色の汚れに見える**ため。
 * 見えるのは「縁が少し暗い」「左上に大きな海がある」くらいで十分。
 */
function drawMoonTexture(): THREE.CanvasTexture {
  const S = 256
  const c = document.createElement("canvas")
  c.width = S
  c.height = S
  const g = c.getContext("2d")!
  const R = S * 0.47
  const cx = S / 2
  const cy = S / 2

  // 周縁減光。縁ほどわずかに暗い
  const body = g.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.1, cx, cy, R)
  body.addColorStop(0, "#fbf8f0")
  body.addColorStop(0.75, "#e9e5da")
  body.addColorStop(1, "#c9c4b6")
  g.fillStyle = body
  g.beginPath()
  g.arc(cx, cy, R, 0, Math.PI * 2)
  g.fill()

  // 海（暗い平原）。配置は固定。ぼかした楕円を重ねて境目を柔らかくする
  g.save()
  g.beginPath()
  g.arc(cx, cy, R, 0, Math.PI * 2)
  g.clip()
  const maria: Array<[number, number, number, number, number]> = [
    // x, y, 横半径, 縦半径, 濃さ（すべて R に対する比）
    [-0.28, -0.22, 0.34, 0.26, 0.2],
    [0.12, -0.34, 0.22, 0.18, 0.16],
    [0.3, 0.02, 0.2, 0.3, 0.14],
    [-0.1, 0.18, 0.26, 0.16, 0.13],
    [0.05, 0.42, 0.14, 0.1, 0.1],
  ]
  g.filter = `blur(${Math.round(S * 0.02)}px)`
  for (const [x, y, rx, ry, a] of maria) {
    g.fillStyle = `rgba(120,116,106,${a})`
    g.beginPath()
    g.ellipse(cx + x * R, cy + y * R, rx * R, ry * R, 0.4, 0, Math.PI * 2)
    g.fill()
  }
  g.filter = "none"
  // 細かな凹凸。明暗の点を薄く撒く
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 260; i++) {
    const r = Math.sqrt(rnd()) * R
    const t = rnd() * Math.PI * 2
    g.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(90,86,78,0.10)"
    g.beginPath()
    g.arc(cx + Math.cos(t) * r, cy + Math.sin(t) * r, 0.6 + rnd() * 2.2, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 暈（かさ）。中心から指数的に落ちる光 */
function drawHaloTexture(): THREE.CanvasTexture {
  const S = 128
  const c = document.createElement("canvas")
  c.width = S
  c.height = S
  const g = c.getContext("2d")!
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    grad.addColorStop(t, `rgba(255,255,255,${Math.exp(-t * 5.5) * (1 - t)})`)
  }
  g.fillStyle = grad
  g.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(c)
}

export function createBackground(
  scene: THREE.Scene,
  camera: THREE.Camera,
  skyTexture: THREE.Texture,
  profile: DeviceProfile
): BackgroundHandle {
  const disposables: Array<{ dispose: () => void }> = []
  /** シーンから外すために持っておく */
  const added: THREE.Object3D[] = []

  const add = (o: THREE.Object3D) => {
    scene.add(o)
    added.push(o)
  }

  // --- 空のドーム ---
  // 一番奥から順に描き、深度は書かない。天主が必ず手前に来る。
  // fog も切る。この距離ではフォグで背景色に潰れて何も見えなくなる。
  {
    const geo = new THREE.SphereGeometry(SKY.radius, 48, 24)
    const mat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      // 明るさと色味はここで決める。テクスチャを焼き直さずに調整できる
      color: new THREE.Color(...SKY.tint).multiplyScalar(SKY.intensity),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      depthTest: false,
    })
    // 上空は自前のグラデーションに置き換える（constants.ts の SKY.blend）
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBlend = { value: new THREE.Vector2(...SKY.blend) }
      shader.uniforms.uUpper = { value: new THREE.Color(SKY.upper) }
      shader.uniforms.uZenith = { value: new THREE.Color(SKY.zenith) }
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vElev;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n vElev = normalize( position ).y;")
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float vElev;\nuniform vec2 uBlend;\nuniform vec3 uUpper, uZenith;"
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
           {
             vec3 night = mix( uUpper, uZenith, smoothstep( uBlend.y, 1.0, vElev ) );
             diffuseColor.rgb = mix( diffuseColor.rgb, night, smoothstep( uBlend.x, uBlend.y, vElev ) );
           }`
        )
    }
    const mesh = new THREE.Mesh(geo, mat)
    // 空の明るい側（地平の街明かり）を、そちらから来る光と同じ方位に回す
    mesh.rotation.y = SKY.rotation
    mesh.renderOrder = -30
    add(mesh)
    disposables.push(geo, mat)
  }

  // --- 月と星（カメラに追従する組） ---
  const sky = new THREE.Group()
  add(sky)
  const moonDir = moonDirection()

  {
    // 見かけの大きさから実寸を出す。距離に比例させるので、距離をいじっても大きさは変わらない
    const r = MOON.distance * Math.tan(THREE.MathUtils.degToRad(MOON.size / 2))
    const moonTex = drawMoonTexture()
    const haloTex = drawHaloTexture()
    disposables.push(moonTex, haloTex)

    // 月面。1 を超える色でブルームに拾わせる。
    // 深度は見る（手前の山に隠れる）が書かない（後ろの星を消さない）
    const moonGeo = new THREE.PlaneGeometry(r * 2, r * 2)
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: new THREE.Color(MOON.color).multiplyScalar(MOON.brightness),
      transparent: true,
      depthWrite: false,
      fog: false,
    })
    const moon = new THREE.Mesh(moonGeo, moonMat)
    moon.position.copy(moonDir).multiplyScalar(MOON.distance)
    moon.lookAt(0, 0, 0)
    moon.renderOrder = -27
    sky.add(moon)

    // 暈。加算で空を明るくする。月面より少し奥に置いて、月面の上に被らないようにする
    const haloGeo = new THREE.PlaneGeometry(r * 2 * MOON.haloSize, r * 2 * MOON.haloSize)
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      color: new THREE.Color(MOON.color),
      transparent: true,
      opacity: MOON.haloOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.copy(moonDir).multiplyScalar(MOON.distance * 1.01)
    halo.lookAt(0, 0, 0)
    halo.renderOrder = -29
    sky.add(halo)

    disposables.push(moonGeo, moonMat, haloGeo, haloMat)
  }

  // --- 星 ---
  const starCount = profile.isMobile ? STARS.countMobile : STARS.count
  const starPos = new Float32Array(starCount * 3)
  const starRand = new Float32Array(starCount * 4)
  const starColor = new Float32Array(starCount * 3)
  {
    let seed = 20261013
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < starCount; i++) {
      // 天球の上側に一様に撒く（y を一様に取ると面積あたり一様になる）
      const y = -0.04 + rnd() * 1.04
      const th = rnd() * Math.PI * 2
      const rr = Math.sqrt(Math.max(0, 1 - y * y))
      starPos[i * 3] = Math.cos(th) * rr * STARS.radius
      starPos[i * 3 + 1] = y * STARS.radius
      starPos[i * 3 + 2] = Math.sin(th) * rr * STARS.radius

      // 明るい星は少なく、暗い星がほとんど
      const b = Math.pow(rnd(), 5)
      starRand[i * 4] = STARS.sizeMin + (STARS.sizeMax - STARS.sizeMin) * Math.pow(b, 0.6)
      starRand[i * 4 + 1] = 0.12 + b * 0.88
      starRand[i * 4 + 2] = 0.6 + rnd() * 2.2 // 瞬きの速さ
      starRand[i * 4 + 3] = rnd() * 6.2831 // 位相

      // 色。ほとんど青白く、たまに橙
      const warm = rnd() < 0.18
      starColor[i * 3] = warm ? 1.0 : 0.82
      starColor[i * 3 + 1] = warm ? 0.86 : 0.9
      starColor[i * 3 + 2] = warm ? 0.72 : 1.0
    }
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute("aRand", new THREE.BufferAttribute(starRand, 4))
  starGeo.setAttribute("aColor", new THREE.BufferAttribute(starColor, 3))

  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBrightness: { value: STARS.brightness },
      uMoonDir: { value: moonDir },
      uClearCos: { value: Math.cos(THREE.MathUtils.degToRad(STARS.moonClear)) },
      uFadeCos: { value: Math.cos(THREE.MathUtils.degToRad(STARS.moonFade)) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aRand;
      attribute vec3 aColor;
      uniform float uTime, uPixelRatio, uBrightness, uClearCos, uFadeCos;
      uniform vec3 uMoonDir;
      varying vec3 vColor;

      void main() {
        vec3 dir = normalize(position);

        // 地平近くは大気に負けて見えない
        float horizon = smoothstep(0.03, 0.24, dir.y);
        // 月の近くは月明かりに負けて見えない
        float moon = 1.0 - smoothstep(uFadeCos, uClearCos, dot(dir, uMoonDir));
        // 瞬き。2 つの周期を掛けて規則性を消す
        float tw = 1.0 + 0.28 * sin(uTime * aRand.z + aRand.w) * sin(uTime * aRand.z * 1.73 + aRand.w * 2.1);

        vColor = aColor * aRand.y * horizon * moon * tw * uBrightness;

        gl_PointSize = aRand.x * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.15, 0.5, r);
        if (a * max(vColor.r, max(vColor.g, vColor.b)) < 0.003) discard;
        gl_FragColor = vec4(vColor * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
  const stars = new THREE.Points(starGeo, starMat)
  stars.frustumCulled = false
  stars.renderOrder = -28
  sky.add(stars)
  disposables.push(starGeo, starMat)

  // --- 塵 ---
  const count = profile.isMobile ? DUST.countMobile : DUST.count

  const positions = new Float32Array(count * 3)
  const randoms = new Float32Array(count * 4)

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * DUST.area[0]
    positions[i * 3 + 1] = (Math.random() - 0.5) * DUST.area[1] + DUST.centerY
    positions[i * 3 + 2] = (Math.random() - 0.5) * DUST.area[2]
    randoms[i * 4 + 0] = Math.random() // 位相
    randoms[i * 4 + 1] = 0.4 + Math.random() * 0.8 // 速さ
    randoms[i * 4 + 2] = 0.35 + Math.random() * 0.9 // 大きさ
    randoms[i * 4 + 3] = Math.random() // 明るさのばらつき
  }

  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  dustGeo.setAttribute("aRand", new THREE.BufferAttribute(randoms, 4))

  // 塵が光る向きは月の方向。月明かりに浮かぶ塵として見せる
  const lightDir = new THREE.Vector3(...LIGHT.keyPos)
    .sub(new THREE.Vector3(...LIGHT.keyTarget))
    .normalize()

  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: DUST.size },
      uColor: { value: new THREE.Color(DUST.color) },
      uOpacity: { value: DUST.opacity },
      uLightDir: { value: lightDir },
      uCenter: { value: new THREE.Vector3(0, DUST.centerY, 0) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aRand;
      uniform float uTime, uSize;
      uniform vec3 uLightDir, uCenter;
      varying float vBright;

      void main() {
        vec3 p = position;

        // ゆっくり漂う。上下・左右で周期をずらして、規則的に見えないようにする
        float t = uTime * aRand.y;
        p.x += sin(t * 0.21 + aRand.x * 6.2831) * 0.5;
        p.y += sin(t * 0.13 + aRand.x * 4.1) * 0.35;
        p.z += cos(t * 0.17 + aRand.x * 5.3) * 0.4;

        // 光の側にある粒ほど明るい。光の柱に浮かぶ塵を模す。
        // 基準は原点ではなく**建物の中心**。原点（地面の高さ）だと、
        // 上半分がまるごと「光の側」に入ってしまう
        float facing = dot(normalize(p - uCenter), uLightDir) * 0.5 + 0.5;
        vBright = pow(facing, 2.2) * (0.35 + aRand.w * 0.65);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(-mv.z, 0.001);

        // カメラのすぐ手前に来た粒は消す。
        // これが無いと、寄ったときに巨大なボケ玉になって画面を覆う。
        vBright *= smoothstep(0.6, 3.0, dist);

        // 距離で小さくする（一定サイズだと奥行きが死ぬ）が、上限を必ず掛ける
        gl_PointSize = clamp(uSize * aRand.z * (90.0 / dist), 1.0, 4.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vBright;

      void main() {
        // 丸くして縁をぼかす
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float a = (1.0 - smoothstep(0.1, 0.5, r)) * vBright * uOpacity;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    // 加算は重なると白く飽和するので、1粒あたりの寄与は極端に小さくしてある
    blending: THREE.AdditiveBlending,
    fog: false,
  })

  const dust = new THREE.Points(dustGeo, dustMat)
  // 頂点シェーダーで位置を動かすので、three が計算した境界と合わなくなる
  dust.frustumCulled = false
  add(dust)
  disposables.push(dustGeo, dustMat)

  return {
    update(t: number) {
      dustMat.uniforms.uTime.value = t
      starMat.uniforms.uTime.value = t
      // 画面の画素比。星の大きさを px で揃える
      starMat.uniforms.uPixelRatio.value = window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1
      // 無限遠に置く。向きは変えず、位置だけカメラに付いていく
      sky.position.copy(camera.position)
    },
    dispose() {
      for (const o of added) scene.remove(o)
      for (const d of disposables) d.dispose()
    },
  }
}

/** 背景が無いときのために、背景色だけは必ず敷いておく */
export const FALLBACK_BG = BG_COLOR
