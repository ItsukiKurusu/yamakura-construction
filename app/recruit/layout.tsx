import type { Metadata } from "next"

/**
 * 採用情報ページのメタデータ。
 *
 * page.tsx が `"use client"` なので、そちらからは metadata を書き出せない。
 * 同じ階層に layout を置いて、サーバー側から与える。
 */
export const metadata: Metadata = {
  title: "採用情報",
  description:
    "株式会社山蔵では一緒に働く仲間を募集しています。経験者・未経験者は問いません。宮大工の伝統技術を現場で学べる環境です。",
  alternates: { canonical: "/recruit" },
  openGraph: {
    title: "採用情報 | 株式会社山蔵",
    description: "株式会社山蔵では一緒に働く仲間を募集しています。経験者・未経験者は問いません。宮大工の伝統技術を現場で学べる環境です。",
    url: "/recruit",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
