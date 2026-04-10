const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

export function getApiKey() {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not set");
  }
  return apiKey;
}

type AuthHeaders = Record<string, string>;

async function fetchWithHeaders(
  path: string,
  headers: AuthHeaders,
): Promise<Response> {
  return fetch(`${FATHOM_BASE_URL}${path}`, {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

export async function fetchFromFathom(path: string) {
  const apiKey = getApiKey();

  // Try api-key auth first (recommended in quickstart), then bearer auth fallback.
  const authStrategies: AuthHeaders[] = [
    { "X-Api-Key": apiKey },
    { Authorization: `Bearer ${apiKey}` },
    { "X-Api-Key": apiKey, Authorization: `Bearer ${apiKey}` },
  ];

  let lastResponse: Response | null = null;
  for (const headers of authStrategies) {
    const response = await fetchWithHeaders(path, headers);
    if (response.ok) {
      return response;
    }

    lastResponse = response;
    if (response.status !== 401 && response.status !== 403) {
      return response;
    }
  }

  if (!lastResponse) {
    throw new Error("No response from Fathom API");
  }
  return lastResponse;
}

export const fathomFetch = fetchFromFathom;
