import { Header } from "../components/Header";
import { HowHero } from "../components/HowHero";
import { StepList } from "../components/StepList";
import { ExpressionExplainer } from "../components/ExpressionExplainer";
import { FaqBlock } from "../components/FaqBlock";
import { HowCtaBanner } from "../components/HowCtaBanner";
import { Footer } from "../components/Footer";

export default function HowItWorks() {
  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <HowHero />
      <StepList />
      <ExpressionExplainer />
      <FaqBlock />
      <HowCtaBanner />
      <Footer />
    </div>
  );
}
