import { Flame, ChevronDown } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type LinkDef = {
  label: string;
  href: string;
  active?: boolean;
  flame?: boolean;
  chevron?: boolean;
};

const LINKS: LinkDef[] = [
  { label: "Trending",    href: "/markets?category=trending",    active: true, flame: true },
  { label: "World Cup",   href: "/markets?category=world-cup"   },
  { label: "Breaking",    href: "/markets?category=breaking"    },
  { label: "Politics",    href: "/markets?category=politics"    },
  { label: "Sports",      href: "/markets?category=sports"      },
  { label: "Crypto",      href: "/markets?category=crypto"      },
  { label: "Esports",     href: "/markets?category=esports"     },
  { label: "Finance",     href: "/markets?category=finance"     },
  { label: "Geopolitics", href: "/markets?category=geopolitics" },
  { label: "Tech",        href: "/markets?category=tech"        },
  { label: "Culture",     href: "/markets?category=culture"     },
  { label: "Economy",     href: "/markets?category=economy"     },
  { label: "Weather",     href: "/markets?category=weather"     },
  { label: "Elections",   href: "/markets?category=elections"   },
  { label: "More",        href: "/markets?category=all",        chevron: true },
];

export function CategoryNav() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        borderBottom: "1px solid var(--nm-border)",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <div
          className="nm-catbar-scroll"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            height: "48px",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="nm-catbar-link"
              style={{
                ...telegraf,
                fontSize: "14px",
                letterSpacing: "-0.09px",
                color: link.active ? "var(--nm-text-primary)" : "var(--nm-text-secondary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 160ms ease",
              }}
            >
              {link.flame && (
                <Flame size={13} style={{ color: "#ffd208", flexShrink: 0 }} />
              )}
              {link.label}
              {link.chevron && (
                <ChevronDown size={13} style={{ flexShrink: 0 }} />
              )}
            </a>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "72px",
            background: "linear-gradient(to right, transparent, var(--nm-bg))",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
