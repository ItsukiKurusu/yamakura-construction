"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Phone, MapPin, Users, Wrench, Heart, Instagram, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"
import HeroLoader from "@/components/hero3d/HeroLoader"
import CraftFilm from "@/components/CraftFilm"

// three.js は下層ページに載せない。
// ssr: false なので、サーバー側では一切評価されない（three は window を触る）。
const HeroCanvas = dynamic(() => import("@/components/hero3d/HeroCanvas"), {
  ssr: false,
})

// cubic-bezier は 4 要素タプルとして渡す必要がある（number[] だと代入できない）
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function HomePage() {
  const [heroReady, setHeroReady] = useState(false)
  // テクスチャの実際の読み込み進捗。合計 2.6MB あるので、
  // 時間で這わせた偽の数字ではなく本物を出す
  const [heroProgress, setHeroProgress] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      <HeroLoader ready={heroReady} progress={heroProgress} />

      {/* ===== Hero: 木組みの継手が組み上がる ===== */}
      {/* data-hero が ScrollTrigger の pin 対象になる */}
      <section
        data-hero
        className="relative flex h-svh items-center justify-center overflow-hidden bg-[#0a0a0a]"
      >
        <HeroCanvas onReady={() => setHeroReady(true)} onProgress={setHeroProgress} />

        {/* 画面端を落とす。ポストのビネットより CSS の方が圧倒的に安い */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(120% 95% at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* スクロールが進むとテキストは退き、画面を継手に渡す。
            不透明度は scrollChoreography が CSS 変数で配る。
            DOM からは消さないので h1 は検索エンジンから読める。 */}
        <div
          className="relative z-10 px-4 text-center text-white"
          style={{
            opacity: "var(--hero-text-opacity, 1)",
            // 完全に消えたらクリックを吸わないようにする
            pointerEvents: "var(--hero-text-events, auto)" as React.CSSProperties["pointerEvents"],
          }}
        >
          {/* 文字の後ろだけを暗くする。マークは家の内側が抜けているので、
              後ろで組み上がる木材が透けてロゴの一部に見えてしまう */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[45%] -z-10 h-[130%] w-[150%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(6,6,9,0.72), rgba(6,6,9,0.45) 55%, rgba(6,6,9,0) 100%)",
            }}
          />
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              <Badge className="mb-6 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                滋賀・京都エリア対応
              </Badge>
            </motion.div>

            {/* 見出しはロゴそのもの。マーク（logo.jpg）と看板の文字（看板の写真から切り出し）を
                白抜きにしたもの。scripts/build-logos.py で作る。
                筆文字のキャッチコピーは下の作業場の場面（CraftFilm）へ移した */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease }}
              className="mb-8 flex flex-col items-center gap-5 drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)] md:gap-7"
            >
              <Image
                src="/images/logo-mark-white.webp"
                alt=""
                width={640}
                height={653}
                priority
                sizes="(min-width: 1024px) 208px, (min-width: 768px) 176px, 128px"
                className="h-auto w-32 md:w-44 lg:w-52"
              />
              <Image
                src="/images/logo-moji-white.webp"
                alt="株式会社山蔵"
                width={2400}
                height={484}
                priority
                sizes="(min-width: 768px) 640px, 86vw"
                className="h-auto w-[86vw] max-w-[640px]"
              />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease }}
              className="mx-auto mb-12 max-w-3xl font-mincho text-lg font-medium leading-loose tracking-[0.06em] text-white/90 [word-break:auto-phrase] md:text-xl"
            >
              {/* 文ごとに塊にし、文の中は文節で折り返す（「家づく／り」のような泣き別れを防ぐ） */}
              <span className="inline-block">宮大工の伝統技術を現代住宅に活かし、百年後も美しい家づくりをお手伝いします。</span>
              <span className="inline-block">一級建築士の資格を持つ宮大工が、お客様の想いを形にいたします。</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85, ease }}
              className="flex flex-col justify-center gap-6 sm:flex-row"
            >
              <Button size="lg" className="bg-white px-8 py-4 text-lg text-black hover:bg-gray-100" asChild>
                <a href="tel:077-576-3727">
                  <Phone className="mr-3 h-6 w-6" />
                  今すぐお問い合わせ
                </a>
              </Button>
              <Link href="/works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white bg-transparent px-8 py-4 text-lg text-white backdrop-blur-sm hover:bg-white hover:text-gray-900"
                >
                  施工実績を見る
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Framer Motion は opacity をインラインで書くため、CSS 変数を直接
            motion.div に当てると上書きされる。外側の素の div で包んで退場させる。 */}
        <div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white"
          style={{ opacity: "var(--hero-text-opacity, 1)" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm opacity-75">SCROLL</span>
              <div className="h-8 w-px bg-white opacity-50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 作業場: 3D の物語から、いまの職人の手へ ===== */}
      <CraftFilm />

      {/* ===== About ===== */}
      <section id="about" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">私たちについて</h2>
            <p className="mx-auto max-w-3xl font-mincho text-xl [word-break:auto-phrase] text-gray-600">
              宮大工で修業を積みながら一級建築士の資格を取得。現場作業も設計も熟知した職人が、お客様に喜んでもらうことを第一に、心を込めて家づくりをしています。
            </p>
          </FadeIn>

          <div className="grid items-center gap-12 md:grid-cols-2">
            <FadeInLeft>
              <Image
                src="/images/yamaguchi.jpg"
                alt="代表 山口祐介"
                width={500}
                height={400}
                className="rounded-lg shadow-lg transition-shadow duration-300 hover:shadow-xl"
              />
            </FadeInLeft>
            <FadeInRight>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">代表挨拶</h3>
                  <p className="mb-4 leading-relaxed text-gray-700">
                    宮大工で修業を積みながら一級建築士の資格を取得したため、現場作業も設計など工法の知識も豊富です。
                    日本古来の木組み、継手、仕口を特に得意としています。
                  </p>
                  <p className="leading-relaxed text-gray-700">
                    小さい会社であり販管費がかからないため、コストを下げることができ、
                    お客様により良いものをお届けできます。お客様に喜んでもらうのが一番の喜びです。
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-6">
                  <h4 className="mb-3 font-semibold text-gray-900">会社概要</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">社名</span>
                      <span className="font-medium">株式会社山蔵</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">代表</span>
                      <span className="font-medium">山口祐介</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">設立</span>
                      <span className="font-medium">2017年12月01日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">所在地</span>
                      <span className="font-medium">滋賀県大津市下坂本3-14-27</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">選ばれる理由</h2>
            <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600">なぜ多くのお客様に選ばれているのか</p>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-3">
            {[
              {
                Icon: Heart,
                title: "安心・安全",
                body: "建設業許可取得済み。一級建築士による設計・監理で、安心してお任せいただけます。",
              },
              {
                Icon: Wrench,
                title: "確かな技術",
                body: "宮大工修業で培った伝統技術と現代建築の融合。木を知る職人だからこその仕上がり。",
              },
              {
                Icon: Users,
                title: "適正価格",
                body: "小さな会社だからこそ実現できる適正価格。販管費を抑え、お客様に還元します。",
              },
            ].map(({ Icon, title, body }) => (
              <StaggerItem key={title}>
                <Card className="p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <Icon className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-600">{body}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section id="services" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">事業内容</h2>
            <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600">幅広い建築工事に対応いたします</p>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                src: "/images/new-construction.jpg",
                title: "新築住宅",
                body: "一級建築士による設計から施工まで一貫対応。お客様の理想の住まいを実現します。",
                badge: "戸建て・アパート対応",
              },
              {
                src: "/images/renovation.jpg",
                title: "リフォーム・リノベーション",
                body: "簡単なリフォームから大規模リノベーションまで。住まいの価値を高めます。",
                badge: "部分改修から全面改修",
              },
              {
                src: "/images/exterior.jpg",
                title: "外構・エクステリア",
                body: "住まいの外観を美しく演出。機能性とデザイン性を両立します。",
                badge: "庭・駐車場・門扉",
              },
              {
                src: "/images/temple.jpg",
                title: "社寺建築",
                body: "宮大工の技術を活かした伝統建築。文化財の修復・保全も承ります。",
                badge: "伝統工法",
              },
              {
                src: "/images/public-works.jpg",
                title: "公共工事",
                body: "公共施設の建設・改修工事。地域社会への貢献を大切にします。",
                badge: "官公庁案件対応",
              },
              {
                src: "/images/building-management.jpg",
                title: "ビル・建物監理",
                body: "一級建築士による専門的な監理・監修。品質管理を徹底します。",
                badge: "設計監理",
              },
            ].map((s) => (
              <StaggerItem key={s.title}>
                <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="overflow-hidden">
                    <Image
                      src={s.src}
                      alt={s.title}
                      width={400}
                      height={200}
                      className="h-48 w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="mb-3 text-xl font-bold text-gray-900">{s.title}</h3>
                    <p className="mb-4 text-gray-600">{s.body}</p>
                    <Badge variant="secondary">{s.badge}</Badge>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== Works ===== */}
      <section id="works" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">施工実績</h2>
            <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600">これまでの代表的な施工事例をご紹介</p>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <StaggerItem>
              <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  <Image
                    src="/images/sakamoto-office.jpg"
                    alt="坂本７丁目事務所建築"
                    width={400}
                    height={250}
                    className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge className="mb-3 bg-gray-100 text-black">新築工事</Badge>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">坂本７丁目事務所建築</h3>
                  <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>工期</span>
                      <span>2024年11月～2025年2月</span>
                    </div>
                    <div className="flex justify-between">
                      <span>工事内容</span>
                      <span>更地から事務所建築</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    田んぼだった土地に事務所を新築。お客様から「こんな金額でできたんですか！？」と
                    驚きの声をいただきました。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="overflow-hidden">
                  <Image
                    src="/images/myohoin-repair.jpg"
                    alt="妙法院柱修復工事"
                    width={400}
                    height={250}
                    className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <Badge className="mb-3 bg-green-100 text-green-800">文化財修復</Badge>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">妙法院柱修復工事</h3>
                  <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>工事内容</span>
                      <span>柱の穴埋め修復</span>
                    </div>
                    <div className="flex justify-between">
                      <span>技法</span>
                      <span>伝統工法</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    宮大工修業時代からの繋がりで依頼された文化財修復工事。伝統技術を活かした丁寧な施工を行いました。
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          <FadeIn className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-black bg-transparent text-black hover:bg-gray-50"
              asChild
            >
              <Link href="/works">施工実績をもっと見る</Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ===== Instagram ===== */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Instagram</h2>
            <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600">最新の施工現場や作業風景をご紹介</p>
          </FadeIn>

          <FadeIn>
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
                  <Instagram className="h-8 w-8 text-white" />
                </div>

                <h3 className="mb-4 text-2xl font-bold text-gray-900">@yamakura_yusuke</h3>
                <p className="mb-6 text-gray-600">
                  施工現場の様子や伝統技術を活かした作業風景を
                  <br />
                  Instagramで随時更新しています
                </p>

                <div className="mb-8 grid gap-4 md:grid-cols-3">
                  {[
                    { value: "100+", label: "フォロワー数" },
                    { value: "建設現場", label: "リアルタイム更新" },
                    { value: "伝統技術", label: "宮大工の技" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-gray-100 p-4">
                      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                      <div className="text-sm text-gray-600">{s.label}</div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-orange-600"
                  asChild
                >
                  <a
                    href="https://www.instagram.com/yamakura_yusuke"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="mr-2 h-5 w-5" />
                    Instagramで最新情報をチェック
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-3xl font-bold text-white">お気軽にご相談ください</h2>
              <p className="mb-8 font-mincho text-xl [word-break:auto-phrase] text-gray-300">
                新築からリフォーム、特殊工事まで幅広く対応。まずはお気軽にお問い合わせください。無料でお見積もりいたします。
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                  <a href="tel:077-576-3727">
                    <Phone className="mr-2 h-5 w-5" />
                    電話で相談する
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">お問い合わせ</h2>
            <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600">お気軽にお問い合わせください</p>
          </FadeIn>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-12 md:grid-cols-2">
              <FadeInLeft>
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Phone className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">お電話でのお問い合わせ</h3>
                      <p className="mb-1 text-2xl font-bold text-black">077-576-3727</p>
                      <p className="text-gray-600">営業時間：8:00-18:00（不定休）</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <MapPin className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">所在地</h3>
                      <p className="text-gray-700">〒520-0105</p>
                      <p className="text-gray-700">滋賀県大津市下坂本3-14-27</p>
                      <p className="mt-1 text-gray-600">対応エリア：滋賀県・京都府</p>
                    </div>
                  </div>
                </div>
              </FadeInLeft>

              <FadeInRight>
                <div className="flex flex-col items-center justify-center">
                  <Card className="w-full p-8 text-center transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="space-y-6">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <MessageCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">LINE友達追加</h3>
                      <p className="mb-4 text-gray-600">LINEでお気軽にお問い合わせ・ご相談ください</p>

                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://line.me/R/ti/p/@037sqkeo")}`}
                        alt="LINE友達追加QRコード"
                        width={200}
                        height={200}
                        className="mx-auto h-48 w-48 rounded-lg"
                        unoptimized
                      />

                      <p className="text-sm text-gray-500">上記QRコードを読み取って友達追加してください</p>

                      <Button className="w-full bg-green-600 text-white hover:bg-green-700" asChild>
                        <a
                          href="https://line.me/R/ti/p/@037sqkeo"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          LINEで相談する
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </FadeInRight>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
