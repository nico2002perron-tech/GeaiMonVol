'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/layout/Hero';
import HowItWorks from '@/components/layout/HowItWorks';
import Combos from '@/components/deals/Combos';
import MapPreview from '@/components/ui/MapPreview';
import StatsReviews from '@/components/ui/StatsReviews';
import Footer from '@/components/layout/Footer';
import PremiumBanner from '@/components/layout/PremiumBanner';

export default function Home() {
  const [showHow, setShowHow] = useState(false);

  return (
    <main>
      <Navbar onOpenHowItWorks={() => setShowHow(true)} />
      <Hero />
      <Combos />
      <MapPreview />
      <StatsReviews />
      <Footer />

      {showHow && <HowItWorks onClose={() => setShowHow(false)} />}
      <PremiumBanner />
    </main>
  );
}
