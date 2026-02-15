'use client';
import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import HowItWorks from "@/components/layout/HowItWorks";
import Deals from "@/components/deals/Deals";
import Activities from "@/components/deals/Activities";
import Combos from "@/components/deals/Combos";
import StatsReviews from "@/components/ui/StatsReviews";
import Pricing from "@/components/ui/Pricing";
import CTA from "@/components/ui/CTA";
import Footer from "@/components/layout/Footer";
import Icons from "@/components/ui/Icons";
import ParticlesBackground from "@/components/ui/ParticlesBackground";
import GlobalAnimations from "@/components/ui/GlobalAnimations";

// Lazy load the modal
const HowItWorksModal = dynamic(() => import("@/components/ui/HowItWorksModal"), {
  ssr: false,
});

export default function Home() {
  const [showHowModal, setShowHowModal] = useState(false);

  return (
    <>
      <Icons />
      <GlobalAnimations />
      <Navbar onOpenHowItWorks={() => setShowHowModal(true)} />
      <Hero />
      <HowItWorks />
      <Deals />
      <Activities />
      <Combos />
      <StatsReviews />
      <Pricing />
      <CTA />
      <ParticlesBackground />
      <Footer />

      {showHowModal && (
        <HowItWorksModal isOpen={showHowModal} onClose={() => setShowHowModal(false)} />
      )}
    </>
  );
}

