import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://yamakura-construction.vercel.app',
      lastModified: new Date(),
    },
    {
      url: 'https://yamakura-construction.vercel.app/about',
      lastModified: new Date(),
    },
    {
      url: 'https://yamakura-construction.vercel.app/services',
      lastModified: new Date(),
    },
    {
      url: 'https://yamakura-construction.vercel.app/works',
      lastModified: new Date(),
    },
    {
      url: 'https://yamakura-construction.vercel.app/contact',
      lastModified: new Date(),
    },
  ]
}