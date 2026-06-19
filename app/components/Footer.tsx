import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type FooterLink = { label: string; href: string };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Markets",
    links: [
      { label: "Browse",  href: "/markets" },
      { label: "Create",  href: "/create"  },
      { label: "My Bets", href: "/history" },
      { label: "Drafts",  href: "/drafts"  },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs",     href: "/docs"                                   },
      { label: "GitHub",   href: "https://github.com/0xchukss/NoMarket"   },
      { label: "Subgraph", href: "/subgraph"                               },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "Sepolia", href: "https://sepolia.etherscan.io"    },
      { label: "Arc",     href: "https://testnet.arcscan.app"     },
      { label: "Zama",    href: "https://www.zama.ai"             },
    ],
  },
];

export function Footer() {
  const ref = useReveal();
  return (
    <footer
      ref={ref as React.RefObject<HTMLDivElement>}
      className="nm-reveal"
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        borderTop: "1px solid var(--nm-divider)",
        padding: "64px 0 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "64px",
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
              }}
            >
              <span style={{ ...telegraf, fontSize: "16px", color: "var(--nm-text-primary)" }}>
                NoMarket
              </span>
              <LockKeyhole size={14} style={{ color: "#ffd208", flexShrink: 0 }} />
            </div>

            <p
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-body)",
                lineHeight: 1.5,
                maxWidth: "240px",
                margin: 0,
              }}
            >
              A private prediction market. Your bets, your business.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p
                style={{
                  ...telegraf,
                  fontSize: "13px",
                  color: "var(--nm-text-primary)",
                  margin: "0 0 12px 0",
                }}
              >
                {col.heading}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="nm-footer-link"
                    style={{
                      ...telegraf,
                      fontSize: "13px",
                      color: "var(--nm-text-secondary)",
                      textDecoration: "none",
                      transition: "color 160ms ease",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--nm-divider)",
            marginTop: "48px",
            paddingTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
            © 2026 NoMarket · Sepolia testnet
          </span>
          <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
            Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
