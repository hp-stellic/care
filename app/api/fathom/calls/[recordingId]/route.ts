import { NextResponse } from "next/server";

const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

function getApiKey() {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not set");
  }
  return apiKey;
}

type TranscriptResponse = {
  transcript?: string | Array<{ text?: string }>;
  data?: {
    transcript?: string | Array<{ text?: string }>;
    utterances?: Array<{ text?: string }>;
  };
  utterances?: Array<{ text?: string }>;
  segments?: Array<{ text?: string }>;
};

function extractTranscript(payload: TranscriptResponse) {
  if (typeof payload.transcript === "string" && payload.transcript.trim()) {
    return payload.transcript;
  }

  if (Array.isArray(payload.transcript)) {
    const transcript = payload.transcript
      .map((item) => item?.text?.trim())
      .filter(Boolean)
      .join("\n");
    if (transcript) {
      return transcript;
    }
  }

  if (
    typeof payload.data?.transcript === "string" &&
    payload.data.transcript.trim()
  ) {
    return payload.data.transcript;
  }

  if (Array.isArray(payload.data?.transcript)) {
    const transcript = payload.data.transcript
      .map((item) => item?.text?.trim())
      .filter(Boolean)
      .join("\n");
    if (transcript) {
      return transcript;
    }
  }

  const utterances = payload.utterances ?? payload.data?.utterances;
  if (Array.isArray(utterances)) {
    const transcript = utterances
      .map((item) => item?.text?.trim())
      .filter(Boolean)
      .join("\n");

    if (transcript) {
      return transcript;
    }
  }

  if (Array.isArray(payload.segments)) {
    const transcript = payload.segments
      .map((item) => item?.text?.trim())
      .filter(Boolean)
      .join("\n");

    if (transcript) {
      return transcript;
    }
  }

  return "";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ recordingId: string }> },
) {
  try {
    const { recordingId } = await context.params;
    const apiKey = getApiKey();

    const response = await fetch(
      `${FATHOM_BASE_URL}/recordings/${recordingId}/transcript`,
      {
        headers: {
          "X-Api-Key": apiKey,
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch transcript", details: body },
        { status: response.status },
      );
    }

    const payload: TranscriptResponse = await response.json();
    const transcript = extractTranscript(payload);

    return NextResponse.json({
      recordingId,
      transcript,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
