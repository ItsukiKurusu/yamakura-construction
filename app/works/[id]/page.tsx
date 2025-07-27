import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, ArrowLeft, Users, Wrench, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

// 施工実績データ
const worksData = {
  "1": {
    id: 1,
    title: "阪本7丁目事務所建築",
    category: "新築工事",
    categoryColor: "bg-blue-100 text-blue-800",
    mainImage: "/images/sakamoto-office.jpg",
    images: [
      "/images/sakamoto-office.jpg",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    period: "2024年11月～2025年2月",
    location: "滋賀県大津市阪本7丁目",
    client: "株式会社関西ライン様",
    structure: "鉄骨造",
    floors: "地上2階建て",
    totalArea: "約150㎡",
    budget: "約2,500万円",
    description:
      "田んぼだった土地に事務所を新築。株式会社関西ライン様から「こんな金額でできたんですか！？」と驚きの声をいただきました。",
    overview:
      "株式会社関西ライン様の新事務所建築プロジェクト。農地転用から始まった本格的な事務所建築で、限られた予算の中で機能性とデザイン性を両立させた現代的な事務所を実現しました。",
    features: [
      "鉄骨造による堅牢な構造",
      "事務所用途に最適化された間取り",
      "十分な駐車場スペースを確保",
      "省エネ設計による光熱費削減",
      "将来の拡張にも対応可能な設計",
      "地域の景観に配慮した外観デザイン",
    ],
    process: [
      {
        phase: "企画・設計",
        period: "2024年9月～10月",
        description:
          "株式会社関西ライン様のご要望をヒアリングし、最適な設計プランを提案。農地転用手続きも並行して実施。",
        status: "完了",
      },
      {
        phase: "基礎工事",
        period: "2024年11月",
        description: "地盤調査を実施し、適切な基礎設計を行い、鉄骨造に対応した基礎工事を実施。",
        status: "完了",
      },
      {
        phase: "躯体工事",
        period: "2024年12月",
        description: "鉄骨フレームの組み立て、屋根・外壁工事を実施。構造の安全性を最優先に施工。",
        status: "完了",
      },
      {
        phase: "内装・設備工事",
        period: "2025年1月",
        description: "内装仕上げ、電気・給排水設備工事を実施。事務所として快適に使用できる環境を整備。",
        status: "完了",
      },
      {
        phase: "完成・引き渡し",
        period: "2025年2月",
        description: "最終検査を実施し、株式会社関西ライン様への引き渡しを予定。アフターサービスも充実。",
        status: "完了",
      },
    ],
    customerVoice: {
      comment:
        "こんな金額でできたんですか！？本当に驚きました。最初は予算的に厳しいかと思っていましたが、山蔵さんに相談して本当に良かったです。設計から施工まで、すべてお任せできて安心でした。完成した事務所を見て、本当に満足しています！",
      name: "久保薗 真二様",
      position: "株式会社関西ライン 代表取締役",
      image: "/images/kansai-line-customer.jpg",
    },
    specs: {
      構造: "鉄骨造",
      階数: "地上2階建て",
      延床面積: "約150㎡",
      敷地面積: "約300㎡",
      駐車場: "5台分",
      用途: "事務所",
      工期: "4ヶ月",
      完成予定: "2025年2月",
    },
  },
}

export default function WorkDetailPage({ params }: { params: { id: string } }) {
  const work = worksData[params.id as keyof typeof worksData]

  if (!work) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                <Image
                  src="/images/logo.jpg"
                  alt="株式会社山蔵ロゴ"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">株式会社山蔵</h1>
                <p className="text-sm text-gray-600">宮大工の技でつくる、住まいの芸術</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-black transition-colors">
                ホーム
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-black transition-colors">
                会社案内
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-black transition-colors">
                事業内容
              </Link>
              <Link href="/works" className="text-black font-medium">
                施工実績
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-black transition-colors">
                お問い合わせ
              </Link>
            </nav>
            <Button className="bg-black hover:bg-gray-800">
              <Phone className="w-4 h-4 mr-2" />
              お問い合わせ
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              ホーム
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/works" className="text-gray-600 hover:text-black">
              施工実績
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">{work.title}</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/works">
          <Button variant="outline" size="sm" className="mb-6 bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            施工実績一覧に戻る
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Image
              src={work.mainImage || "/placeholder.svg"}
              alt={work.title}
              width={600}
              height={400}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          <div className="space-y-6">
            <div>
              <Badge className={`${work.categoryColor} mb-4`}>{work.category}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{work.title}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">{work.overview}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">工期:</span>
                  <span>{work.period}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">所在地:</span>
                  <span>{work.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">発注者:</span>
                  <span>{work.client}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Wrench className="w-5 h-5" />
                  <span className="font-medium">構造:</span>
                  <span>{work.structure}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">階数:</span>
                  <span>{work.floors}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">延床面積:</span>
                  <span>{work.totalArea}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">プロジェクト概要</h3>
              <p className="text-gray-700 leading-relaxed">{work.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">プロジェクトの特徴</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {work.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white p-6 rounded-lg shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">施工プロセス</h2>
          <div className="max-w-4xl mx-auto">
            {work.process.map((phase, index) => (
              <div key={index} className="flex items-start space-x-6 mb-8 last:mb-0">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      phase.status === "完了"
                        ? "bg-green-600"
                        : phase.status === "進行中"
                          ? "bg-blue-600"
                          : "bg-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{phase.phase}</h3>
                    <Badge
                      variant={
                        phase.status === "完了" ? "default" : phase.status === "進行中" ? "secondary" : "outline"
                      }
                      className={
                        phase.status === "完了"
                          ? "bg-green-100 text-green-800"
                          : phase.status === "進行中"
                            ? "bg-blue-100 text-blue-800"
                            : ""
                      }
                    >
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{phase.period}</p>
                  <p className="text-gray-700 leading-relaxed">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">建物仕様</h2>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {Object.entries(work.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-600">{key}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Voice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">お客様の声</h2>
          <div className="max-w-4xl mx-auto">
            {/* お客様写真を外に配置 */}
            <div className="text-center mb-8">
              {work.customerVoice.image ? (
                <Image
                  src={work.customerVoice.image || "/placeholder.svg"}
                  alt={work.customerVoice.name}
                  width={400}
                  height={400}
                  className="w-48 h-48 rounded-lg mx-auto object-cover shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-amber-100 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-24 h-24 text-amber-600" />
                </div>
              )}
              <div className="mt-4">
                <p className="font-semibold text-gray-900 text-xl">{work.customerVoice.name}</p>
                <p className="text-gray-600 text-lg">{work.customerVoice.position}</p>
              </div>
            </div>

            {/* コメント部分 */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="p-8">
                <blockquote className="text-xl text-gray-700 leading-relaxed italic text-center">
                  "{work.customerVoice.comment}"
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">同じような工事をお考えですか？</h2>
            <p className="text-xl text-gray-300 mb-8">
              新築事務所の建設から住宅まで、お客様のご要望に合わせて最適なプランをご提案いたします。
              まずはお気軽にご相談ください。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                <Phone className="w-5 h-5 mr-2" />
                電話で相談する
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                >
                  お問い合わせフォーム
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Image
                    src="/images/logo.jpg"
                    alt="株式会社山蔵ロゴ"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">株式会社山蔵</h3>
                  <p className="text-sm text-gray-400">宮大工の技でつくる、住まいの芸術</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                伝統建築の技術を現代住宅に活かし、お客様に喜んでもらえる家づくりを心がけています。
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">事業内容</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>新築住宅設計・施工</li>
                <li>リフォーム・リノベーション</li>
                <li>外構・エクステリア</li>
                <li>社寺建築</li>
                <li>公共工事</li>
                <li>建物監理・監修</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">会社情報</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>滋賀県大津市下坂本3-14-27</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>8:00-18:00（不定休）</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>077-576-3727</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 株式会社山蔵. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
