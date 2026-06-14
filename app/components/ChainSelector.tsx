import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CHAIN_ORDER, CHAINS } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";

export function ChainSelector() {
  const { chainId, chain, setChainId } = useSelectedChain();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="oracle-chain-selector">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="oracle-chain-button"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`oracle-network-mark oracle-network-mark--${chainId}`} />
        <span>{chain.shortName}</span>
        <ChevronDown className={open ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} />
      </button>

      {open && (
        <div className="oracle-chain-menu" role="menu" aria-label="Select network">
          {CHAIN_ORDER.map((id) => {
            const item = CHAINS[id];
            const active = chainId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setChainId(id);
                  setOpen(false);
                }}
                role="menuitemradio"
                aria-checked={active}
                className={active ? "oracle-chain-menu-item is-active" : "oracle-chain-menu-item"}
              >
                <span className={`oracle-network-mark oracle-network-mark--${id}`} />
                <span>{item.shortName}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
