import { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GeaiMonVol — Deals de vols pas cher depuis Montréal',
    template: '%s | GeaiMonVol',
  },
  description: 'Compare les vols depuis Montréal en temps réel. Trouve les meilleurs deals aériens, reçois des alertes de prix et planifie ton voyage avec l\'IA.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GeaiMonVol',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    siteName: 'GeaiMonVol',
    title: 'GeaiMonVol — Deals de vols pas cher depuis Montréal',
    description: 'Compare les vols depuis Montréal en temps réel. Trouve les meilleurs deals aériens avec analyse IA.',
    url: SITE_URL,
    images: [{ url: '/logo_geai.png', width: 512, height: 512, alt: 'GeaiMonVol' }],
  },
  twitter: {
    card: 'summary',
    title: 'GeaiMonVol — Deals de vols depuis Montréal',
    description: 'Les meilleurs prix sur les vols depuis Montréal. Alertes en temps réel + analyse IA.',
    images: ['/logo_geai.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  keywords: ['vol pas cher', 'Montréal', 'deal avion', 'billet avion', 'vol YUL', 'voyage Québec', 'prix vol', 'aubaine vol'],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#2E7DDB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Fredoka:wght@400;600;700;800&display=swap" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Fredoka:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/logo_geai.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'GeaiMonVol',
              url: SITE_URL,
              description: 'Compare les vols depuis Montréal en temps réel. Deals aériens avec analyse IA.',
              applicationCategory: 'TravelApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CAD',
                description: 'Plan gratuit avec deals en temps réel',
              },
              inLanguage: 'fr-CA',
            }),
          }}
        />
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
