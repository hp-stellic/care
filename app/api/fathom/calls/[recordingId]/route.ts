import { NextResponse } from "next/server";
import { fetchFromFathom } from "../../_lib/fathom";

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
    const response = await fetchFromFathom(`/recordings/${recordingId}/transcript`);

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch transcript",
          status: response.status,
          details: body || "No details returned by Fathom.",
          hint:
            response.status === 401
              ? "Check FATHOM_API_KEY in .env.local and restart the dev server."
              : undefined,
        },
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
