import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, ArrowLeft, Users, Wrench, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"

const worksData = {
  "1": {
    id: 1,
    title: "坂本７丁目事務所建築",
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
    location: "滋賀県大津市坂本７丁目",
    client: "株式会社関西ライン様",
    structure: "木造",
    floors: "地上2階建て",
    totalArea: "230平米",
    budget: "約2,500万円",
    description:
      "田んぼだった土地に事務所を新築。株式会社関西ライン様から「こんな金額でできたんですか！？」と驚きの声をいただきました。",
    overview:
      "株式会社関西ライン様の新事務所建築プロジェクト。農地転用から始まった本格的な事務所建築で、限られた予算の中で機能性とデザイン性を両立させた現代的な事務所を実現しました。",
    features: [
      "木造による温かみのある構造",
      "事務所用途に最適化された間取り",
      "駐車場20台分のスペースを確保",
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
        description: "地盤調査を実施し、適切な基礎設計を行い、木造に対応した基礎工事を実施。",
        status: "完了",
      },
      {
        phase: "躯体工事",
        period: "2024年12月",
        description: "木造軸組みの組み立て、屋根・外壁工事を実施。構造の安全性を最優先に施工。",
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
      構造: "木造",
      階数: "地上2階建て",
      延床面積: "230平米",
      敷地面積: "990平米",
      駐車場: "20台",
      用途: "事務所",
      工期: "7ヶ月",
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
      {/* Breadcrumb */}
      <div className="bg-gray-50 pt-24 pb-4">
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
          <Button variant="outline" size="sm" className="mb-6 bg-transparent hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            施工実績一覧に戻る
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <FadeInLeft>
            <Image
              src={work.mainImage || "/placeholder.svg"}
              alt={work.title}
              width={600}
              height={400}
              className="w-full h-96 object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </FadeInLeft>

          <FadeInRight>
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
          </FadeInRight>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">プロジェクトの特徴</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {work.features.map((feature, index) => (
              <StaggerItem key={index}>
                <div className="flex items-start space-x-3 bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">施工プロセス</h2>
          </FadeIn>
          <div className="max-w-4xl mx-auto space-y-8">
            {work.process.map((phase, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <div className="flex items-start space-x-6">
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
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">建物仕様</h2>
          </FadeIn>
          <FadeIn>
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
          </FadeIn>
        </div>
      </section>

      {/* Customer Voice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">お客様の声</h2>
          </FadeIn>
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-8">
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
            </FadeIn>

            <FadeIn>
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardContent className="p-8">
                  <blockquote className="text-xl text-gray-700 leading-relaxed italic text-center">
                    "{work.customerVoice.comment}"
                  </blockquote>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">同じような工事をお考えですか？</h2>
              <p className="text-xl text-gray-300 mb-8">
                新築事務所の建設から住宅まで、お客様のご要望に合わせて最適なプランをご提案いたします。
                まずはお気軽にご相談ください。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                  <a href="tel:077-576-3727">
                    <Phone className="w-5 h-5 mr-2" />
                    電話で相談する
                  </a>
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
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
