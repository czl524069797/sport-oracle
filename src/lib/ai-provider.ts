export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "siliconflow" | "custom";
}

const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";
const SILICONFLOW_FREE_MODEL = "Qwen/Qwen3-8B";

export function getAIProviderConfig(): AIProviderConfig {
  const siliconflowKey = process.env.SILICONFLOW_API_KEY?.trim();

  if (siliconflowKey) {
    return {
      apiKey: siliconflowKey,
      baseUrl: process.env.SILICONFLOW_BASE_URL?.trim() || SILICONFLOW_BASE_URL,
      model: process.env.SILICONFLOW_MODEL?.trim() || SILICONFLOW_FREE_MODEL,
      provider: "siliconflow",
    };
  }

  const apiKey = process.env.AI_API_KEY?.trim() ?? "";

  return {
    apiKey,
    baseUrl: process.env.AI_BASE_URL?.trim() || "https://wzw.pp.ua/v1/",
    model: process.env.AI_MODEL?.trim() || "grok-4",
    provider: "custom",
  };
}

export function assertAIProviderReady(config: AIProviderConfig): void {
  if (!config.apiKey) {
    throw new Error(
      "AI provider is not configured. Set SILICONFLOW_API_KEY or AI_API_KEY in the server environment."
    );
  }
}
