import { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import './globals.css';
import './legacy.css';

export const metadata: Metadata = {
  title: 'GeaiMonVol — Deals voyage depuis Montréal',
  description: 'Trouvez les meilleurs prix sur les vols depuis Montréal. Carte interactive des deals en temps réel.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GeaiMonVol',
  },
};

export const viewport: Viewport = {
  themeColor: '#2E7DDB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Fredoka:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/logo_geai.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          {children}
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
