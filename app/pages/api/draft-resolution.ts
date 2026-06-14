import type { NextApiRequest, NextApiResponse } from "next";
import { buildUmaResolutionClaim, getOutcomeVector, type AtomResolutionDraft } from "../../lib/resolution";

type DraftResolutionResponse = {
  claim: string;
  evidenceSummary?: string;
  model: string;
};

type DraftAtomInput = {
  description: string;
  question?: string;
  outcome: "true" | "false";
  evidence?: string;
};

const defaultEndpoint = "https://freemodel.dev/v1";
const defaultModel = "claude-sonnet-4.6";

function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  return "";
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]);
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("Claude did not return valid JSON.");
  }
}

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function parseAtoms(value: unknown): DraftAtomInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map<DraftAtomInput | undefined>((item) => {
      const source = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const description = cleanText(source.description, 260);
      const outcome: DraftAtomInput["outcome"] | undefined =
        source.outcome === "true" || source.outcome === true
          ? "true"
          : source.outcome === "false" || source.outcome === false
            ? "false"
            : undefined;
      if (!description || !outcome) return undefined;
      return {
        description,
        question: cleanText(source.question, 520),
        outcome,
        evidence: cleanText(source.evidence, 800)
      };
    })
    .filter((item): item is DraftAtomInput => Boolean(item))
    .slice(0, 16);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DraftResolutionResponse | { error: string }>) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.FREEMODEL_API_KEY;
  const endpoint = (process.env.FREEMODEL_API_BASE_URL || defaultEndpoint).replace(/\/$/, "");
  const model = process.env.FREEMODEL_MODEL || defaultModel;
  const marketTitle = cleanText(req.body?.marketTitle, 240);
  const networkName = cleanText(req.body?.networkName, 80) || "NoMarket";
  const atoms = parseAtoms(req.body?.atoms);

  if (!apiKey) {
    return res.status(500).json({ error: "Missing FREEMODEL_API_KEY." });
  }
  if (marketTitle.length < 4) {
    return res.status(400).json({ error: "Missing market title." });
  }
  if (atoms.length < 2) {
    return res.status(400).json({ error: "Resolve at least two atoms before drafting a claim." });
  }

  const atomOutcomes: AtomResolutionDraft[] = atoms.map((atom) => ({
    outcome: atom.outcome,
    evidence: atom.evidence || ""
  }));
  const outcomeVector = getOutcomeVector(atomOutcomes);
  if (outcomeVector === undefined) {
    return res.status(400).json({ error: "Every atom must be marked TRUE or FALSE before drafting a claim." });
  }

  const fallbackClaim = buildUmaResolutionClaim({
    marketTitle,
    networkName,
    atoms: atoms.map((atom) => ({
      description: atom.description,
      uma: { question: atom.question }
    })),
    atomOutcomes,
    outcomeVector
  });

  const systemPrompt = [
    "You draft UMA Optimistic Oracle claims for atom-level combinatorial market resolution.",
    "Do not change the supplied TRUE/FALSE outcomes or outcome vector.",
    "Use concise, evidence-oriented wording that a UMA voter can verify.",
    "Return only JSON with this exact shape: {\"claim\":\"...\",\"evidenceSummary\":\"...\"}."
  ].join(" ");

  const userPrompt = [
    `Market: ${marketTitle}`,
    `Network: ${networkName}`,
    `Outcome vector: ${outcomeVector}`,
    "Atom outcomes:",
    ...atoms.map((atom, index) =>
      [
        `Atom ${index}: ${atom.outcome.toUpperCase()}`,
        `Description: ${atom.description}`,
        atom.question ? `UMA question: ${atom.question}` : undefined,
        atom.evidence ? `Evidence: ${atom.evidence}` : "Evidence: not supplied"
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "Draft one final UMA claim. Include atom order and the exact vector."
  ].join("\n\n");

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        max_tokens: 1400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Resolution draft failed with HTTP ${response.status}.`);
    }

    const completion = await response.json();
    const parsed = parseJsonObject(asText(completion?.choices?.[0]?.message?.content));
    const claim = cleanText(parsed?.claim, 2400) || fallbackClaim;
    const evidenceSummary = cleanText(parsed?.evidenceSummary, 800);

    return res.status(200).json({
      claim,
      evidenceSummary,
      model: completion?.model || model
    });
  } catch (error) {
    return res.status(200).json({
      claim: fallbackClaim,
      evidenceSummary: error instanceof Error ? `Fallback claim used: ${error.message}` : "Fallback claim used.",
      model
    });
  }
}
