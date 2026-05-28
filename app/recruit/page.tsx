"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import Link from "next/link"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"

const scheduleItems = [
  { time: "8:00", label: "現場開始", desc: "作業開始・安全確認" },
  { time: "10:00", label: "午前休憩", desc: "30分休憩" },
  { time: "10:30", label: "作業再開", desc: "現場作業続行" },
  { time: "12:00", label: "昼休憩", desc: "1時間の昼食休憩" },
  { time: "13:00", label: "午後作業", desc: "現場作業続行" },
  { time: "15:00", label: "午後休憩", desc: "30分休憩" },
  { time: "15:30", label: "作業再開", desc: "仕上げ・片付け" },
  { time: "17:30", label: "終了", desc: "現場終了・翌日の準備" },
]

const requirements = [
  { label: "会社名", value: "株式会社山蔵" },
  { label: "募集職種", value: "大工（現場作業）" },
  { label: "雇用形態", value: "正社員" },
  { label: "試用期間", value: "3ヶ月（試用期間中も給与・待遇に変更なし）" },
  { label: "仕事内容", value: "現場での大工作業全般" },
  { label: "勤務地", value: "現場による（滋賀・京都エリア中心）　※車通勤" },
  { label: "勤務時間", value: "8:00〜17:30（実労働時間 7時間30分 / 休憩2時間）" },
  { label: "時間外労働", value: "あり（繁忙期等）" },
  { label: "給与", value: "基本給（経験・能力考慮）" },
  { label: "賞与", value: "あり（年2回）" },
  { label: "昇給", value: "あり（キャリアステップに応じた昇給制度）" },
  { label: "手当", value: "交通費支給" },
  { label: "休日・休暇", value: "日曜・祝日、年末年始休暇、夏季休暇、有給休暇" },
  { label: "加入保険", value: "厚生年金保険・雇用保険・労災保険" },
  { label: "応募資格", value: "経験者歓迎　年齢：20代〜60代前半" },
]

const appealPoints = [
  {
    icon: Hammer,
    title: "宮大工の技術を学べる",
    desc: "日本古来の伝統技術から最新の現代建築まで、幅広い現場で経験を積めます。",
  },
  {
    icon: TrendingUp,
    title: "スキルに応じた昇給",
    desc: "キャリアステップに応じた昇給制度を整備。頑張りがきちんと評価されます。",
  },
  {
    icon: Shield,
    title: "安心の社会保険完備",
    desc: "厚生年金・雇用保険・労災保険に加入。安心して長く働ける環境を整えています。",
  },
  {
    icon: Users,
    title: "チームワークを大切に",
    desc: "少数精鋭の職人集団。風通しのよい環境でお互いを高め合える職場です。",
  },
]

export default function RecruitPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 pt-24 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              ホーム
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">採用情報</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "url('/images/new-construction.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <FadeIn>
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 mb-6 text-sm px-4 py-1">
              正社員募集
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              大工（現場作業）
            </h1>
            <p className="text-xl md:text-2xl text-amber-300 font-medium mb-4">
              宮大工の技術を継承する、次世代の職人を募集します。
            </p>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              経験・スキルを活かして、百年後も残る建物づくりに携わりませんか。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Appeal Points */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">山蔵で働く魅力</h2>
            <p className="text-xl text-gray-600">小さな会社だからこそ実現できる、充実した環境</p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {appealPoints.map((point) => (
              <StaggerItem key={point.title}>
                <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardContent className="space-y-4 pt-2">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                      <point.icon className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{point.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{point.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Job Description */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">仕事内容</h2>
              <p className="text-xl text-gray-600">あなたにお任せする業務について</p>
            </FadeIn>
            <div className="grid md:grid-cols-2 gap-8">
              <FadeInLeft>
                <Card className="h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Hammer className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">現場での大工作業</h3>
                    </div>
                    <ul className="space-y-3">
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
                  </CardContent>
                </Card>
              </FadeInLeft>
              <FadeInRight>
                <Card className="h-full bg-amber-50 border-amber-100">
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">勤務地・通勤について</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">勤務地</p>
                          <p className="text-gray-700 text-sm">各現場（滋賀・京都エリア中心）</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">勤務時間</p>
                          <p className="text-gray-700 text-sm">8:00〜17:30（休憩2時間）</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">休日</p>
                          <p className="text-gray-700 text-sm">日曜・祝日、年末年始、夏季、有給休暇</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">車通勤必須：</span>
                        現場は各地のため、マイカー通勤をお願いしています。交通費は支給いたします。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeInRight>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">1日のスケジュール</h2>
              <p className="text-xl text-gray-600">標準的な1日の流れをご紹介します</p>
            </FadeIn>
            <FadeIn>
              <div className="relative">
                <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />
                <div className="space-y-0">
                  {scheduleItems.map((item, index) => (
                    <div key={item.time} className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{item.time}</span>
                      </div>
                      <div className="relative flex-shrink-0 hidden sm:flex items-center justify-center w-8 mt-1">
                        <div className={`w-3 h-3 rounded-full border-2 z-10 ${
                          index === 0 || index === scheduleItems.length - 1
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white border-gray-400"
                        }`} />
                      </div>
                      <div className="flex-1 pb-6">
                        <Card className="hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900">{item.label}</p>
                              <Badge variant="secondary" className="text-xs">{item.desc}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 mt-4 text-center">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">実労働時間：</span>7時間30分
                  <span className="font-semibold">休憩：</span>合計2時間（午前30分・昼1時間・午後30分）
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Requirements Table */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">募集要項</h2>
              <p className="text-xl text-gray-600">応募前にご確認ください</p>
            </FadeIn>
            <FadeIn>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {requirements.map((req, index) => (
                          <tr
                            key={req.label}
                            className={`border-b border-gray-100 last:border-0 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <th className="text-left px-6 py-4 font-semibold text-gray-700 w-40 align-top whitespace-nowrap bg-amber-50/60">
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

      {/* Ideal Candidate */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">求める人物像</h2>
              <p className="text-xl text-gray-600">こんな方と一緒に働きたい</p>
            </FadeIn>
            <div className="grid md:grid-cols-2 gap-8">
              <FadeInLeft>
                <div className="space-y-4">
                  {[
                    { title: "コミュニケーション力がある方", desc: "現場ではチームワークが不可欠。お客様・仲間との円滑なやり取りができる方を求めています。" },
                    { title: "チームワークを大切にできる方", desc: "少人数の職人チームで力を合わせて仕事を進めます。仲間を思いやれる方を歓迎します。" },
                    { title: "仕事に誠実に向き合える方", desc: "お客様の大切な家づくりに関わる仕事です。誠実さと責任感を持って取り組んでいただける方。" },
                    { title: "経験者歓迎・未経験者相談可", desc: "大工経験がある方はもちろん、ものづくりへの熱意があれば経験が浅い方もご相談ください。" },
                  ].map((item) => (
                    <Card key={item.title} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6 flex items-start space-x-4">
                        <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                          <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </FadeInLeft>
              <FadeInRight>
                <Card className="h-full bg-gray-900 text-white">
                  <CardContent className="p-8 flex flex-col justify-center h-full space-y-6">
                    <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">代表からのメッセージ</h3>
                    <p className="text-gray-300 leading-relaxed">
                      私は宮大工で修業を積みながら一級建築士の資格を取得しました。
                      現場の技術も設計知識も兼ね備えた職人集団として、
                      お客様に喜んでいただくことを最大の目標にしています。
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      一緒に汗をかき、腕を磨いていける仲間を心よりお待ちしています。
                      わからないことは何でも聞ける環境を整えていますので、
                      安心してご応募ください。
                    </p>
                    <p className="font-semibold text-amber-300">代表　山口 祐介</p>
                  </CardContent>
                </Card>
              </FadeInRight>
            </div>
          </div>
        </div>
      </section>

      {/* Application CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">応募・お問い合わせ</h2>
              <p className="text-gray-300 text-lg mb-10">
                まずはお気軽にご連絡ください。面接日程などをご相談いたします。
              </p>
              <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                {/* Phone */}
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto">
                      <Phone className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">お電話で応募</p>
                      <p className="text-2xl font-bold text-white">077-576-3727</p>
                      <p className="text-gray-400 text-sm mt-1">受付時間：8:00〜18:00（不定休）</p>
                    </div>
                    <Button className="bg-white text-black hover:bg-gray-100 w-full" asChild>
                      <a href="tel:077-576-3727">
                        <Phone className="w-4 h-4 mr-2" />
                        今すぐ電話する
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* LINE */}
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">LINEで応募</p>
                      <p className="text-xl font-bold text-white">@037sqkeo</p>
                      <p className="text-gray-400 text-sm mt-1">24時間受付・写真送付も可能</p>
                    </div>
                    <Button className="bg-green-500 hover:bg-green-600 text-white w-full" asChild>
                      <a href="https://line.me/R/ti/p/@037sqkeo" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        LINEで応募する
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <p className="text-gray-500 text-sm mt-8">
                ※ 応募後、担当者よりご連絡いたします。秘密厳守にて対応いたします。
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Back to Top / Other Links */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent" asChild>
                <Link href="/about">会社案内を見る</Link>
              </Button>
              <Button variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent" asChild>
                <Link href="/works">施工実績を見る</Link>
              </Button>
              <Button variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent" asChild>
                <Link href="/contact">お問い合わせ</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
