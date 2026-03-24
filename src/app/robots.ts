import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/login',
        '/register',
        '/super-admin',
        '/onboarding',
      ],
    },
    sitemap: 'https://tawla.link/sitemap.xml',
  };
}
