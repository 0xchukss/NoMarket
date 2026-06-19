import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "../components/Header";
import { CreatePageHeader } from "../components/CreatePageHeader";
import { MarketsNetworkTabs } from "../components/MarketsNetworkTabs";
import { CreateFormShell } from "../components/CreateFormShell";
import { CreateFormMain, type AtomCandidate } from "../components/CreateFormMain";
import { CreateFormSidebar } from "../components/CreateFormSidebar";
import { filterTabs } from "../lib/mockMarkets";
import { makeCreatedMarket, saveCreatedMarket, type CreatedAtom } from "../lib/marketStorage";
import { defaultUmaResolver } from "../lib/switchboardOracle";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import {
  buildMarketLifecycle,
  formatCreationDepositDisplay,
  formatLifecycleDate,
  getCreationDepositWeiForChain,
  getDefaultLifecycleInput
} from "../lib/marketLifecycle";
import { buildMarketVisual } from "../lib/marketVisuals";

const categories = filterTabs.filter((tab) => tab !== "All");

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
  const creationDepositDisplay = formatCreationDepositDisplay(chain.id);
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

  function updateAtomUmaQuestion(index: number, value: string) {
    setAtoms((currentAtoms) =>
      currentAtoms.map((item, atomIndex) =>
        atomIndex === index
          ? { ...item, uma: { ...(item.uma || defaultUmaResolver(item.description)), question: value } }
          : item
      )
    );
  }

  function updateAtomUmaLiveness(index: number, value: number) {
    setAtoms((currentAtoms) =>
      currentAtoms.map((item, atomIndex) =>
        atomIndex === index
          ? { ...item, uma: { ...(item.uma || defaultUmaResolver(item.description)), livenessSeconds: value } }
          : item
      )
    );
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
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <CreatePageHeader chainShortName={chain.shortName} />
      <MarketsNetworkTabs />

      <CreateFormShell onSubmit={submitMarket}>
        <CreateFormMain
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          categories={categories}
          lifecycleInput={lifecycleInput}
          setLifecycleInput={setLifecycleInput}
          botResolutionText={
            lifecyclePreview
              ? formatLifecycleDate(lifecyclePreview.resolutionTime)
              : "Invalid timing"
          }
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          visualPreview={visualPreview}
          atoms={atoms}
          updateAtom={updateAtom}
          updateAtomUmaQuestion={updateAtomUmaQuestion}
          updateAtomUmaLiveness={updateAtomUmaLiveness}
          addAtom={addAtom}
          removeAtom={removeAtom}
          canAddAtom={canAddAtom}
          canRemoveAtom={canRemoveAtom}
          atomCandidates={atomCandidates}
          toggleCandidate={toggleCandidate}
          applySelectedCandidates={applySelectedCandidates}
          selectedCandidateCount={selectedCandidateCount}
          atomStatus={atomStatus}
          generateAtomCandidates={generateAtomCandidates}
          atomMessage={atomMessage}
          error={error}
          chainMessage={chainMessage}
          status={status}
        />
        <CreateFormSidebar
          outcomeCount={outcomeCount}
          atomCount={atoms.length}
          chain={chain}
          creationDepositWei={creationDepositWei}
          creationDepositDisplay={creationDepositDisplay}
        />
      </CreateFormShell>
    </div>
  );
}
