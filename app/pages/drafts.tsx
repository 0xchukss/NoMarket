import { useAccount } from "wagmi";
import { Header } from "../components/Header";
import { DraftsHeader } from "../components/DraftsHeader";
import { DraftsList } from "../components/DraftsList";
import { DraftsNote } from "../components/DraftsNote";
import { Footer } from "../components/Footer";

export default function Drafts() {
  const { address } = useAccount();

  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <DraftsHeader />
      <DraftsList address={address} />
      <DraftsNote />
      <Footer />
    </div>
  );
}
