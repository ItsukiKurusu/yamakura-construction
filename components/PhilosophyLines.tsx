import { KANJI_NUMERALS, PHILOSOPHY } from "@/lib/philosophy"

/**
 * 3D ヒーローの幕ごとに 1 行ずつ現れる「山蔵の考え方」。
 *
 * 全行を同じ場所に重ねて置き、どれを出すかはスクロールが決める。
 * hero3d/scrollChoreography.ts が各行に --t（-1 入る前 … 0 表示中 … 1 消えた）を書き、
 * 横から滑り込む・ぼかしが取れる・消えるといった見た目は globals.css の .philosophy-line が決める。
 * JS はこの値を書くだけなので軽く、three.js にも依存しない。
 *
 * 全行が DOM にあるので、読み上げでは順に読める。動きを止めた人には出さない
 * （ヒーローは完成の静止画になり、同じ内容は下の各セクションにある）。
 */
export default function PhilosophyLines() {
  return (
    <div data-philosophy className="philosophy pointer-events-none absolute inset-x-0 z-10">
      <ol aria-label="山蔵の考え方" className="grid">
        {PHILOSOPHY.lines.map((line, i) => (
          <li key={line.from} data-philosophy-line className="philosophy-line [grid-area:1/1]">
            <span aria-hidden="true" className="philosophy-num">
              {KANJI_NUMERALS[i]}
            </span>
            <span className="philosophy-text">
              {line.text.split("|").map((chunk) => (
                <span key={chunk} className="inline-block">
                  {chunk}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
