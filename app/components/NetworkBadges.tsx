import { CHAIN_ORDER, CHAINS, type ChainId } from "../lib/chains";

const badgeStyles: Record<ChainId, string> = {
  zama: "oracle-badge--zama",
  arc: "oracle-badge--arc"
};

export function NetworkBadges() {
  return (
    <div className="oracle-badges" aria-label="NoMarket networks">
      {CHAIN_ORDER.map((id) => (
        <span key={id} className={`oracle-badge ${badgeStyles[id]}`}>
          {CHAINS[id].shortName.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
