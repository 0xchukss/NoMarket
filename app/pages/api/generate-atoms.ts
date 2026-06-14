import type { NextApiRequest, NextApiResponse } from "next";

type AtomCandidate = {
  description: string;
  question: string;
  rationale?: string;
};

type AtomGenerationResponse = {
  atoms: AtomCandidate[];
  model: string;
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
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Claude did not return valid JSON.");
  }
}

function cleanAtom(value: unknown): AtomCandidate | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const description = typeof source.description === "string" ? source.description.trim() : "";
  const question = typeof source.question === "string" ? source.question.trim() : "";
  const rationale = typeof source.rationale === "string" ? source.rationale.trim() : "";

  if (description.length < 8 || question.length < 8) return undefined;
  return {
    description: description.slice(0, 180),
    question: question.slice(0, 520),
    rationale: rationale.slice(0, 240)
  };
}

function extractAtoms(payload: unknown): AtomCandidate[] {
  const atoms = payload && typeof payload === "object" && Array.isArray((payload as { atoms?: unknown[] }).atoms)
    ? (payload as { atoms: unknown[] }).atoms
    : [];

  const seen = new Set<string>();
  return atoms
    .map(cleanAtom)
    .filter((atom): atom is AtomCandidate => Boolean(atom))
    .filter((atom) => {
      const key = atom.description.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AtomGenerationResponse | { error: string }>) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.FREEMODEL_API_KEY;
  const endpoint = (process.env.FREEMODEL_API_BASE_URL || defaultEndpoint).replace(/\/$/, "");
  const model = process.env.FREEMODEL_MODEL || defaultModel;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "General";
  const network = typeof req.body?.network === "string" ? req.body.network.trim() : "NoMarket";

  if (!apiKey) {
    return res.status(500).json({ error: "Missing FREEMODEL_API_KEY." });
  }
  if (title.length < 4) {
    return res.status(400).json({ error: "Add a clearer market title before generating atoms." });
  }

  const systemPrompt = [
    "You generate primitive binary atoms for combinatorial prediction markets.",
    "Each atom must be independently resolvable as true or false from public evidence or a named oracle process.",
    "Avoid vague, subjective, overlapping, or duplicate atoms.",
    "Prefer atoms that combine well with AND, OR, NOT, and IF/THEN expressions.",
    "Return only JSON with this exact shape: {\"atoms\":[{\"description\":\"...\",\"question\":\"...\",\"rationale\":\"...\"}]}."
  ].join(" ");

  const userPrompt = [
    `Market title: ${title}`,
    `Category: ${category}`,
    `Network context: ${network}`,
    "Generate 8 to 12 strong atoms.",
    "The description should be a concise primitive event.",
    "The question should be a UMA Optimistic Oracle assertion question that can resolve the atom.",
    "Keep each question under 360 characters."
  ].join("\n");

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 1800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Atom generation failed with HTTP ${response.status}.`);
    }

    const completion = await response.json();
    const content = asText(completion?.choices?.[0]?.message?.content);
    const atoms = extractAtoms(parseJsonObject(content));

    if (atoms.length < 2) {
      throw new Error("Claude returned fewer than two usable atoms.");
    }

    return res.status(200).json({ atoms, model: completion?.model || model });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "Unable to generate atoms."
    });
  }
}
