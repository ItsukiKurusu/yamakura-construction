"use client"

import { createContext, useContext } from "react"

/**
 * 演出の状態と共有 RAF を配るコンテキスト。
 *
 * SmoothScrollProvider から切り離してあるのは、**ページ側がプロバイダのモジュールを
 * import すると、Lenis と GSAP がページの bundle にもう一組入る**ため
 * （レイアウト側の一組と重複し、トップの初回 JS が 20kB 以上増えた）。
 * ページ側はこのファイルだけを読み、GSAP 本体には触れない。
 */

export type Ticker = {
  add: (fn: () => void) => void
  remove: (fn: () => void) => void
}

export type MotionState = {
  /** いま演出を止めているか（この場での選択 → 無ければ OS 設定） */
  motionStopped: boolean
  /** OS 側で「アニメーションを減らす」が有効か */
  prefersReducedMotion: boolean
  setMotionStopped: (stopped: boolean) => void
  /** RAF は gsap.ticker に一本化してある。毎フレームの処理はここに載せる */
  ticker: Ticker
}

export const MotionContext = createContext<MotionState>({
  motionStopped: false,
  prefersReducedMotion: false,
  setMotionStopped: () => {},
  ticker: { add: () => {}, remove: () => {} },
})

/** 3D 側などから「いま演出を動かしてよいか」を読むためのフック */
export function useMotionState() {
  return useContext(MotionContext)
}
