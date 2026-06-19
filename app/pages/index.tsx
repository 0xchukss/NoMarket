import { useEffect } from "react";
import { Header } from "../components/Header";
import { CategoryNav } from "../components/CategoryNav";
import { HeroSection } from "../components/HeroSection";
import { StatsBar } from "../components/StatsBar";
import { HowItWorks } from "../components/HowItWorks";
import { FeaturesSection } from "../components/FeaturesSection";
import { LiveMarkets } from "../components/LiveMarkets";
import { ExpressionBuilderPreview } from "../components/ExpressionBuilderPreview";
import { PoweredBy } from "../components/PoweredBy";
import { CtaBanner } from "../components/CtaBanner";
import { FeaturedMarkets } from "../components/FeaturedMarkets";
import { PromoBanner } from "../components/PromoBanner";
import { HotTopics } from "../components/HotTopics";
import { Footer } from "../components/Footer";

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = document.querySelectorAll<HTMLElement>("section.nm-section-reveal");

    if (reduced) {
      sections.forEach((el) => el.classList.add("nm-section-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target as HTMLElement;
          section.classList.add("nm-section-revealed");
          section.querySelectorAll<HTMLElement>(".nm-card").forEach((card, i) => {
            card.style.transitionDelay = `${i * 120}ms`;
          });
          observer.unobserve(section);
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <CategoryNav />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <FeaturesSection />
      <FeaturedMarkets />
      <PromoBanner />
      <HotTopics />
      <LiveMarkets />
      <ExpressionBuilderPreview />
      <PoweredBy />
      <CtaBanner />
      <Footer />
    </div>
  );
}
