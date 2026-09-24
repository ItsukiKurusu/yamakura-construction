/**
 * 施工事例の一次データ。
 *
 * 以前は詳細ページの中に直接書いてあった。そこから id を取り出そうとして
 * **Next がページファイルからの余計な export を許さない**ことにぶつかった
 * （型エラーになる）。データはページではなくここに置くのが本来の形で、
 * サイトマップも詳細ページも同じ 1 か所を見る。
 */

export const worksData = {
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
  "4": {
    id: 4,
    title: "住宅新築工事",
    category: "新築工事",
    categoryColor: "bg-blue-100 text-blue-800",
    mainImage: "/images/shintiku1.jpg",
    images: ["/images/shintiku1.jpg", "/images/shintiku2.jpg", "/images/shintiku3.jpg"],
    period: "",
    location: "",
    client: "",
    structure: "",
    floors: "",
    totalArea: "",
    budget: "",
    description: "お客様のこだわりを活かした木造住宅。宮大工の技術を現代住宅に融合させました。",
    overview: "山蔵組が手がけた住宅新築工事の施工事例です。",
    features: [],
    process: [],
    customerVoice: null,
    specs: {},
  },
}

export type Work = (typeof worksData)[keyof typeof worksData]

/** 事例の id 一覧。サイトマップと generateStaticParams が共有する */
export const workIds = Object.keys(worksData)
