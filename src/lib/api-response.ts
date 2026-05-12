import type { ApiResponse } from "@/types";

function summarizeNonJsonResponse(status: number, text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const preview = compact.slice(0, 180);
  return preview
    ? `API returned non-JSON response (status ${status}): ${preview}`
    : `API returned non-JSON response (status ${status})`;
}

export async function readApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      success: false,
      error: summarizeNonJsonResponse(res.status, text),
    };
  }

  try {
    const data = JSON.parse(text) as ApiResponse<T>;
    if (!res.ok && data.success) {
      return {
        success: false,
        error: `API request failed with status ${res.status}`,
      };
    }
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `Invalid JSON response: ${error.message}` : "Invalid JSON response",
    };
  }
}
