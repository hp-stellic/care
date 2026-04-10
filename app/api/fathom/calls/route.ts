import { NextResponse } from "next/server";
import { fetchFromFathom } from "../_lib/fathom";

type FathomMeeting = {
  recording_id?: number | string;
  recordingId?: number | string;
  id?: number | string;
  title?: string;
  meeting_title?: string;
  created_at?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  duration?: number | string;
};

function getDurationInSeconds(meeting: FathomMeeting) {
  if (typeof meeting.duration === "number") {
    return meeting.duration;
  }
  if (typeof meeting.duration === "string") {
    const parts = meeting.duration.split(":").map((part) => Number(part));
    if (
      parts.length === 3 &&
      parts.every((part) => Number.isFinite(part) && part >= 0)
    ) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
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

function getRecordingId(meeting: FathomMeeting): string | null {
  const candidate = meeting.recording_id ?? meeting.recordingId ?? meeting.id;
  if (candidate === null || candidate === undefined) {
    return null;
  }
  const value = String(candidate).trim();
  return value ? value : null;
}

export async function GET() {
  try {
    const response = await fetchFromFathom("/meetings");

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch Fathom calls",
          details: body,
          status: response.status,
          hint:
            response.status === 401
              ? "Check FATHOM_API_KEY in .env.local and restart the dev server."
              : undefined,
        },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const meetings: FathomMeeting[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.meetings)
        ? payload.meetings
      : Array.isArray(payload?.results)
        ? payload.results
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const calls = meetings
      .map((meeting) => ({
        recordingId: getRecordingId(meeting),
        title: meeting.title || meeting.meeting_title || "Untitled call",
        date: meeting.created_at || meeting.recording_start_time || null,
        durationSeconds: getDurationInSeconds(meeting),
      }))
      .filter((meeting) => Boolean(meeting.recordingId));

    return NextResponse.json({ calls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
