import { redactSecrets } from "../utils/security.js";

export interface LlmRefineOptions {
  provider: "openai" | "ollama";
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
}

export interface LlmRefineResult {
  content: string;
  provider: string;
  model: string;
}

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OLLAMA_MODEL = "llama3.2";
const MAX_INPUT_CHARS = 24_000;

export function resolveLlmConfig(
  options: Partial<LlmRefineOptions>,
): LlmRefineOptions {
  const provider = options.provider ?? "openai";
  const apiKey =
    options.apiKey ??
    process.env.REPO_CLARITY_OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY;

  if (provider === "openai" && !apiKey) {
    throw new Error(
      "OpenAI API key required. Set REPO_CLARITY_OPENAI_API_KEY or OPENAI_API_KEY (never commit keys).",
    );
  }

  return {
    provider,
    model:
      options.model ??
      (provider === "ollama" ? DEFAULT_OLLAMA_MODEL : DEFAULT_OPENAI_MODEL),
    apiKey,
    baseUrl:
      options.baseUrl ??
      (provider === "ollama"
        ? process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434"
        : "https://api.openai.com/v1"),
    maxTokens: options.maxTokens ?? 2048,
  };
}

export async function refineReadmeWithLlm(
  readmeDraft: string,
  repoContext: string,
  options: Partial<LlmRefineOptions> = {},
): Promise<LlmRefineResult> {
  const config = resolveLlmConfig(options);
  const trimmedDraft = readmeDraft.slice(0, MAX_INPUT_CHARS);
  const trimmedContext = repoContext.slice(0, 8_000);

  const systemPrompt = `You improve open-source README files. Keep factual content from the draft.
Do not invent features, URLs, or install steps. Output Markdown only. No code fences around the whole document.`;

  const userPrompt = `Repository context:\n${trimmedContext}\n\nREADME draft:\n${trimmedDraft}\n\nImprove clarity, structure, and OSS polish.`;

  if (config.provider === "ollama") {
    return refineViaOllama(config, systemPrompt, userPrompt);
  }
  return refineViaOpenAI(config, systemPrompt, userPrompt);
}

async function refineViaOpenAI(
  config: LlmRefineOptions,
  system: string,
  user: string,
): Promise<LlmRefineResult> {
  const url = `${config.baseUrl!.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = redactSecrets(await res.text());
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM returned empty content");

  return { content, provider: "openai", model: config.model! };
}

async function refineViaOllama(
  config: LlmRefineOptions,
  system: string,
  user: string,
): Promise<LlmRefineResult> {
  const url = `${config.baseUrl!.replace(/\/$/, "")}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = redactSecrets(await res.text());
    throw new Error(`Ollama request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim();
  if (!content) throw new Error("Ollama returned empty content");

  return { content, provider: "ollama", model: config.model! };
}
