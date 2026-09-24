import type { MetadataRoute } from "next"

import { workIds } from "@/lib/works"

/**
 * サイトマップ。
 *
 * 以前は public/sitemap.xml に手書きで置いてあり、採用ページが抜けていた。
 * ドメインも lastmod も直書きだった
 * （ページを足すたびに書き足す運用は、必ずどこかで漏れる）。
 *
 * ここで生成すれば、metadataBase を 1 か所直すだけでドメインが揃う。
 */

const BASE = "https://v0-construction-company-website-eta.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const pages: Array<{ path: string; priority: number; freq: "weekly" | "monthly" }> = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/about", priority: 0.8, freq: "monthly" },
    { path: "/services", priority: 0.9, freq: "monthly" },
    { path: "/works", priority: 0.9, freq: "weekly" },
    { path: "/recruit", priority: 0.8, freq: "monthly" },
    { path: "/contact", priority: 0.8, freq: "monthly" },
    // 事例の詳細。一覧に載っているのに sitemap から漏れていた
    ...workIds.map((id) => ({ path: `/works/${id}`, priority: 0.7, freq: "monthly" as const })),
  ]

  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }))
}
