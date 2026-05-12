export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "siliconflow" | "custom";
}

const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const SILICONFLOW_FREE_MODEL = "Qwen/Qwen3-8B";

interface ChatCompletionPayload {
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

function uniqueProviders(providers: AIProviderConfig[]): AIProviderConfig[] {
  const seen = new Set<string>();
  return providers.filter((provider) => {
    const key = `${provider.provider}:${provider.baseUrl}:${provider.model}:${provider.apiKey.slice(0, 8)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAIProviderConfigs(): AIProviderConfig[] {
  const siliconflowKey = process.env.SILICONFLOW_API_KEY?.trim();
  const legacyKey = process.env.AI_API_KEY?.trim();
  const providers: AIProviderConfig[] = [];

  if (siliconflowKey) {
    providers.push({
      apiKey: siliconflowKey,
      baseUrl: process.env.SILICONFLOW_BASE_URL?.trim() || SILICONFLOW_BASE_URL,
      model: process.env.SILICONFLOW_MODEL?.trim() || SILICONFLOW_FREE_MODEL,
      provider: "siliconflow",
    });
  }

  if (legacyKey && process.env.AI_BASE_URL?.trim()) {
    providers.push({
      apiKey: legacyKey,
      baseUrl: process.env.AI_BASE_URL.trim(),
      model: process.env.AI_MODEL?.trim() || "grok-4",
      provider: "custom",
    });
  }

  // Allow deployments that only have AI_API_KEY configured to still use the
  // SiliconFlow-compatible default instead of falling back to old proxy URLs.
  if (!siliconflowKey && legacyKey) {
    providers.push({
      apiKey: legacyKey,
      baseUrl: process.env.SILICONFLOW_BASE_URL?.trim() || SILICONFLOW_BASE_URL,
      model: process.env.SILICONFLOW_MODEL?.trim() || SILICONFLOW_FREE_MODEL,
      provider: "siliconflow",
    });
  }

  return uniqueProviders(providers);
}

export function assertAIProviderReady(configs: AIProviderConfig[]): void {
  if (configs.length === 0) {
    throw new Error(
      "AI provider is not configured. Set SILICONFLOW_API_KEY or AI_API_KEY in the server environment."
    );
  }
}

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

export async function fetchAIChatCompletion(payload: ChatCompletionPayload): Promise<string> {
  const providers = getAIProviderConfigs();
  assertAIProviderReady(providers);

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const url = `${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          ...payload,
          model: provider.model,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`AI provider ${provider.provider} error ${res.status}: ${text.slice(0, 300)}`);
      }

      if (isHtmlResponse(text)) {
        throw new Error(
          `AI provider ${provider.provider} returned HTML instead of JSON. Check AI_BASE_URL/SILICONFLOW_BASE_URL deployment variables.`
        );
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("AI provider request failed");
      console.error(`[ai-provider] ${provider.provider} request failed:`, lastError.message);
    }
  }

  throw lastError ?? new Error("AI provider request failed");
}
