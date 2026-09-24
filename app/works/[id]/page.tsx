import type { Metadata } from "next"

import { worksData, workIds } from "@/lib/works"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Phone, ArrowLeft, Users, Wrench, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "@/components/motion-utils"

/**
 * 事例ごとのタイトル・説明・正規 URL。
 *
 * これが無いと**全事例がトップページと同じタイトル**で並び、
 * しかも正規 URL がトップを指すため、個々の事例が検索結果に出てこない。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const work = worksData[id as keyof typeof worksData]
  if (!work) return {}

  return {
    title: `${work.title}｜${work.category}`,
    description: work.description,
    alternates: { canonical: `/works/${id}` },
    openGraph: {
      title: `${work.title} | 株式会社山蔵`,
      description: work.description,
      url: `/works/${id}`,
      images: [{ url: work.mainImage }],
    },
  }
}

/**
 * 事例は固定の 2 件しかないので、あらかじめ書き出しておく。
 * 毎回サーバーで組み立てる理由がない。
 */
export function generateStaticParams() {
  return workIds.map((id) => ({ id }))
}

// Next.js 15 から params は Promise で渡される。await が必要。
export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const work = worksData[id as keyof typeof worksData]

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
                <p className="font-mincho text-xl [word-break:auto-phrase] text-gray-600 leading-relaxed">{work.overview}</p>
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

      {/* Gallery Section */}
      {work.images.filter((img) => !img.includes("placeholder")).length > 1 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">施工写真</h2>
            </FadeIn>
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {work.images
                .filter((img) => !img.includes("placeholder"))
                .map((img, index) => (
                  <StaggerItem key={index}>
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${work.title} ${index + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                    />
                  </StaggerItem>
                ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Features Section */}
      {work.features.length > 0 && (
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
      )}

      {/* Process Section */}
      {work.process.length > 0 && (
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
      )}

      {/* Specifications */}
      {Object.keys(work.specs).length > 0 && (
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
      )}

      {/* Customer Voice */}
      {work.customerVoice && (
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
                    &ldquo;{work.customerVoice.comment}&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>
      )}

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
