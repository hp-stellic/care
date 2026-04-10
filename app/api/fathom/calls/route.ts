import { NextResponse } from "next/server";

const FATHOM_BASE_URL = "https://api.fathom.ai/external/v1";

function getApiKey() {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY is not set");
  }
  return apiKey;
}

type FathomMeeting = {
  recording_id?: number;
  title?: string;
  meeting_title?: string;
  created_at?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  duration?: number;
};

function getDurationInSeconds(meeting: FathomMeeting) {
  if (typeof meeting.duration === "number") {
    return meeting.duration;
  }

  const start =
    meeting.recording_start_time ?? meeting.scheduled_start_time ?? meeting.created_at;
  const end = meeting.recording_end_time ?? meeting.scheduled_end_time;

  if (!start || !end) {
    return 0;
  }

  const startMs = Date.parse(start);
  const endMs = Date.parse(end);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return 0;
  }

  return Math.round((endMs - startMs) / 1000);
}

export async function GET() {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${FATHOM_BASE_URL}/meetings`, {
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch Fathom calls", details: body },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const meetings: FathomMeeting[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.meetings)
        ? payload.meetings
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const calls = meetings
      .filter((meeting) => typeof meeting.recording_id === "number")
      .map((meeting) => ({
        recordingId: meeting.recording_id as number,
        title: meeting.title || meeting.meeting_title || "Untitled call",
        date: meeting.created_at || meeting.recording_start_time || null,
        durationSeconds: getDurationInSeconds(meeting),
      }));

    return NextResponse.json({ calls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
