export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://yamakura-construction.vercel.app/sitemap.xml',
  }
}