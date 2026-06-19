import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Sun, Moon, HelpCircle } from "lucide-react";
import { useTheme } from "../lib/useTheme";

const NAV_LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Docs", href: "/docs" },
  { label: "How It Works", href: "/how-it-works" },
];

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function Header() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const update = () => {
      if (window.scrollY > 80) {
        header.classList.add("nm-navbar-scrolled");
      } else {
        header.classList.remove("nm-navbar-scrolled");
      }
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        update();
        timer = null;
      }, 100);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <header
      ref={headerRef as React.RefObject<HTMLDivElement>}
      className="nm-navbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-primary)",
            textDecoration: "none",
          }}
        >
          NoMarket
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {NAV_LINKS.map((link) => {
            const active = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...telegraf,
                  fontSize: "14px",
                  letterSpacing: "-0.09px",
                  color: active || link.href === "/markets" ? "var(--nm-text-primary)" : "var(--nm-text-secondary)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("nm-open-tour"))}
            aria-label="Open help tour"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--nm-text-secondary)",
            }}
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--nm-text-secondary)",
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "#000000",
              backgroundColor: "#ffd208",
              border: "none",
              borderRadius: "4px",
              padding: "6px 16px",
              cursor: "pointer",
              lineHeight: 1.5,
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </header>
  );
}
