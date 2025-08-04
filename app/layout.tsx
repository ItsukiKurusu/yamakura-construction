import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "株式会社山蔵 | 滋賀・京都の建設会社 | 宮大工の技でつくる住まいの芸術",
    template: "%s | 株式会社山蔵",
  },
  description:
    "滋賀・京都エリアの建設会社。宮大工の伝統技術と現代建築を融合し、新築住宅からリフォーム、社寺建築まで幅広く対応。一級建築士による設計・監理で安心の家づくりをサポートします。",
  keywords: [
    "建設会社",
    "滋賀",
    "京都",
    "大津市",
    "宮大工",
    "新築住宅",
    "リフォーム",
    "一級建築士",
    "伝統建築",
    "社寺建築",
    "文化財修復",
    "外構工事",
    "公共工事",
    "木造住宅",
    "継手",
    "仕口",
    "伝統工法",
    "山口祐介",
    "株式会社山蔵",
  ],
  authors: [{ name: "株式会社山蔵" }],
  creator: "株式会社山蔵",
  publisher: "株式会社山蔵",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://yamakura-construction.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "株式会社山蔵 | 滋賀・京都の建設会社 | 宮大工の技でつくる住まいの芸術",
    description:
      "滋賀・京都エリアの建設会社。宮大工の伝統技術と現代建築を融合し、新築住宅からリフォーム、社寺建築まで幅広く対応。",
    url: "https://yamakura-construction.vercel.app",
    siteName: "株式会社山蔵",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/images/logo.jpg",
        width: 1200,
        height: 630,
        alt: "株式会社山蔵 - 宮大工の技でつくる住まいの芸術",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "株式会社山蔵 | 滋賀・京都の建設会社",
    description: "宮大工の伝統技術と現代建築を融合した家づくり",
    images: ["/images/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code-here", // 後で設定
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="google-site-verification" content="ここにコピーしたcontent値を貼り付け" />
        <link rel="canonical" href="https://yamakura-construction-bz4kx3194-itsukikurusuaw-5549s-projects.vercel.app" />
        <meta name="geo.region" content="JP-25" />
        <meta name="geo.placename" content="大津市" />
        <meta name="geo.position" content="35.0116;135.8681" />
        <meta name="ICBM" content="35.0116, 135.8681" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}