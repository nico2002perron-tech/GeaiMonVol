import { Metadata } from 'next';
import './globals.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeaiMonVol — Deals voyage depuis Montréal',
  description: 'Trouvez les meilleurs prix sur les vols depuis Montréal. Carte interactive des deals en temps réel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
