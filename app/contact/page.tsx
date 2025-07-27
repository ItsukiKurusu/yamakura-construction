"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, MapPin, Clock, Mail, MessageCircle, Send } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // フォーム送信処理（実際の実装では適切な送信処理を行う）
    alert("お問い合わせありがとうございます。後日ご連絡いたします。")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
              <Link href="/works" className="text-gray-700 hover:text-black transition-colors">
                施工実績
              </Link>
              <Link href="/contact" className="text-black font-medium">
                お問い合わせ
              </Link>
            </nav>
            <Button className="bg-black hover:bg-gray-800" asChild>
              <a href="tel:077-576-3727">
                <Phone className="w-4 h-4 mr-2" />
                お問い合わせ
              </a>
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
            <span className="text-black font-medium">お問い合わせ</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            新築・リフォーム・修復工事など、どんなことでもお気軽にご相談ください。 無料でお見積もりいたします。
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせ方法</h2>
            <p className="text-xl text-gray-600">お客様のご都合に合わせてお選びください</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* 電話 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">お電話</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-black">077-576-3727</p>
                  <p className="text-gray-600">営業時間：8:00-18:00（不定休）</p>
                  <p className="text-sm text-gray-500">お急ぎの方はお電話が便利です</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 w-full" asChild>
                  <a href="tel:077-576-3727">
                    <Phone className="w-4 h-4 mr-2" />
                    今すぐ電話する
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* LINE */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">LINE</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">@037sqkeo</p>
                  <p className="text-sm text-gray-500">
                    写真や図面も送れて便利です
                    <br />
                    24時間受付中
                  </p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 w-full" asChild>
                  <a href="https://line.me/R/ti/p/@037sqkeo" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    LINEで相談
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* フォーム */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">お問い合わせフォーム</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">詳細な内容をお送りいただけます</p>
                  <p className="text-sm text-gray-500">
                    24時間受付
                    <br />
                    1営業日以内にご返信
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  onClick={() => {
                    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  フォームで相談
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせフォーム</h2>
              <p className="text-xl text-gray-600">下記フォームにご記入の上、送信してください</p>
            </div>

            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="山田 太郎"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="077-123-4567"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ内容 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">選択してください</option>
                      <option value="新築住宅">新築住宅</option>
                      <option value="リフォーム">リフォーム・リノベーション</option>
                      <option value="社寺建築">社寺建築・文化財修復</option>
                      <option value="外構">外構・エクステリア</option>
                      <option value="公共工事">公共工事</option>
                      <option value="建物監理">建物監理</option>
                      <option value="見積もり">見積もり依頼</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      詳細・ご要望 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="工事内容、ご予算、ご希望時期など、詳しくお聞かせください"
                      rows={6}
                      className="w-full"
                    />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">個人情報の取り扱いについて</h4>
                    <p className="text-sm text-gray-700">
                      お預かりした個人情報は、お問い合わせへの回答およびサービス向上のためのみに使用し、
                      第三者への提供は行いません。
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-black hover:bg-gray-800">
                    <Send className="w-5 h-5 mr-2" />
                    送信する
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">会社情報</h2>
              <p className="text-xl text-gray-600">お気軽にお越しください</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">所在地</h3>
                    <p className="text-gray-700">〒520-0105</p>
                    <p className="text-gray-700">滋賀県大津市下坂本3-14-27</p>
                    <p className="text-gray-600 mt-1">対応エリア：滋賀県・京都府</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">営業時間</h3>
                    <p className="text-gray-700">8:00-18:00</p>
                    <p className="text-gray-600">定休日：不定休</p>
                    <p className="text-sm text-gray-500 mt-1">※緊急時は営業時間外でも対応いたします</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">電話番号</h3>
                    <p className="text-2xl font-bold text-black">077-576-3727</p>
                    <p className="text-sm text-gray-500 mt-1">お気軽にお電話ください</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">アクセス</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">電車でお越しの場合</h4>
                    <p className="text-gray-700 text-sm">
                      JR湖西線「比叡山坂本駅」より徒歩15分
                      <br />
                      京阪石山坂本線「坂本比叡山口駅」より徒歩10分
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">お車でお越しの場合</h4>
                    <p className="text-gray-700 text-sm">
                      名神高速道路「京都東IC」より約20分
                      <br />
                      駐車場完備
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4 bg-transparent" asChild>
                    <a
                      href="https://maps.google.com/?q=滋賀県大津市下坂本3-14-27"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Googleマップで見る
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">まずはお気軽にご相談ください</h2>
            <p className="text-xl text-gray-300 mb-8">
              どんな小さなことでも、お客様のご要望をお聞かせください。 経験豊富な職人が、最適なご提案をいたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100" asChild>
                <a href="tel:077-576-3727">
                  <Phone className="w-5 h-5 mr-2" />
                  今すぐ電話で相談
                </a>
              </Button>
              <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                <a href="https://line.me/R/ti/p/@037sqkeo" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  LINEで相談
                </a>
              </Button>
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
