import { Header } from "../components/Header";
import { DocsHero } from "../components/DocsHero";
import { DocsLayout } from "../components/DocsLayout";
import { Footer } from "../components/Footer";

export default function Docs() {
  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <DocsHero />
      <DocsLayout />
      <Footer />
    </div>
  );
}
