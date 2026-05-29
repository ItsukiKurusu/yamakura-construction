"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  Hammer,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"

const scheduleItems = [
  { time: "8:00",  label: "現場開始",  desc: "作業開始・安全確認",   accent: true },
  { time: "10:00", label: "午前休憩",  desc: "30分休憩",             accent: false },
  { time: "10:30", label: "作業再開",  desc: "現場作業続行",          accent: false },
  { time: "12:00", label: "昼休憩",   desc: "1時間の昼食休憩",       accent: false },
  { time: "13:00", label: "午後作業",  desc: "現場作業続行",          accent: false },
  { time: "15:00", label: "午後休憩",  desc: "30分休憩",             accent: false },
  { time: "15:30", label: "作業再開",  desc: "仕上げ・片付け",        accent: false },
  { time: "17:30", label: "終了",     desc: "現場終了・翌日の準備",   accent: true },
]

const requirements = [
  { label: "会社名",    value: "株式会社山蔵" },
  { label: "募集職種",  value: "大工（現場作業）" },
  { label: "雇用形態",  value: "正社員" },
  { label: "試用期間",  value: "3ヶ月（試用期間中も給与・待遇に変更なし）" },
  { label: "仕事内容",  value: "現場での大工作業全般" },
  { label: "勤務地",    value: "現場による（滋賀・京都エリア中心）　※車通勤" },
  { label: "勤務時間",  value: "8:00〜17:30（実労働時間 7時間30分 / 休憩2時間）" },
  { label: "時間外労働", value: "あり（繁忙期等）" },
  { label: "給与",      value: "基本給（経験・能力考慮）" },
  { label: "賞与",      value: "あり（年2回）" },
  { label: "昇給",      value: "あり（キャリアステップに応じた昇給制度）" },
  { label: "手当",      value: "交通費支給" },
  { label: "休日・休暇", value: "日曜・祝日、年末年始休暇、夏季休暇、有給休暇" },
  { label: "加入保険",  value: "厚生年金保険・雇用保険・労災保険" },
  { label: "応募資格",  value: "経験者歓迎　年齢：20代〜60代前半" },
]

const appealPoints = [
  {
    icon: Hammer,
    title: "宮大工の技術を学べる",
    desc: "日本古来の伝統技術から最新の現代建築まで、幅広い現場で経験を積めます。",
    img: "/images/temple.jpg",
  },
  {
    icon: TrendingUp,
    title: "スキルに応じた昇給",
    desc: "キャリアステップに応じた昇給制度を整備。頑張りがきちんと評価されます。",
    img: "/images/new-construction.jpg",
  },
  {
    icon: Shield,
    title: "安心の社会保険完備",
    desc: "厚生年金・雇用保険・労災保険に加入。安心して長く働ける環境を整えています。",
    img: "/images/sakamoto-office.jpg",
  },
  {
    icon: Users,
    title: "チームワークを大切に",
    desc: "少数精鋭の職人集団。風通しのよい環境でお互いを高め合える職場です。",
    img: "/images/public-works.jpg",
  },
]

const workPhotos = [
  { src: "/images/new-construction.jpg",   label: "新築工事",    sub: "ゼロから建てる" },
  { src: "/images/temple.jpg",             label: "社寺建築",    sub: "伝統の技術を継承" },
  { src: "/images/renovation.jpg",         label: "リフォーム",   sub: "住まいを蘇らせる" },
]

export default function RecruitPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/ikadachi-hero.jpg"
          alt="山蔵の施工現場"
          fill
          className="object-cover object-center scale-105"
          priority
        />
        <div className="absolute inset-0 bg-black/55" />

        {/* Breadcrumb */}
        <div className="absolute top-0 left-0 right-0 pt-24 pb-4 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-white/60 hover:text-white transition-colors">ホーム</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/90 font-medium">採用情報</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <FadeIn>
            <Badge className="bg-amber-500/90 text-white hover:bg-amber-500 mb-6 text-sm px-5 py-1.5 backdrop-blur-sm">
              正社員募集
            </Badge>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              大工<span className="text-amber-300">（現場作業）</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-4 leading-relaxed">
              宮大工の技術を継承する、次世代の職人を募集します。
            </p>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-10">
              経験・スキルを活かして、百年後も残る建物づくりに携わりませんか。
            </p>
          </FadeIn>
          <FadeIn delay={0.45}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 text-base" asChild>
                <a href="tel:077-576-3727">
                  <Phone className="w-5 h-5 mr-2" />
                  今すぐ応募する
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 bg-transparent px-8 py-4 text-base backdrop-blur-sm"
                onClick={() => document.getElementById("requirements")?.scrollIntoView({ behavior: "smooth" })}
              >
                募集要項を見る
              </Button>
            </div>
          </FadeIn>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white animate-bounce z-10">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-xs opacity-60 tracking-widest">SCROLL</span>
            <ChevronDown className="w-5 h-5 opacity-60" />
          </div>
        </div>
      </section>

      {/* ── 3-Column Photo Strip ──────────────────────────── */}
      <div className="grid grid-cols-3">
        {workPhotos.map((item) => (
          <div key={item.label} className="relative h-40 sm:h-56 md:h-72 overflow-hidden group">
            <Image
              src={item.src}
              alt={item.label}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-end p-3 sm:p-5">
              <div>
                <p className="text-white font-bold text-sm sm:text-lg leading-tight">{item.label}</p>
                <p className="text-white/70 text-xs sm:text-sm">{item.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Appeal Points ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">山蔵で働く魅力</h2>
            <p className="text-xl text-gray-600">小さな会社だからこそ実現できる、充実した環境</p>
          </FadeIn>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {appealPoints.map((point) => (
              <StaggerItem key={point.title}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full group">
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={point.img}
                      alt={point.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                        <point.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-gray-900">{point.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{point.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Full-Width Quote Divider ───────────────────────── */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="/images/myohoin-repair.jpg"
          alt="妙法院修復工事"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <FadeIn>
            <p className="text-white/50 text-sm tracking-widest mb-3 uppercase">Our Mission</p>
            <blockquote className="text-white text-2xl md:text-4xl font-bold max-w-3xl leading-snug">
              「百年後も美しい家を、<br className="sm:hidden" />この手で。」
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* ── Job Description ───────────────────────────────── */}
      <section className="py-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Photo side */}
          <FadeInLeft>
            <div className="relative h-72 md:h-full min-h-[420px]">
              <Image
                src="/images/sakamoto-office.jpg"
                alt="現場での大工作業"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 hidden md:block" />
            </div>
          </FadeInLeft>

          {/* Content side */}
          <FadeInRight>
            <div className="bg-gray-50 p-10 md:p-14 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">仕事内容</h2>
              <div className="w-12 h-1 bg-amber-500 rounded mb-8" />
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hammer className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">現場での大工作業全般</h3>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "新築住宅・リフォームの木工事",
                  "社寺建築など伝統的な木組み作業",
                  "公共施設・商業施設の建築工事",
                  "外構・内装の大工作業",
                  "図面に基づく材料の加工・組み立て",
                  "現場の安全管理・整理整頓",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 rounded-xl p-5 space-y-3 border border-amber-100">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">勤務地：</span>
                    <span className="text-gray-700 text-sm">各現場（滋賀・京都エリア中心）</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">勤務時間：</span>
                    <span className="text-gray-700 text-sm">8:00〜17:30（休憩2時間）</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">休日：</span>
                    <span className="text-gray-700 text-sm">日曜・祝日、年末年始、夏季、有給休暇</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeInRight>
        </div>
      </section>

      {/* ── Daily Schedule ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">1日のスケジュール</h2>
            <p className="text-xl text-gray-600">標準的な1日の流れをご紹介します</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Timeline */}
            <FadeInLeft>
              <div className="relative">
                <div className="absolute left-[72px] top-2 bottom-8 w-px bg-gradient-to-b from-amber-400 via-gray-300 to-amber-400 hidden sm:block" />
                <div className="space-y-0">
                  {scheduleItems.map((item) => (
                    <div key={item.time} className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-16 text-right pt-3">
                        <span className={`text-sm font-bold tabular-nums ${item.accent ? "text-amber-600" : "text-gray-600"}`}>
                          {item.time}
                        </span>
                      </div>
                      <div className="relative flex-shrink-0 hidden sm:flex items-start justify-center w-8 pt-4">
                        <div className={`w-3 h-3 rounded-full border-2 z-10 ${
                          item.accent
                            ? "bg-amber-500 border-amber-500 shadow-md shadow-amber-200"
                            : "bg-white border-gray-300"
                        }`} />
                      </div>
                      <div className="flex-1 pb-5">
                        <div className={`rounded-xl p-4 transition-shadow duration-200 hover:shadow-md ${
                          item.accent
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-gray-50 border border-gray-100"
                        }`}>
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm ${item.accent ? "text-amber-700" : "text-gray-900"}`}>
                              {item.label}
                            </p>
                            <span className="text-xs text-gray-500">{item.desc}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100 mt-1">
                <p className="text-sm text-gray-700">
                  実労働時間 <span className="font-bold text-gray-900">7時間30分</span>　／
                  休憩 <span className="font-bold text-gray-900">合計2時間</span>
                </p>
              </div>
            </FadeInLeft>

            {/* Side Photos */}
            <FadeInRight>
              <div className="space-y-4 sticky top-24">
                <div className="relative h-52 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/public-works.jpg"
                    alt="公共工事現場"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm">現場作業の様子</p>
                  </div>
                </div>
                <div className="relative h-52 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/cultural-hall.jpg"
                    alt="文化ホール工事"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm">大規模施設の施工</p>
                  </div>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* ── Requirements Table ────────────────────────────── */}
      <section id="requirements" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">募集要項</h2>
              <p className="text-xl text-gray-600">応募前にご確認ください</p>
            </FadeIn>
            <FadeIn>
              <Card className="overflow-hidden shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {requirements.map((req) => (
                          <tr key={req.label} className="border-b border-gray-100 last:border-0 group hover:bg-amber-50/30 transition-colors duration-150">
                            <th className="text-left px-6 py-4 font-semibold text-gray-700 w-36 sm:w-44 align-top whitespace-nowrap bg-amber-50/70 group-hover:bg-amber-100/50 transition-colors duration-150">
                              {req.label}
                            </th>
                            <td className="px-6 py-4 text-gray-800 leading-relaxed">{req.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-gray-500 mt-3 text-center">
                ※ 詳細はお問い合わせいただくか、面接時にご確認ください。
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Second Photo Divider ─────────────────────────── */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        <Image
          src="/images/exterior.jpg"
          alt="建築外観"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <FadeIn>
            <p className="text-white/60 text-sm tracking-widest mb-3 uppercase">Join Us</p>
            <p className="text-white text-xl md:text-3xl font-bold max-w-2xl">
              あなたの「技」を、私たちに貸してください。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Ideal Candidate + Message ─────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">求める人物像</h2>
              <p className="text-xl text-gray-600">こんな方と一緒に働きたい</p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Checklist */}
              <FadeInLeft>
                <div className="space-y-4">
                  {[
                    { title: "コミュニケーション力がある方", desc: "現場ではチームワークが不可欠。お客様・仲間との円滑なやり取りができる方を求めています。" },
                    { title: "チームワークを大切にできる方", desc: "少人数の職人チームで力を合わせて仕事を進めます。仲間を思いやれる方を歓迎します。" },
                    { title: "仕事に誠実に向き合える方", desc: "お客様の大切な家づくりに関わる仕事です。誠実さと責任感を持って取り組んでいただける方。" },
                    { title: "経験者歓迎・未経験者相談可", desc: "大工経験がある方はもちろん、ものづくりへの熱意があれば経験が浅い方もご相談ください。" },
                  ].map((item) => (
                    <Card key={item.title} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <CardContent className="p-5 flex items-start space-x-4">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 mb-1 text-sm">{item.title}</p>
                          <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </FadeInLeft>

              {/* Representative message with photo */}
              <FadeInRight>
                <Card className="overflow-hidden shadow-xl h-full">
                  {/* 写真エリア：高さを十分に確保して顔が隠れないように */}
                  <div className="relative h-96 sm:h-[420px]">
                    <Image
                      src="/images/yamaguchi.jpg"
                      alt="代表 山口祐介"
                      fill
                      className="object-cover object-top"
                    />
                    {/* 透かしオーバーレイ */}
                    <div className="absolute inset-0 bg-black/20" />
                    {/* 下部のみグラデーションで暗くする */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/70" />
                  </div>
                  {/* テキストエリア：写真の下に独立配置 */}
                  <CardContent className="p-7 bg-gray-900 text-white space-y-4">
                    <p className="text-amber-300 text-xs tracking-widest uppercase">Message from CEO</p>
                    <h3 className="text-xl font-bold">代表からのメッセージ</h3>
                    <p className="text-white/85 text-sm leading-relaxed">
                      宮大工で修業を積み、一級建築士の資格も取得しました。
                      現場の技術も設計知識も兼ね備えた職人集団として、
                      お客様に喜んでいただくことを最大の目標にしています。
                    </p>
                    <p className="text-white/85 text-sm leading-relaxed">
                      一緒に汗をかき、腕を磨いていける仲間を心よりお待ちしています。
                      わからないことは何でも聞ける環境を整えていますので、安心してご応募ください。
                    </p>
                    <div className="flex items-center space-x-3 pt-1">
                      <div className="w-px h-8 bg-amber-400" />
                      <p className="font-semibold text-amber-300">代表　山口 祐介</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInRight>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <Image
          src="/images/building-management.jpg"
          alt="施工現場"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/75" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <FadeIn>
            <p className="text-amber-400 text-sm tracking-widest uppercase mb-4">Apply Now</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">応募・お問い合わせ</h2>
            <p className="text-gray-300 text-lg mb-12 max-w-xl mx-auto">
              まずはお気軽にご連絡ください。面接日程などをご相談いたします。
            </p>

            <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
              {/* Phone */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors duration-200">
                <CardContent className="p-7 text-center space-y-4">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Phone className="w-7 h-7 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">お電話で応募</p>
                    <p className="text-2xl font-bold text-white tracking-wide">077-576-3727</p>
                    <p className="text-gray-400 text-xs mt-1">受付 8:00〜18:00（不定休）</p>
                  </div>
                  <Button className="bg-white text-black hover:bg-gray-100 w-full font-semibold" asChild>
                    <a href="tel:077-576-3727">
                      <Phone className="w-4 h-4 mr-2" />
                      今すぐ電話する
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* LINE */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors duration-200">
                <CardContent className="p-7 text-center space-y-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">LINEで応募</p>
                    <p className="text-2xl font-bold text-white">@037sqkeo</p>
                    <p className="text-gray-400 text-xs mt-1">24時間受付・写真送付も可能</p>
                  </div>
                  <Button className="bg-green-500 hover:bg-green-600 text-white w-full font-semibold" asChild>
                    <a href="https://line.me/R/ti/p/@037sqkeo" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      LINEで応募する
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-gray-500 text-xs mt-8">
              ※ 応募後、担当者よりご連絡いたします。秘密厳守にて対応いたします。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer Links ─────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:border-black hover:text-black bg-transparent" asChild>
                <Link href="/about">会社案内</Link>
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:border-black hover:text-black bg-transparent" asChild>
                <Link href="/works">施工実績</Link>
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:border-black hover:text-black bg-transparent" asChild>
                <Link href="/contact">お問い合わせ</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  )
}
