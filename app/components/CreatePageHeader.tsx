import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  chainShortName: string;
};

export function CreatePageHeader({ chainShortName }: Props) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        paddingTop: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <Link
          href="/markets"
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "var(--nm-text-secondary)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "24px",
          }}
          className="nm-footer-link"
        >
          <ChevronLeft size={13} />
          All markets
        </Link>

        <p
          style={{
            ...telegraf,
            fontSize: "12px",
            color: "var(--nm-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 6px 0",
          }}
        >
          {chainShortName} network
        </p>

        <h1
          style={{
            ...telegraf,
            fontSize: "36px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.6px",
            lineHeight: 1,
            margin: "0 0 12px 0",
          }}
        >
          Create Market
        </h1>

        <p
          style={{
            ...telegraf,
            fontSize: "15px",
            color: "var(--nm-text-body)",
            margin: 0,
          }}
        >
          Define binary atoms, then combine them into expressive private outcomes.
        </p>
      </div>
    </div>
  );
}
