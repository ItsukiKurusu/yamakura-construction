import type { Metadata } from "next"

/**
 * 施工実績ページのメタデータ。
 *
 * page.tsx が `"use client"` なので、そちらからは metadata を書き出せない。
 * 同じ階層に layout を置いて、サーバー側から与える。
 */
export const metadata: Metadata = {
  title: "施工実績",
  description:
    "株式会社山蔵の施工事例。坂本七丁目事務所の新築工事、妙法院の柱修復工事など、木造住宅から文化財修復までの実績をご紹介します。",
  alternates: { canonical: "/works" },
  openGraph: {
    title: "施工実績 | 株式会社山蔵",
    description: "株式会社山蔵の施工事例。坂本七丁目事務所の新築工事、妙法院の柱修復工事など、木造住宅から文化財修復までの実績をご紹介します。",
    url: "/works",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
