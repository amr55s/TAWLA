/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://tawla.link',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/admin/*',
    '/login',
    '/register',
    '/onboarding',
    '/super-admin',
    '/super-admin/*',
    '/*/[slug]/admin',
    '/*/[slug]/admin/*',
    '/*/[slug]/waiter',
    '/*/[slug]/cashier',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: [
          '/admin',
          '/login',
          '/register',
          '/super-admin',
          '/*/[slug]/admin',
          '/*/[slug]/waiter',
          '/*/[slug]/cashier',
        ],
      },
    ],
  },
};
