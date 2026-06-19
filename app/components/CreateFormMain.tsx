import { CalendarClock, Check, Minus, Plus, Sigma, Sparkles } from "lucide-react";
import type { MarketVisual } from "../lib/marketVisuals";
import type { CreatedAtom } from "../lib/marketStorage";
import { MarketVisualBadge } from "./MarketVisualBadge";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export type AtomCandidate = {
  id: string;
  description: string;
  question: string;
  rationale?: string;
  selected: boolean;
};

type LifecycleInput = {
  tradingEndTime: string;
  eventOccurrenceTime: string;
  resolutionBufferMinutes: number;
};

type Props = {
  title: string;
  setTitle: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: string[];
  lifecycleInput: LifecycleInput;
  setLifecycleInput: React.Dispatch<React.SetStateAction<LifecycleInput>>;
  botResolutionText: string;
  imageUrls: string[];
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
  visualPreview: MarketVisual;
  atoms: CreatedAtom[];
  updateAtom: (index: number, field: keyof CreatedAtom, value: string) => void;
  updateAtomUmaQuestion: (index: number, value: string) => void;
  updateAtomUmaLiveness: (index: number, value: number) => void;
  addAtom: () => void;
  removeAtom: (index: number) => void;
  canAddAtom: boolean;
  canRemoveAtom: boolean;
  atomCandidates: AtomCandidate[];
  toggleCandidate: (id: string) => void;
  applySelectedCandidates: () => void;
  selectedCandidateCount: number;
  atomStatus: "idle" | "generating" | "ready";
  generateAtomCandidates: () => void;
  atomMessage: string;
  error: string;
  chainMessage: string;
  status: "idle" | "creating" | "done";
};

// ── shared primitives ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ...telegraf,
        fontSize: "11px",
        color: "var(--nm-text-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        display: "block",
        marginBottom: "6px",
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--nm-divider)",
        margin: "28px 0",
      }}
    />
  );
}

function SectionHead({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        marginBottom: "24px",
      }}
    >
      <div style={{ flexShrink: 0, paddingTop: "2px" }}>{icon}</div>
      <div>
        <p
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-primary)",
            margin: "0 0 4px 0",
          }}
        >
          {title}
        </p>
        <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)", margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function CreateFormMain({
  title,
  setTitle,
  category,
  setCategory,
  categories,
  lifecycleInput,
  setLifecycleInput,
  botResolutionText,
  imageUrls,
  setImageUrls,
  visualPreview,
  atoms,
  updateAtom,
  updateAtomUmaQuestion,
  updateAtomUmaLiveness,
  addAtom,
  removeAtom,
  canAddAtom,
  canRemoveAtom,
  atomCandidates,
  toggleCandidate,
  applySelectedCandidates,
  selectedCandidateCount,
  atomStatus,
  generateAtomCandidates,
  atomMessage,
  error,
  chainMessage,
  status,
}: Props) {
  return (
    <section
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        padding: "32px",
      }}
    >
      {/* ── MARKET DEFINITION ── */}
      <SectionHead
        icon={<Sigma size={18} style={{ color: "#ffd208" }} />}
        title="Market Definition"
        description="Combinatorial markets need clear primitive events before they can become tradable claims."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <Label>Market title</Label>
          <input
            className="nm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Example: 2026 crypto policy package"
          />
        </div>
        <div>
          <Label>Category</Label>
          <select
            className="nm-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 160px",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <Label>Trading end time</Label>
          <input
            type="datetime-local"
            className="nm-input"
            value={lifecycleInput.tradingEndTime}
            onChange={(e) =>
              setLifecycleInput((c) => ({ ...c, tradingEndTime: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Event occurrence time</Label>
          <input
            type="datetime-local"
            className="nm-input"
            value={lifecycleInput.eventOccurrenceTime}
            onChange={(e) =>
              setLifecycleInput((c) => ({ ...c, eventOccurrenceTime: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Buffer (minutes)</Label>
          <input
            type="number"
            min={1}
            step={1}
            className="nm-input"
            value={lifecycleInput.resolutionBufferMinutes}
            onChange={(e) =>
              setLifecycleInput((c) => ({
                ...c,
                resolutionBufferMinutes: Number(e.target.value || 0),
              }))
            }
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          padding: "12px 16px",
          backgroundColor: "var(--nm-bg-tint)",
          border: "1px solid var(--nm-divider)",
          borderRadius: "4px",
        }}
      >
        <CalendarClock size={13} style={{ color: "#ffd208", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)", margin: "0 0 2px 0" }}>
            {botResolutionText}
          </p>
          <p style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)", margin: 0 }}>
            Betting closes at trading end time. UMA bot waits until event time
            plus this buffer before proposing truth.
          </p>
        </div>
      </div>

      <Divider />

      {/* ── MARKET VISUAL ── */}
      <p
        style={{
          ...telegraf,
          fontSize: "16px",
          color: "var(--nm-text-primary)",
          margin: "0 0 16px 0",
        }}
      >
        Market visual
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <MarketVisualBadge visual={visualPreview} size="xl" />
        <div>
          <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-primary)", margin: "0 0 2px 0" }}>
            {visualPreview.source === "custom" ? "Custom images" : "Auto detected"}
          </p>
          <p style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Use one image for a single asset or two images for matchups,
            token pairs, candidates, teams, and flags.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <Label>Primary image URL</Label>
          <input
            className="nm-input"
            value={imageUrls[0]}
            onChange={(e) =>
              setImageUrls((c) => [e.target.value, c[1]])
            }
            placeholder="Team logo, token logo, flag, or person image"
          />
        </div>
        <div>
          <Label>Secondary image URL</Label>
          <input
            className="nm-input"
            value={imageUrls[1]}
            onChange={(e) =>
              setImageUrls((c) => [c[0], e.target.value])
            }
            placeholder="Optional matchup image"
          />
        </div>
      </div>

      <Divider />

      {/* ── ATOMS ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "8px",
        }}
      >
        <div>
          <p style={{ ...telegraf, fontSize: "16px", color: "var(--nm-text-primary)", margin: "0 0 4px 0" }}>
            Atoms
          </p>
          <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)", margin: 0 }}>
            Add 2 to 16 primitive true/false events resolved by UMA oracle.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={generateAtomCandidates}
            disabled={atomStatus === "generating"}
            style={{
              ...telegraf,
              fontSize: "13px",
              color: "var(--nm-text-primary)",
              backgroundColor: "#ffd208",
              border: "none",
              borderRadius: "4px",
              padding: "7px 14px",
              cursor: atomStatus === "generating" ? "not-allowed" : "pointer",
              opacity: atomStatus === "generating" ? 0.6 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Sparkles size={13} />
            {atomStatus === "generating" ? "Generating..." : "Claude atoms"}
          </button>
          <button
            type="button"
            onClick={addAtom}
            disabled={!canAddAtom}
            style={{
              ...telegraf,
              fontSize: "13px",
              color: canAddAtom ? "var(--nm-text-primary)" : "var(--nm-text-muted)",
              backgroundColor: "var(--nm-bg)",
              border: "1px solid var(--nm-border)",
              borderRadius: "4px",
              padding: "7px 14px",
              cursor: canAddAtom ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Plus size={13} />
            Add atom
          </button>
        </div>
      </div>

      {/* Claude candidates */}
      {atomCandidates.length > 0 && (
        <div
          style={{
            border: "1px solid var(--nm-border)",
            borderRadius: "6px",
            padding: "20px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <p
                style={{
                  ...telegraf,
                  fontSize: "11px",
                  color: "var(--nm-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: "0 0 4px 0",
                }}
              >
                Claude Candidates
              </p>
              <p style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)", margin: 0 }}>
                {selectedCandidateCount} selected
              </p>
            </div>
            <button
              type="button"
              onClick={applySelectedCandidates}
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-primary)",
                backgroundColor: "#ffd208",
                border: "none",
                borderRadius: "4px",
                padding: "7px 14px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Check size={13} />
              Use selected
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {atomCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggleCandidate(candidate.id)}
                aria-pressed={candidate.selected}
                style={{
                  ...telegraf,
                  textAlign: "left" as const,
                  padding: "12px 14px",
                  borderRadius: "4px",
                  border: candidate.selected ? "1px solid var(--nm-text-primary)" : "1px solid var(--nm-border)",
                  backgroundColor: candidate.selected ? "var(--nm-text-primary)" : "var(--nm-bg)",
                  cursor: "pointer",
                  transition: "background-color 140ms ease, border-color 140ms ease",
                }}
              >
                <p
                  style={{
                    ...telegraf,
                    fontSize: "13px",
                    color: candidate.selected ? "var(--nm-bg)" : "var(--nm-text-primary)",
                    margin: "0 0 2px 0",
                  }}
                >
                  {candidate.description}
                </p>
                <p
                  style={{
                    ...telegraf,
                    fontSize: "12px",
                    color: candidate.selected ? "rgba(255,255,255,0.6)" : "var(--nm-text-secondary)",
                    margin: 0,
                  }}
                >
                  {candidate.question}
                </p>
                {candidate.rationale && (
                  <p
                    style={{
                      ...telegraf,
                      fontSize: "11px",
                      color: candidate.selected ? "rgba(255,255,255,0.45)" : "var(--nm-text-muted)",
                      margin: "4px 0 0 0",
                      fontStyle: "italic",
                    }}
                  >
                    {candidate.rationale}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atom cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
        {atoms.map((atom, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--nm-border)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                backgroundColor: "var(--nm-bg-tint)",
                borderBottom: "1px solid var(--nm-divider)",
              }}
            >
              <span
                style={{
                  ...telegraf,
                  fontSize: "12px",
                  color: "var(--nm-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Atom {index}
              </span>
              <button
                type="button"
                onClick={() => removeAtom(index)}
                disabled={!canRemoveAtom}
                aria-label={`Remove atom ${index}`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: canRemoveAtom ? "pointer" : "not-allowed",
                  color: canRemoveAtom ? "var(--nm-text-secondary)" : "#d1d5db",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                }}
              >
                <Minus size={14} />
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <Label>Description</Label>
                  <input
                    className="nm-input"
                    value={atom.description}
                    onChange={(e) => updateAtom(index, "description", e.target.value)}
                    placeholder="Primitive event description"
                  />
                </div>
                <div>
                  <Label>Resolver</Label>
                  <input
                    className="nm-input"
                    value={atom.resolver}
                    onChange={(e) => updateAtom(index, "resolver", e.target.value)}
                    placeholder="UMA resolver"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px",
                  gap: "12px",
                }}
              >
                <div>
                  <Label>UMA assertion question</Label>
                  <input
                    className="nm-input"
                    value={atom.uma?.question || ""}
                    onChange={(e) => updateAtomUmaQuestion(index, e.target.value)}
                    placeholder="UMA assertion question"
                  />
                </div>
                <div>
                  <Label>Liveness (seconds)</Label>
                  <input
                    type="number"
                    className="nm-input"
                    value={atom.uma?.livenessSeconds || 7200}
                    onChange={(e) =>
                      updateAtomUmaLiveness(index, Number(e.target.value || 7200))
                    }
                    placeholder="7200"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <p
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "#ef4444",
            margin: "16px 0 0 0",
          }}
        >
          {error}
        </p>
      )}
      {chainMessage && (
        <p
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "#22c55e",
            margin: "16px 0 0 0",
          }}
        >
          {chainMessage}
        </p>
      )}
      {atomMessage && (
        <p
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "#22c55e",
            margin: "8px 0 0 0",
          }}
        >
          {atomMessage}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "creating"}
        style={{
          ...telegraf,
          fontSize: "15px",
          color: "var(--nm-text-on-primary)",
          backgroundColor: status === "creating" ? "var(--nm-text-secondary)" : "var(--nm-text-primary)",
          border: "none",
          borderRadius: "4px",
          padding: "12px 28px",
          cursor: status === "creating" ? "not-allowed" : "pointer",
          marginTop: "24px",
          display: "block",
          width: "100%",
          transition: "background-color 140ms ease",
        }}
      >
        {status === "creating" ? "Saving market..." : "Save market"}
      </button>
    </section>
  );
}
