import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { SCROLL_DISTANCE, TEXT_FADE } from "./constants"

/**
 * スクロールと 3D の橋渡し。
 *
 * **ここは進行度を書くだけ**で、オブジェクトは一切動かさない。
 * 実際に動かすのは HeroCanvas のレンダーループで、そこが遅延補間して追いつく。
 * こうしておくとスクロールイベントの発火頻度に描画が引きずられないし、
 * 演出の定義（キーフレーム）と動きの質（lambda）を別々に調整できる。
 *
 * 進行度は**一本の値**しか持たない。カメラも部材もすべてここから引くので、
 * 「カメラだけ先に着いて部材が遅れる」といったズレが原理的に起きない。
 */

export type ScrollTargets = {
  /** 生の進行度 0..1 */
  progress: number
}

export type ChoreographyHandle = {
  targets: ScrollTargets
  applyProgress: (p: number) => void
  kill: () => void
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** from..to の区間で 0..1 に正規化する */
const span = (v: number, from: number, to: number) => clamp01((v - from) / (to - from))

export function createChoreography(
  trigger: HTMLElement,
  onActiveChange?: (active: boolean) => void
): ChoreographyHandle {
  gsap.registerPlugin(ScrollTrigger)

  const targets: ScrollTargets = { progress: 0 }

  function applyProgress(p: number) {
    targets.progress = p

    // テキストの退場。DOM から消さず不透明度だけ変える（h1 は SEO のため残す）。
    // CSS 変数で配ることで、どの要素をどう消すかは CSS 側の判断にできる。
    //
    // 継手を見せ切ってから退く。ここで残っていると、引きに入ったときに
    // 見出しが小屋の真ん中に被さる。
    const textOpacity = 1 - span(p, TEXT_FADE.start, TEXT_FADE.end)
    trigger.style.setProperty("--hero-text-opacity", String(textOpacity))
    // 透明な要素がクリックを吸うのを防ぐ（よくある事故）
    trigger.style.setProperty("--hero-text-events", textOpacity < 0.05 ? "none" : "auto")
  }

  applyProgress(0)

  const st = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: SCROLL_DISTANCE,
    pin: true,
    // Lenis が慣性を持っているので、数値 scrub は使わない。
    // 数値を入れると二重に遅れて「もたつく」動きになる。
    scrub: true,
    onUpdate: (self) => applyProgress(self.progress),
    // ピンを抜けたら描画を止められるよう、外へ知らせる
    onToggle: (self) => onActiveChange?.(self.isActive),
  })

  return {
    targets,
    applyProgress,
    kill() {
      st.kill()
    },
  }
}
