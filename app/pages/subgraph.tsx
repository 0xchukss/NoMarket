import { Header } from "../components/Header";
import { SubgraphHero } from "../components/SubgraphHero";
import { SubgraphEndpoints } from "../components/SubgraphEndpoints";
import { SubgraphSchema } from "../components/SubgraphSchema";
import { SubgraphQueries } from "../components/SubgraphQueries";
import { Footer } from "../components/Footer";

export default function Subgraph() {
  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <SubgraphHero />
      <SubgraphEndpoints />
      <SubgraphSchema />
      <SubgraphQueries />
      <Footer />
    </div>
  );
}
