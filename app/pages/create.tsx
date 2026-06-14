import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Check, ChevronLeft, Minus, Plus, Sigma, Sparkles } from "lucide-react";
import { Header } from "../components/Header";
import { MarketVisualBadge } from "../components/MarketVisualBadge";
import { NetworkTabs, OracleFormulaVeil } from "../components/OracleVisuals";
import { filterTabs } from "../lib/mockMarkets";
import { makeCreatedMarket, saveCreatedMarket, type CreatedAtom } from "../lib/marketStorage";
import { defaultUmaResolver } from "../lib/switchboardOracle";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import {
  buildMarketLifecycle,
  formatLifecycleDate,
  getCreationDepositWeiForChain,
  getDefaultLifecycleInput
} from "../lib/marketLifecycle";
import { buildMarketVisual } from "../lib/marketVisuals";

const categories = filterTabs.filter((tab) => tab !== "All");

type AtomCandidate = {
  id: string;
  description: string;
  question: string;
  rationale?: string;
  selected: boolean;
};

type AtomGenerationResponse = {
  atoms?: Array<{
    description: string;
    question: string;
    rationale?: string;
  }>;
  error?: string;
};

const emptyAtom = (): CreatedAtom => ({
  description: "",
  resolver: "UMA Optimistic Oracle",
  uma: defaultUmaResolver()
});

function candidateToAtom(candidate: AtomCandidate): CreatedAtom {
  return {
    description: candidate.description,
    resolver: "UMA Optimistic Oracle",
    uma: defaultUmaResolver(candidate.question)
  };
}

export default function CreateMarketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] || "Tech");
  const [atoms, setAtoms] = useState<CreatedAtom[]>([emptyAtom(), emptyAtom()]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "creating" | "done">("idle");
  const [chainMessage, setChainMessage] = useState("");
  const [atomCandidates, setAtomCandidates] = useState<AtomCandidate[]>([]);
  const [atomStatus, setAtomStatus] = useState<"idle" | "generating" | "ready">("idle");
  const [atomMessage, setAtomMessage] = useState("");
  const { chain } = useSelectedChain();
  const [lifecycleInput, setLifecycleInput] = useState({
    tradingEndTime: "",
    eventOccurrenceTime: "",
    resolutionBufferMinutes: 60
  });
  const [imageUrls, setImageUrls] = useState(["", ""]);

  const outcomeCount = useMemo(() => 2 ** atoms.length, [atoms.length]);
  const canAddAtom = atoms.length < 16;
  const canRemoveAtom = atoms.length > 2;
  const selectedCandidateCount = atomCandidates.filter((candidate) => candidate.selected).length;
  const lifecyclePreview = useMemo(() => {
    try {
      return buildMarketLifecycle(
        {
          ...lifecycleInput,
          creationDepositWei: getCreationDepositWeiForChain(chain.id).toString()
        },
        chain.id
      );
    } catch {
      return undefined;
    }
  }, [chain.id, lifecycleInput]);
  const creationDepositWei = getCreationDepositWeiForChain(chain.id);
  const visualPreview = useMemo(
    () =>
      buildMarketVisual({
        title: title || "NoMarket preview",
        category,
        atoms,
        imageUrls
      }),
    [atoms, category, imageUrls, title]
  );

  useEffect(() => {
    setLifecycleInput((current) => (current.tradingEndTime && current.eventOccurrenceTime ? current : getDefaultLifecycleInput()));
  }, []);

  function updateAtom(index: number, field: keyof CreatedAtom, value: string) {
    setAtoms((currentAtoms) =>
      currentAtoms.map((atom, atomIndex) => (atomIndex === index ? { ...atom, [field]: value } : atom))
    );
  }

  function addAtom() {
    if (canAddAtom) {
      setAtoms((currentAtoms) => [...currentAtoms, emptyAtom()]);
    }
  }

  function removeAtom(index: number) {
    if (canRemoveAtom) {
      setAtoms((currentAtoms) => currentAtoms.filter((_, atomIndex) => atomIndex !== index));
    }
  }

  function applySelectedCandidates(candidates = atomCandidates) {
    const selected = candidates.filter((candidate) => candidate.selected).slice(0, 16);
    if (selected.length < 2) {
      setError("Select at least two Claude atoms before using them.");
      return;
    }
    setError("");
    setAtoms(selected.map(candidateToAtom));
    setAtomMessage(`${selected.length} Claude atom${selected.length === 1 ? "" : "s"} loaded for editing.`);
  }

  function toggleCandidate(id: string) {
    setAtomCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
      )
    );
  }

  async function generateAtomCandidates() {
    setError("");
    setChainMessage("");
    setAtomMessage("");
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Add a market title before asking Claude for atoms.");
      return;
    }

    setAtomStatus("generating");
    try {
      const response = await fetch("/api/generate-atoms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          category,
          network: chain.name
        })
      });
      const data = (await response.json()) as AtomGenerationResponse;
      if (!response.ok) {
        throw new Error(data.error || "Unable to generate atoms.");
      }

      const generated = (data.atoms || []).slice(0, 12);
      if (generated.length < 2) {
        throw new Error("Claude returned fewer than two usable atoms.");
      }

      const selectedLimit = Math.min(6, generated.length);
      const nextCandidates = generated.map((candidate, index) => ({
        id: `${Date.now()}-${index}`,
        description: candidate.description,
        question: candidate.question,
        rationale: candidate.rationale,
        selected: index < selectedLimit
      }));
      setAtomCandidates(nextCandidates);
      setAtomStatus("ready");
      applySelectedCandidates(nextCandidates);
      setAtomMessage(`Claude generated ${nextCandidates.length} candidate atoms. Select the set you want, then edit if needed.`);
    } catch (error) {
      setAtomStatus("idle");
      setError(error instanceof Error ? error.message : "Unable to generate atoms.");
    }
  }

  async function submitMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setChainMessage("");
    const cleanTitle = title.trim();
    const cleanAtoms = atoms.map((atom) => ({
      description: atom.description.trim(),
      resolver: atom.resolver.trim() || "UMA Optimistic Oracle",
      uma: atom.uma || defaultUmaResolver(atom.description.trim())
    }));

    if (!cleanTitle) {
      setError("Add a market title before creating it.");
      return;
    }

    if (cleanAtoms.some((atom) => !atom.description)) {
      setError("Every atom needs a description.");
      return;
    }

    let lifecycle;
    try {
      lifecycle = buildMarketLifecycle(
        {
          ...lifecycleInput,
          creationDepositWei: getCreationDepositWeiForChain(chain.id).toString()
        },
        chain.id
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid market timing.");
      return;
    }

    const market = makeCreatedMarket({
      title: cleanTitle,
      category,
      atoms: cleanAtoms,
      lifecycle,
      imageUrls
    });

    setStatus("creating");
    try {
      saveCreatedMarket(market);
      setStatus("done");
      setChainMessage(`Market saved locally for ${chain.name}. Open it to continue with the configured beta path.`);
      router.push("/markets");
    } catch (error) {
      setStatus("idle");
      setError(error instanceof Error ? error.message : "Unable to save market.");
    }
  }

  return (
    <div className="oracle-page">
      <Header />
      <OracleFormulaVeil />
      <main className="oracle-create-page">
        <Link href="/markets" className="oracle-back-link">
          <ChevronLeft className="h-4 w-4" />
          All markets
        </Link>

        <header className="oracle-create-title">
          <p className="oracle-kicker">{chain.shortName} network</p>
          <h1>Create Market</h1>
          <p>Define binary atoms, then combine them into expressive private outcome spaces.</p>
        </header>

        <NetworkTabs />

        <form onSubmit={submitMarket} className="oracle-create-shell">
          <section className="oracle-create-main oracle-panel">
            <div className="oracle-create-section-head">
              <Sigma className="h-5 w-5" />
              <div>
                <h2>Market Definition</h2>
                <p>Combinatorial markets need clear primitive events before they can become tradable claims.</p>
              </div>
            </div>

            <div className="oracle-form-grid">
              <label className="oracle-form-field">
                <span>Market title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: 2026 crypto policy package"
                />
              </label>

              <label className="oracle-form-field">
                <span>Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="oracle-lifecycle-grid">
              <label className="oracle-form-field">
                <span>Trading end time</span>
                <input
                  type="datetime-local"
                  value={lifecycleInput.tradingEndTime}
                  onChange={(event) =>
                    setLifecycleInput((current) => ({ ...current, tradingEndTime: event.target.value }))
                  }
                />
              </label>

              <label className="oracle-form-field">
                <span>Event occurrence time</span>
                <input
                  type="datetime-local"
                  value={lifecycleInput.eventOccurrenceTime}
                  onChange={(event) =>
                    setLifecycleInput((current) => ({ ...current, eventOccurrenceTime: event.target.value }))
                  }
                />
              </label>

              <label className="oracle-form-field">
                <span>Resolution buffer minutes</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={lifecycleInput.resolutionBufferMinutes}
                  onChange={(event) =>
                    setLifecycleInput((current) => ({ ...current, resolutionBufferMinutes: Number(event.target.value || 0) }))
                  }
                />
              </label>
            </div>

            <div className="oracle-lifecycle-note">
              <span>Bot resolution</span>
              <strong>{lifecyclePreview ? formatLifecycleDate(lifecyclePreview.resolutionTime) : "Invalid timing"}</strong>
              <p>Betting closes at the trading end time. The UMA bot waits until the event time plus this buffer before proposing truth.</p>
            </div>

            <div className="oracle-visual-form">
              <div className="oracle-visual-preview">
                <MarketVisualBadge visual={visualPreview} size="xl" />
                <div>
                  <span>Market visual</span>
                  <strong>{visualPreview.source === "custom" ? "Custom images" : "Auto detected"}</strong>
                  <p>Use one image for a single asset or two images for matchups, token pairs, candidates, teams, and flags.</p>
                </div>
              </div>
              <div className="oracle-form-grid">
                <label className="oracle-form-field">
                  <span>Primary image URL</span>
                  <input
                    value={imageUrls[0]}
                    onChange={(event) => setImageUrls((current) => [event.target.value, current[1]])}
                    placeholder="Team logo, token logo, flag, or person image"
                  />
                </label>
                <label className="oracle-form-field">
                  <span>Secondary image URL</span>
                  <input
                    value={imageUrls[1]}
                    onChange={(event) => setImageUrls((current) => [current[0], event.target.value])}
                    placeholder="Optional matchup image"
                  />
                </label>
              </div>
            </div>

            <div className="oracle-atoms-head">
              <div>
                <h2>Atoms</h2>
                <p>Add 2 to 16 primitive true/false events resolved by UMA Optimistic Oracle assertions.</p>
              </div>
              <div className="oracle-atoms-actions">
                <button
                  type="button"
                  onClick={generateAtomCandidates}
                  disabled={atomStatus === "generating"}
                  className="oracle-gold-button compact"
                >
                  <Sparkles className="h-4 w-4" />
                  {atomStatus === "generating" ? "Generating" : "Claude atoms"}
                </button>
                <button type="button" onClick={addAtom} disabled={!canAddAtom} className="oracle-quiet-button compact">
                  <Plus className="h-4 w-4" />
                  Atom
                </button>
              </div>
            </div>

            {atomCandidates.length > 0 && (
              <section className="oracle-ai-atoms">
                <div className="oracle-ai-atoms-head">
                  <div>
                    <p className="oracle-kicker">Claude Candidates</p>
                    <h3>{selectedCandidateCount} selected</h3>
                  </div>
                  <button type="button" onClick={() => applySelectedCandidates()} className="oracle-gold-button compact">
                    <Check className="h-4 w-4" />
                    Use selected
                  </button>
                </div>
                <div className="oracle-ai-atom-grid">
                  {atomCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => toggleCandidate(candidate.id)}
                      aria-pressed={candidate.selected}
                      className={candidate.selected ? "oracle-ai-atom is-selected" : "oracle-ai-atom"}
                    >
                      <span className="oracle-ai-check">{candidate.selected && <Check className="h-3.5 w-3.5" />}</span>
                      <strong>{candidate.description}</strong>
                      <span>{candidate.question}</span>
                      {candidate.rationale && <em>{candidate.rationale}</em>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="oracle-atom-stack">
              {atoms.map((atom, index) => (
                <div key={index} className="oracle-atom-card">
                  <div className="oracle-atom-card-head">
                    <span>Atom {index}</span>
                    <button type="button" onClick={() => removeAtom(index)} disabled={!canRemoveAtom} aria-label={`Remove atom ${index}`}>
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="oracle-atom-grid">
                    <input
                      value={atom.description}
                      onChange={(event) => updateAtom(index, "description", event.target.value)}
                      placeholder="Primitive event description"
                    />
                    <input
                      value={atom.resolver}
                      onChange={(event) => updateAtom(index, "resolver", event.target.value)}
                      placeholder="UMA resolver"
                    />
                  </div>

                  <div className="oracle-atom-grid oracle-atom-grid-wide">
                    <input
                      value={atom.uma?.question || ""}
                      onChange={(event) =>
                        setAtoms((currentAtoms) =>
                          currentAtoms.map((item, atomIndex) =>
                            atomIndex === index
                              ? {
                                  ...item,
                                  uma: {
                                    ...(item.uma || defaultUmaResolver(item.description)),
                                    question: event.target.value
                                  }
                                }
                              : item
                          )
                        )
                      }
                      placeholder="UMA assertion question"
                    />
                    <input
                      value={atom.uma?.livenessSeconds || 7200}
                      onChange={(event) =>
                        setAtoms((currentAtoms) =>
                          currentAtoms.map((item, atomIndex) =>
                            atomIndex === index
                              ? {
                                  ...item,
                                  uma: {
                                    ...(item.uma || defaultUmaResolver(item.description)),
                                    livenessSeconds: Number(event.target.value || 7200)
                                  }
                                }
                              : item
                          )
                        )
                      }
                      placeholder="Liveness seconds"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="oracle-error">{error}</p>}
            {chainMessage && <p className="oracle-success">{chainMessage}</p>}
            {atomMessage && <p className="oracle-success">{atomMessage}</p>}

            <button disabled={status === "creating"} className="oracle-submit-button oracle-create-submit">
              {status === "creating" ? "Saving market..." : "Save market"}
            </button>
          </section>

          <aside className="oracle-create-side">
            <section className="oracle-panel oracle-create-stat">
              <p className="oracle-kicker">Outcome Space</p>
              <strong>{outcomeCount.toLocaleString()}</strong>
              <span>{atoms.length} atoms = 2^{atoms.length} possible outcomes.</span>
              <p>Bets on combinations like AND, OR, NOT, and IF/THEN become possible after this market is confirmed on-chain.</p>
            </section>

            <section className="oracle-panel oracle-create-stat">
              <p className="oracle-kicker">{chain.shortName} Boundary</p>
              <span>{chain.enabled ? "This chain has a configured beta endpoint." : chain.setupMessage}</span>
              <p>{chain.privacyDescription}</p>
              <p>UMA-style assertions resolve the final combinatorial outcome vector.</p>
            </section>

            <section className="oracle-panel oracle-create-stat">
              <p className="oracle-kicker">Creation Deposit</p>
              <strong>{creationDepositWei.toString()}</strong>
              <span>{chain.nativeCurrency} wei</span>
              <p>The deposit is enforced by timed deployments and refunded after clean resolution.</p>
            </section>
          </aside>
        </form>
      </main>
    </div>
  );
}
