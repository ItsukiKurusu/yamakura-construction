import * as THREE from "three"

/**
 * レンダラの初期化と解像度予算。
 *
 * DPR に上限を掛けるだけでは足りない。4K ディスプレイでは上限 1.75 でも
 * 3840x2160x1.75^2 となり、GPU が塗るピクセル数が予算を大きく超える。
 * そこで「総ピクセル数」で予算を切り、超えた分だけ DPR を下げる。
 */

/** デスクトップのピクセル予算（約 369 万画素） */
export const MAX_PIXELS_DESKTOP = 2560 * 1440
/** モバイルのピクセル予算。GPU 負荷そのものを下げるため大きく絞る */
export const MAX_PIXELS_MOBILE = 1600 * 900

export const MAX_DPR_DESKTOP = 1.75
export const MAX_DPR_MOBILE = 1.5

/** トーンマッピングの露出。参考写真の深い陰影に寄せるため 1.0 より落としている */
export const TONE_MAPPING_EXPOSURE = 1.05

export type DeviceProfile = {
  isMobile: boolean
  /** OS の「アニメーションを減らす」設定が入っているか */
  prefersReducedMotion: boolean
  maxPixels: number
  maxDpr: number
  /** 影の解像度。0 なら影を焼かない */
  shadowMapSize: number
}

/**
 * 端末の能力を 1 つのオブジェクトに正規化する。
 * 条件分岐を各所に散らさず、ここだけを見れば品質方針が分かる状態にする。
 */
export function readDeviceProfile(): DeviceProfile {
  // ポインタが粗い（＝指で操作している）か、短辺が小さい端末をモバイル扱いにする。
  // UA 判定はしない。同じ端末でもウィンドウ幅で条件が変わるほうが実態に合う。
  const coarsePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  const shortSide =
    typeof window !== "undefined" ? Math.min(window.innerWidth, window.innerHeight) : 1080
  const isMobile = coarsePointer || shortSide <= 640

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // 論理コア数が少ない端末はさらに 1 段落とす
  const lowCore = typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 8) <= 4

  return {
    isMobile,
    prefersReducedMotion,
    maxPixels: isMobile ? MAX_PIXELS_MOBILE : MAX_PIXELS_DESKTOP,
    maxDpr: isMobile ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP,
    // 影は解像度ではなく「そもそも焼くか」から絞る。
    // 低スペック端末では 0（影なし）にして GPU 負荷自体を落とす。
    shadowMapSize: lowCore ? 0 : isMobile ? 512 : 1024,
  }
}

export type RendererHandle = {
  renderer: THREE.WebGLRenderer
  profile: DeviceProfile
  /** 現在の canvas サイズとピクセル予算から解像度を決め直す */
  applyResolution: () => { width: number; height: number; dpr: number }
  dispose: () => void
}

/**
 * WebGL レンダラを作る。取得できない環境では null を返すので、
 * 呼び出し側は静的な代替表示に落とすこと。
 */
export function createRenderer(
  canvas: HTMLCanvasElement,
  profile: DeviceProfile
): RendererHandle | null {
  let renderer: THREE.WebGLRenderer

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      // ポストプロセスを積まないので、レンダラ側の MSAA をそのまま使うのが一番安い。
      // （ポストを入れた時点で MSAA は効かなくなるため、その場合は false にして
      //   FXAA/SMAA パスへ置き換えること）
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    })
  } catch {
    return null
  }

  // 色空間は three の既定（SRGBColorSpace）に任せる。
  // 明示的に設定が要るのは**テクスチャ側**であって、レンダラ側ではない。
  //   - 色として使うテクスチャ    → texture.colorSpace = THREE.SRGBColorSpace
  //   - データとして使うテクスチャ → 触らない（リニアのまま）
  //     roughness / normal / AO / displacement がこれにあたる。
  //     ここに sRGB を付けるのが最頻出のバグで、「色は変じゃないのに質感が微妙」になる。
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE

  if (profile.shadowMapSize > 0) {
    renderer.shadowMap.enabled = true
    // r186 で PCFSoftShadowMap は削除された（指定しても PCFShadowMap に落ちて警告が出る）
    renderer.shadowMap.type = THREE.PCFShadowMap
  }

  function applyResolution() {
    // clientWidth/Height は CSS 上のサイズ。canvas 属性のサイズではない。
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight

    let dpr = Math.min(window.devicePixelRatio || 1, profile.maxDpr)

    // 総ピクセル数が予算を超えていたら、超過分の平方根で DPR を割る。
    // 面積に対する比なので平方根を取るのが正しい。
    const over = (width * height * dpr * dpr) / profile.maxPixels
    if (over > 1) dpr /= Math.sqrt(over)

    renderer.setPixelRatio(dpr)
    // 第 3 引数 false が重要。true にすると three が canvas の CSS サイズを
    // 書き換えてしまい、こちらのレイアウトと喧嘩する。
    renderer.setSize(width, height, false)

    return { width, height, dpr }
  }

  applyResolution()

  return {
    renderer,
    profile,
    applyResolution,
    dispose() {
      renderer.dispose()
      // WebGL コンテキストは明示的に手放す。
      // これをやらないとブラウザの同時コンテキスト数の上限に達し、
      // ページを往復するうちに「古いコンテキストが失われました」で描画が止まる。
      renderer.forceContextLoss()
    },
  }
}

/**
 * リサイズを rAF で 1 フレームに 1 回へ間引く。
 * resize イベントは連射されるため、そのたびにレンダーターゲットを
 * 作り直すと目に見えて重くなる。
 *
 * @returns 解除用の関数
 */
export function attachResize(onResize: () => void): () => void {
  let frame = 0

  const handle = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      onResize()
    })
  }

  window.addEventListener("resize", handle)
  // iOS のアドレスバー伸縮でも発火させたいので orientationchange も拾う
  window.addEventListener("orientationchange", handle)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener("resize", handle)
    window.removeEventListener("orientationchange", handle)
  }
}
