import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/auth', '/profile', '/inbox', '/onboarding'],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
