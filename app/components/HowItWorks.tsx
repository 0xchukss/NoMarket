import { useRef, useEffect } from "react";
import { CirclePlus, Binary, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Step = {
  Icon: LucideIcon;
  number: string;
  headline: string;
  body: string;
  delay: number;
};

const STEPS: Step[] = [
  {
    Icon: CirclePlus,
    number: "01",
    headline: "Create a market",
    body: "Name your market, add atoms: the independent yes/no questions it will resolve around. Pay a small creation fee to deploy.",
    delay: 0,
  },
  {
    Icon: Binary,
    number: "02",
    headline: "Bet on any combination",
    body: "Build an expression using AND, OR, or IF-THEN logic across your atoms. Your choices are encrypted before they hit chain.",
    delay: 150,
  },
  {
    Icon: Scale,
    number: "03",
    headline: "UMA resolves the outcome",
    body: "Anyone can propose the outcome with evidence. UMA's oracle makes it final. Win if the chain agrees with your expression.",
    delay: 300,
  },
];

function StepCard({ Icon, number, headline, body, delay }: Step) {
  return (
    <div
      className="nm-step-card"
      style={{
        flex: 1,
        maxWidth: "380px",
        backgroundColor: "var(--nm-bg)",
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        transitionDelay: `${delay}ms`,
      }}
    >
      <Icon size={28} style={{ color: "#ffd208", flexShrink: 0, marginBottom: "16px" }} />

      <span
        style={{
          ...telegraf,
          fontSize: "28px",
          color: "#ffd208",
          lineHeight: 1,
          marginBottom: "8px",
        }}
      >
        {number}
      </span>

      <span
        style={{
          ...telegraf,
          fontSize: "18px",
          color: "var(--nm-text-primary)",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}
      >
        {headline}
      </span>

      <span
        style={{
          ...telegraf,
          fontSize: "14px",
          color: "var(--nm-text-body)",
          lineHeight: 1.6,
        }}
      >
        {body}
      </span>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveal = () => {
      el.querySelectorAll<HTMLElement>(".nm-step-card").forEach((card) => {
        card.classList.add("nm-revealed");
      });
    };

    if (reduced) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        reveal();
        observer.unobserve(el);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "80px 0" }}>
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            ...telegraf,
            fontSize: "36px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.6px",
            textAlign: "center",
            margin: "0 0 48px 0",
          }}
        >
          How it works
        </h2>

        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {STEPS.map((s) => (
            <StepCard key={s.number} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
