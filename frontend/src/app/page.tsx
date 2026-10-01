import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { About, Features, Footer, HowItWorks, Pricing } from "@/components/landing/Sections";

export default function LandingPage() {
  return (
    <main>
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <About />
      <Footer />
    </main>
  );
}
