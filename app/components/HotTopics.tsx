import { ChevronUp, ChevronDown, ArrowRight } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Topic = {
  rank: number;
  code: string;
  volume: string;
  up: boolean;
};

const TOPICS: Topic[] = [
  { rank: 1, code: "IRAN",      volume: "$2.8M vol", up: true  },
  { rank: 2, code: "WORLD CUP", volume: "$1.6M vol", up: true  },
  { rank: 3, code: "BTC",       volume: "$1.2M vol", up: false },
  { rank: 4, code: "FOMC",      volume: "$890K vol",  up: true  },
  { rank: 5, code: "CLAUDE",    volume: "$620K vol",  up: true  },
];

export function HotTopics() {
  const ref = useReveal(".nm-card");
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "40px 0" }}>
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
            fontSize: "18px",
            color: "var(--nm-text-primary)",
            margin: "0 0 16px 0",
          }}
        >
          Hot topics
        </h2>

        <div>
          {TOPICS.map((topic, i) => {
            const isLast = i === TOPICS.length - 1;
            const TrendIcon = topic.up ? ChevronUp : ChevronDown;

            return (
              <div
                key={topic.rank}
                className="nm-reveal nm-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 0",
                  borderBottom: isLast ? "none" : "1px solid var(--nm-divider)",
                }}
              >
                <span
                  style={{
                    ...telegraf,
                    fontSize: "18px",
                    color: "var(--nm-text-secondary)",
                    width: "24px",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {topic.rank}
                </span>

                <span
                  style={{
                    ...telegraf,
                    fontSize: "15px",
                    color: "var(--nm-text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  {topic.code}
                </span>

                <span
                  style={{
                    ...telegraf,
                    fontSize: "13px",
                    color: "var(--nm-text-secondary)",
                  }}
                >
                  {topic.volume}
                </span>

                <TrendIcon
                  size={12}
                  style={{
                    color: topic.up ? "#30a159" : "#e23939",
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    ...telegraf,
                    fontSize: "12px",
                    color: "var(--nm-text-secondary)",
                    marginLeft: "auto",
                  }}
                >
                  today
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <a
            href="/markets"
            className="nm-explore-link"
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 160ms ease",
            }}
          >
            Explore all
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
