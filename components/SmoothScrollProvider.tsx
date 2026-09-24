"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import "lenis/dist/lenis.css"

import { MotionContext, type Ticker } from "@/components/motion-state"

/**
 * スクロールの慣性（Lenis）と GSAP / ScrollTrigger を 1 本の RAF に統合する。
 *
 * このプロバイダは **全ページ**（app/layout.tsx）に掛ける。
 * トップだけに入れると下層ページとスクロールの手触りが変わり、
 * サイト全体の一貫性が崩れるため。
 *
 * ## モーション停止ポリシー
 * **OS の「アニメーションを減らす」設定を既定値として尊重する。**
 * この設定は閲覧者が自分で入れた明示的な要望であって、推測ではない。
 * 有効な環境では最初から演出を止め、Lenis も作らずネイティブスクロールに戻す。
 *
 * ただし**この場での選択はそれに勝つ**。ボタンを押した結果は localStorage に残り、
 * 次からは OS 設定ではなくその選択が使われる。
 * 「減らす設定だが、このサイトの演出は見たい」も、その逆も成り立つ。
 *
 * つまり三状態ある。
 *   保存された選択あり … その通りにする（OS 設定より優先）
 *   保存された選択なし … OS 設定に従う
 *
 * 以前は「既定は全員フル演出、押されたときだけ止める」という方針だった。
 * 環境差のクレームを避けるためだったが、**OS 設定を読んでおきながら
 * 何もしていない**状態でもあった。要望を受け取って無視するのが一番良くない。
 */

const STORAGE_KEY = "yamakura:motion-stopped"

// 型とコンテキストは motion-state.ts に置く（理由はそちらに）
export { useMotionState } from "@/components/motion-state"

/** gsap.ticker をそのまま渡す。関数の同一性が保たれるので remove も効く */
const ticker: Ticker = {
  add: (fn) => gsap.ticker.add(fn),
  remove: (fn) => gsap.ticker.remove(fn),
}

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  /**
   * この場での明示的な選択。**まだ選んでいない状態を null で区別する**のが肝で、
   * false（＝演出を見る）と「選んでいない」を同じ値にすると、
   * OS 設定に従うべき人まで演出が動いてしまう。
   *
   * SSR と初期 HTML を一致させるため、どちらもマウント後に確定させる。
   * サーバー側には OS 設定も localStorage も無いので、初回は必ず
   * 「未選択・OS 設定なし」＝演出ありで描かれ、直後に実際の値へ落ち着く。
   */
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  // 選択があればそれ、無ければ OS 設定
  const motionStopped = motionChoice ?? prefersReducedMotion

  // --- OS 設定の購読と、保存された選択の復元 ---
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setPrefersReducedMotion(mq.matches)
    sync()
    mq.addEventListener("change", sync)

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      // 未保存（null）はそのまま。OS 設定に委ねる
      if (saved === "1") setMotionChoice(true)
      else if (saved === "0") setMotionChoice(false)
    } catch {
      // プライベートブラウズ等で localStorage が読めなくても動作は続ける
    }

    return () => mq.removeEventListener("change", sync)
  }, [])

  const setMotionStopped = (stopped: boolean) => {
    setMotionChoice(stopped)
    try {
      window.localStorage.setItem(STORAGE_KEY, stopped ? "1" : "0")
    } catch {
      /* 保存できなくてもこのセッション中は効く */
    }
  }

  // --- Lenis と GSAP の統合 ---
  useEffect(() => {
    // CSS から現在の状態を参照できるようにしておく
    document.documentElement.classList.toggle("motion-stopped", motionStopped)

    // 停止中は Lenis を作らない＝ネイティブスクロールに戻す
    if (motionStopped) return

    gsap.registerPlugin(ScrollTrigger)
    // iOS のアドレスバー伸縮のたびに ScrollTrigger が再計算されるのを防ぐ
    ScrollTrigger.config({ ignoreMobileResize: true })

    const lenis = new Lenis({
      lerp: 0.1, // 0.08〜0.12 が実用域。小さいほど重い手触り
      smoothWheel: true,
      syncTouch: false, // タッチは指の動きに正直なほうが気持ちいい
      autoRaf: false, // RAF は gsap.ticker に一本化するので必ず false
    })
    lenisRef.current = lenis

    // 開発時だけ外から掴めるようにする。
    // **Lenis が実スクロールの持ち主**なので、window.scrollTo で位置を決めても
    // 演出の進行度は動かない（動いたように見えても、次の raf で戻される）。
    // 演出を特定の位置で止めて確かめるには、この実体に頼むしかない。
    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as Record<string, unknown>).__lenis = lenis
    }

    // この 3 行はセット。1 つでも欠けると二重に進むか、まったく進まなくなる。
    // とくに lagSmoothing(0) が無いと、タブ復帰時に溜まった時間が一気に適用されて
    // スクロールが飛ぶ。
    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000) // gsap は秒、lenis はミリ秒
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
      if (process.env.NODE_ENV === "development") {
        delete (window as unknown as Record<string, unknown>).__lenis
      }
    }
  }, [motionStopped])

  // --- ページ遷移時のリセット ---
  // Lenis は遷移をまたいで生き続けるので、スクロール位置を自分で戻す必要がある。
  // 併せて、遷移先で作られた ScrollTrigger の位置を測り直す。
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
    if (motionStopped) window.scrollTo(0, 0)
    // レイアウト確定後に測り直す
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname, motionStopped])

  return (
    <MotionContext.Provider value={{ motionStopped, prefersReducedMotion, setMotionStopped, ticker }}>
      {children}
      {/* OS で「アニメーションを減らす」を有効にしている人にだけ出す。
          既定でこちらが演出を止めている以上、**戻す手段は必ず要る**。
          設定を入れていない人には出さない（押す理由がない）。 */}
      {prefersReducedMotion && (
        <button
          type="button"
          onClick={() => setMotionStopped(!motionStopped)}
          /* aria-pressed は付けない。ラベルが状態ではなく**動作**を指しているので、
             併用すると「アニメーションを再生する、押されています」と読まれて矛盾する */
          className="fixed bottom-4 right-4 z-[60] rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-xs font-medium text-gray-700 shadow-lg backdrop-blur-md transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {motionStopped ? "アニメーションを再生する" : "アニメーションを停止する"}
        </button>
      )}
    </MotionContext.Provider>
  )
}
