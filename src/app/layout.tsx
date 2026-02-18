import { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import './globals.css';
import './legacy.css';

export const metadata: Metadata = {
  title: 'GeaiMonVol — Deals voyage depuis Montréal',
  description: 'Trouvez les meilleurs prix sur les vols depuis Montréal. Carte interactive des deals en temps réel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Fredoka:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
