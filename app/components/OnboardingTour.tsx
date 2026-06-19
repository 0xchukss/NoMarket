import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trophy,
} from "lucide-react";

const TOUR_KEY = "nm-tour-v1";
const STEP_COUNT = 7;

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

// ── Illustrations ──────────────────────────────────────────────────────────

function IllustrationWelcome() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 24px 8px",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "76px",
          height: "76px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,210,8,0.10)",
          border: "2px solid rgba(255,210,8,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Lock size={32} style={{ color: "#ffd208" }} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {["Encrypted", "Private", "Onchain"].map((tag) => (
          <span
            key={tag}
            style={{
              ...telegraf,
              fontSize: "11px",
              color: "var(--nm-text-muted)",
              border: "1px solid var(--nm-border)",
              borderRadius: "3px",
              padding: "3px 9px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function IllustrationCreate() {
  return (
    <div
      style={{
        padding: "14px",
        backgroundColor: "var(--nm-bg-tint)",
        borderRadius: "8px",
        border: "1px solid var(--nm-border)",
      }}
    >
      {["MARKET TITLE", "ATOM 1", "ATOM 2"].map((label, i) => (
        <div key={i} style={{ marginBottom: i < 2 ? "10px" : "0" }}>
          <div
            style={{
              ...telegraf,
              fontSize: "10px",
              color: "var(--nm-text-muted)",
              letterSpacing: "0.07em",
              marginBottom: "4px",
            }}
          >
            {label}
          </div>
          <div
            style={{
              height: "28px",
              backgroundColor: "var(--nm-bg)",
              border: "1px solid var(--nm-border)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
            }}
          >
            {i === 0 && (
              <div
                style={{
                  width: "55%",
                  height: "7px",
                  backgroundColor: "var(--nm-border)",
                  borderRadius: "4px",
                }}
              />
            )}
          </div>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid var(--nm-divider)",
        }}
      >
        <span
          style={{
            ...telegraf,
            fontSize: "11px",
            color: "var(--nm-text-muted)",
          }}
        >
          + Add atom
        </span>
        <div
          style={{
            ...telegraf,
            fontSize: "12px",
            backgroundColor: "#ffd208",
            color: "#000",
            borderRadius: "4px",
            padding: "6px 14px",
          }}
        >
          Create Market
        </div>
      </div>
    </div>
  );
}

function IllustrationMarkets() {
  const rows = [
    { title: "Trump wins 2028?", prob: 67, vol: "$14k", pos: true },
    { title: "BTC above $200k by Dec?", prob: 42, vol: "$8k", pos: false },
    { title: "World Cup: Brazil wins", prob: 31, vol: "$5k", pos: false },
  ];
  return (
    <div
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 56px 52px 42px",
          padding: "8px 14px",
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-divider)",
        }}
      >
        {["MARKET", "PROB", "VOL", ""].map((h, i) => (
          <span
            key={i}
            style={{
              ...telegraf,
              fontSize: "10px",
              color: "var(--nm-text-muted)",
              letterSpacing: "0.08em",
            }}
          >
            {h}
          </span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 56px 52px 42px",
            padding: "9px 14px",
            borderBottom: i < rows.length - 1 ? "1px solid var(--nm-divider)" : "none",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
            <span
              style={{
                ...telegraf,
                fontSize: "12px",
                color: "var(--nm-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title}
            </span>
            {row.pos && (
              <span
                style={{
                  ...telegraf,
                  fontSize: "9px",
                  color: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: "3px",
                  padding: "1px 5px",
                  flexShrink: 0,
                }}
              >
                BET
              </span>
            )}
          </div>
          <span style={{ ...telegraf, fontSize: "12px", color: row.prob > 50 ? "#22c55e" : "var(--nm-text-body)" }}>
            {row.prob}%
          </span>
          <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
            {row.vol}
          </span>
          <span style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-secondary)" }}>
            Open →
          </span>
        </div>
      ))}
    </div>
  );
}

function IllustrationBet() {
  return (
    <div
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "11px 14px",
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-border)",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)" }}>
          Logic combiner
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          {["AND", "OR", "IF…THEN"].map((op, i) => (
            <span
              key={op}
              style={{
                ...telegraf,
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "4px",
                backgroundColor: i === 0 ? "#ffd208" : "var(--nm-bg)",
                color: i === 0 ? "#000" : "var(--nm-text-secondary)",
                border: i === 0 ? "none" : "1px solid var(--nm-border)",
              }}
            >
              {op}
            </span>
          ))}
        </div>
      </div>
      {["Bitcoin exceeds $200k by Q4", "SEC approves spot ETF"].map((atom, i) => (
        <div
          key={i}
          style={{
            padding: "9px 14px",
            borderBottom: i === 0 ? "1px solid var(--nm-divider)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              ...telegraf,
              fontSize: "11px",
              color: "var(--nm-text-body)",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {atom}
          </span>
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            {["TRUE", "FALSE", "ANY"].map((choice, j) => {
              const active = (i === 0 && j === 0) || (i === 1 && j === 0);
              return (
                <span
                  key={choice}
                  style={{
                    ...telegraf,
                    fontSize: "9px",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    backgroundColor: active ? "#ffd208" : "var(--nm-bg-tint)",
                    color: active ? "#000" : "var(--nm-text-muted)",
                    border: `1px solid ${active ? "#ffd208" : "var(--nm-border)"}`,
                  }}
                >
                  {choice}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <div
        style={{
          padding: "9px 14px",
          backgroundColor: "rgba(255,210,8,0.06)",
          borderTop: "1px solid var(--nm-border)",
        }}
      >
        <span style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-body)" }}>
          Wins if: Bitcoin exceeds $200k AND SEC approves spot ETF
        </span>
      </div>
    </div>
  );
}

function IllustrationPrivacy() {
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: "0" }}>
        <div
          style={{
            flex: 1,
            border: "1px solid var(--nm-border)",
            borderRadius: "6px 0 0 6px",
            padding: "10px 12px",
            backgroundColor: "var(--nm-bg-tint)",
          }}
        >
          <div style={{ ...telegraf, fontSize: "10px", color: "var(--nm-text-muted)", marginBottom: "5px", letterSpacing: "0.06em" }}>
            YOUR BET
          </div>
          <div style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-primary)" }}>
            BTC AND ETF
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 14px",
            backgroundColor: "var(--nm-bg-tint)",
            borderTop: "1px solid var(--nm-border)",
            borderBottom: "1px solid var(--nm-border)",
          }}
        >
          <div style={{ ...telegraf, fontSize: "9px", color: "#ffd208", letterSpacing: "0.08em", marginBottom: "2px" }}>
            FHE
          </div>
          <div style={{ ...telegraf, fontSize: "18px", color: "var(--nm-text-muted)" }}>→</div>
        </div>
        <div
          style={{
            flex: 1,
            border: "1px solid var(--nm-border)",
            borderRadius: "0 6px 6px 0",
            padding: "10px 12px",
            backgroundColor: "var(--nm-bg-tint)",
          }}
        >
          <div style={{ ...telegraf, fontSize: "10px", color: "var(--nm-text-muted)", marginBottom: "5px", letterSpacing: "0.06em" }}>
            CHAIN SEES
          </div>
          <div style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)", letterSpacing: "0.08em" }}>
            0x█████████
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          backgroundColor: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "6px",
        }}
      >
        <Shield size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
        <span style={{ ...telegraf, fontSize: "12px", color: "#22c55e" }}>
          Encrypted before it leaves your browser
        </span>
      </div>
    </div>
  );
}

function IllustrationResolution() {
  const nodes = ["Trading Ends", "Event Occurs", "UMA Confirms"];
  return (
    <div style={{ padding: "20px 20px 8px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "20px" }}>
        {nodes.map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i < nodes.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  right: "-50%",
                  height: "2px",
                  backgroundColor: i < 1 ? "#22c55e" : "var(--nm-border)",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: i < 2 ? "#22c55e" : "var(--nm-bg-tint)",
                border: `2px solid ${i < 2 ? "#22c55e" : "var(--nm-border)"}`,
                margin: "0 auto 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {i < 2 && (
                <div
                  style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#fff" }}
                />
              )}
            </div>
            <div style={{ ...telegraf, fontSize: "10px", color: i < 2 ? "var(--nm-text-body)" : "var(--nm-text-muted)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            ...telegraf,
            fontSize: "12px",
            padding: "7px 18px",
            borderRadius: "4px",
            backgroundColor: "#ffd208",
            color: "#000",
          }}
        >
          Claim Payout
        </div>
      </div>
    </div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: ["#ffd208", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#f97316"][i % 6],
        delay: Math.random() * 1.8,
        duration: 1.8 + Math.random() * 1.6,
        size: 5 + Math.floor(Math.random() * 7),
        round: Math.random() > 0.5,
      })),
    []
  );

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animation: `nm-confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
          }}
        />
      ))}
    </div>
  );
}

// ── Step definitions ───────────────────────────────────────────────────────

type Step = {
  title: string;
  body: string;
  Illustration: (() => JSX.Element) | null;
  targetSelector: string | null;
};

const STEPS: Step[] = [
  {
    title: "Welcome to NoMarket",
    body: "The first prediction market where your bets are encrypted before they touch the chain. Position privacy is the default — not an add-on.",
    Illustration: IllustrationWelcome,
    targetSelector: null,
  },
  {
    title: "Create a Market",
    body: "Markets are built from atoms — simple true/false statements about the world. Combine atoms with AND, OR, or IF-THEN logic to define exactly when a bet wins.",
    Illustration: IllustrationCreate,
    targetSelector: null,
  },
  {
    title: "Browse Live Markets",
    body: "Filter by chain, category, or search by title, outcome, or atom. Probability and volume update in real time. Markets where you have a position show a BET badge.",
    Illustration: IllustrationMarkets,
    targetSelector: "[data-tour-id='markets-table']",
  },
  {
    title: "Build a Bet",
    body: "Pick TRUE, FALSE, or DON'T CARE for each atom. Switch between AND, OR, and IF-THEN combiners. The preview shows exactly what needs to happen for you to win.",
    Illustration: IllustrationBet,
    targetSelector: "[data-tour-id='expression-builder']",
  },
  {
    title: "Your Bets Are Private",
    body: "On FHE networks, your bet expression is encrypted in your browser using Zama's TFHE library before it reaches the contract. The chain only sees ciphertext — never your actual position.",
    Illustration: IllustrationPrivacy,
    targetSelector: null,
  },
  {
    title: "Resolution & Payouts",
    body: "When trading ends, UMA's decentralized oracle confirms the outcome. After the liveness window closes, any disputed resolution settles. Then you claim your payout directly.",
    Illustration: IllustrationResolution,
    targetSelector: null,
  },
  {
    title: "You're ready.",
    body: "Start browsing live markets or create one of your own. Every bet you place is private by default.",
    Illustration: null,
    targetSelector: null,
  },
];

// ── Main component ─────────────────────────────────────────────────────────

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [spotlight, setSpotlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setVisible(true);
    };
    window.addEventListener("nm-open-tour", handler);
    return () => window.removeEventListener("nm-open-tour", handler);
  }, []);

  useEffect(() => {
    const id = "nm-tour-keyframes";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes nm-confetti-fall {
        0%   { transform: translateY(0px) rotate(0deg); opacity: 0; }
        8%   { opacity: 1; }
        80%  { opacity: 1; }
        100% { transform: translateY(560px) rotate(540deg); opacity: 0; }
      }
      @keyframes nm-tour-card-in {
        from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
        to   { opacity: 1; transform: translate(-50%, -50%); }
      }
    `;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setSpotlight(null);
      return;
    }
    const sel = STEPS[step]?.targetSelector;
    if (!sel) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) {
      setSpotlight(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setSpotlight({
      top: r.top - 8,
      left: r.left - 8,
      width: r.width + 16,
      height: r.height + 16,
    });
  }, [step, visible]);

  function navigate(dir: 1 | -1) {
    setFading(true);
    setTimeout(() => {
      setStep((s) => Math.max(0, Math.min(STEP_COUNT - 1, s + dir)));
      setFading(false);
    }, 150);
  }

  function jumpTo(i: number) {
    setFading(true);
    setTimeout(() => {
      setStep(i);
      setFading(false);
    }, 150);
  }

  function close() {
    setVisible(false);
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }

  if (!mounted || !visible) return null;

  const current = STEPS[step];
  const isDone = step === STEP_COUNT - 1;
  const { Illustration } = current;

  const card = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none" }}>
      {/* Backdrop */}
      {spotlight ? (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9000,
              pointerEvents: "all",
            }}
            onClick={close}
          />
          <div
            style={{
              position: "fixed",
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: "6px",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
              border: "2px solid rgba(255,210,8,0.8)",
              zIndex: 9001,
              pointerEvents: "none",
              transition: "top 300ms ease, left 300ms ease, width 300ms ease, height 300ms ease",
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.78)",
            zIndex: 9000,
            pointerEvents: "all",
          }}
          onClick={close}
        />
      )}

      {/* Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(504px, calc(100vw - 32px))",
          backgroundColor: "var(--nm-bg)",
          borderRadius: "12px",
          border: "1px solid var(--nm-border)",
          zIndex: 9002,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          pointerEvents: "all",
          animation: "nm-tour-card-in 300ms ease both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti active={isDone} />

        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
            {step + 1} of {STEP_COUNT}
          </span>
          <button
            onClick={close}
            aria-label="Close tour"
            style={{
              display: "flex",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--nm-text-muted)",
              padding: "4px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Illustration + text */}
        <div
          style={{
            padding: "0 24px",
            opacity: fading ? 0 : 1,
            transition: "opacity 150ms ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          {isDone ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "28px 0 0" }}>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,210,8,0.10)",
                  border: "2px solid rgba(255,210,8,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trophy size={28} style={{ color: "#ffd208" }} />
              </div>
            </div>
          ) : Illustration ? (
            <div style={{ paddingTop: "16px" }}>
              <Illustration />
            </div>
          ) : null}

          <div style={{ paddingTop: "18px", paddingBottom: "4px" }}>
            <h2
              style={{
                ...telegraf,
                fontSize: "20px",
                color: "var(--nm-text-primary)",
                margin: "0 0 10px",
                textAlign: isDone ? "center" : "left",
              }}
            >
              {current.title}
            </h2>
            <p
              style={{
                ...telegraf,
                fontSize: "14px",
                color: "var(--nm-text-body)",
                lineHeight: 1.65,
                margin: 0,
                textAlign: isDone ? "center" : "left",
              }}
            >
              {current.body}
            </p>
          </div>
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            padding: "20px 24px 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Step ${i + 1}`}
              style={{
                width: i === step ? "22px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: i === step ? "#ffd208" : "var(--nm-border)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 200ms ease, background-color 200ms ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px 20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {step > 0 ? (
            <button
              onClick={() => navigate(-1)}
              style={{
                ...telegraf,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
                color: "var(--nm-text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <ChevronLeft size={14} />
              Back
            </button>
          ) : (
            <button
              onClick={close}
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Skip tour
            </button>
          )}

          <button
            onClick={isDone ? close : () => navigate(1)}
            style={{
              ...telegraf,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "14px",
              color: "#000",
              backgroundColor: "#ffd208",
              border: "none",
              borderRadius: "4px",
              padding: "8px 18px",
              cursor: "pointer",
            }}
          >
            {isDone ? "Start betting" : "Next"}
            {!isDone && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(card, document.body);
}
