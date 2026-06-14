import Link from "next/link";
import { Clock3, Plus } from "lucide-react";
import { ChainSelector } from "./ChainSelector";
import { WalletConnect } from "./WalletConnect";

export function Header() {
  return (
    <header className="oracle-nav">
      <div className="oracle-nav-inner">
        <Link href="/" className="oracle-logo">
          NoMarket
        </Link>

        <nav className="oracle-links" aria-label="Primary navigation">
          <Link href="/markets">All Markets</Link>
          <Link href="/create">Create Market</Link>
          <Link href="/history">History</Link>
        </nav>

        <div className="oracle-nav-actions">
          <Link href="/create" className="oracle-create-link">
            <Plus className="h-4 w-4" />
            Create
          </Link>
          <Link href="/history" className="oracle-create-link">
            <Clock3 className="h-4 w-4" />
            History
          </Link>
          <div className="oracle-wallet">
            <WalletConnect />
          </div>
          <ChainSelector />
        </div>
      </div>
    </header>
  );
}
