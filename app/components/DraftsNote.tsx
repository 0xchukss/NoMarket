import { Info } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function DraftsNote() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "24px 0 64px",
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
            display: "inline-flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <Info size={12} style={{ color: "var(--nm-text-muted)", flexShrink: 0, marginTop: "2px" }} />
          <span
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-muted)",
              lineHeight: 1.6,
            }}
          >
            Drafts are stored in your browser's local storage. Clearing your
            browser data will delete them. Deploy to save on-chain permanently.
          </span>
        </div>
      </div>
    </section>
  );
}
