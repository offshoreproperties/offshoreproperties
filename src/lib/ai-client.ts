type ChatMessage = { role: "system" | "user"; content: string };

export type AiProvider = "anthropic" | "openai" | "gemini" | "lovable";

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || trimmed.startsWith("your_")) return undefined;
  return trimmed;
}

export function resolveAiProvider(): { provider: AiProvider; apiKey: string } | null {
  const anthropic = cleanEnv(process.env.ANTHROPIC_API_KEY);
  if (anthropic) return { provider: "anthropic", apiKey: anthropic };

  const openai = cleanEnv(process.env.OPENAI_API_KEY);
  if (openai) return { provider: "openai", apiKey: openai };

  const gemini =
    cleanEnv(process.env.GEMINI_API_KEY) ||
    cleanEnv(process.env.GOOGLE_AI_API_KEY) ||
    cleanEnv(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (gemini) return { provider: "gemini", apiKey: gemini };

  const lovable = cleanEnv(process.env.LOVABLE_API_KEY);
  if (lovable) return { provider: "lovable", apiKey: lovable };

  return null;
}

export function aiConfigError(): string {
  return "AI search is not configured. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or LOVABLE_API_KEY to your .env file, then restart the dev server.";
}

function anthropicModel(): string {
  return cleanEnv(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6";
}

async function chatAnthropic(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const user = messages.find((m) => m.role === "user")?.content ?? "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: anthropicModel(),
      max_tokens: 1200,
      temperature: 0.4,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (res.status === 401) throw new Error("Invalid Anthropic API key.");
  if (res.status === 429) throw new Error("AI is busy — please retry in a moment.");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: { message?: string } })?.error?.message;
    throw new Error(msg ?? `Anthropic error ${res.status}`);
  }

  const json = await res.json();
  const block = (json as { content?: Array<{ type: string; text?: string }> })?.content?.[0];
  return block?.type === "text" ? (block.text ?? "") : "";
}

async function chatOpenAI(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const model = cleanEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });

  if (res.status === 401) throw new Error("Invalid OpenAI API key.");
  if (res.status === 429) throw new Error("AI is busy — please retry in a moment.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  const json = await res.json();
  return (json?.choices?.[0]?.message?.content as string | undefined) ?? "";
}

async function chatGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const model = cleanEnv(process.env.GEMINI_MODEL) || "gemini-2.0-flash";
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const user = messages.find((m) => m.role === "user")?.content ?? "";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4 },
      }),
    },
  );

  if (res.status === 400 || res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message as string | undefined;
    throw new Error(msg?.includes("API key") ? "Invalid Gemini API key." : msg ?? `Gemini error ${res.status}`);
  }
  if (res.status === 429) throw new Error("AI is busy — please retry in a moment.");
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);

  const json = await res.json();
  return (json?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined) ?? "";
}

async function chatLovable(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const model = cleanEnv(process.env.LOVABLE_MODEL) || "google/gemini-2.0-flash-001";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });

  if (res.status === 429) throw new Error("AI is busy — please retry in a moment.");
  if (res.status === 402) throw new Error("AI usage limit reached. Please add credits.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

  const json = await res.json();
  return (json?.choices?.[0]?.message?.content as string | undefined) ?? "";
}

export async function runAiChat(messages: ChatMessage[]): Promise<string> {
  const cfg = resolveAiProvider();
  if (!cfg) throw new Error(aiConfigError());

  switch (cfg.provider) {
    case "anthropic":
      return chatAnthropic(cfg.apiKey, messages);
    case "openai":
      return chatOpenAI(cfg.apiKey, messages);
    case "gemini":
      return chatGemini(cfg.apiKey, messages);
    case "lovable":
      return chatLovable(cfg.apiKey, messages);
  }
}
