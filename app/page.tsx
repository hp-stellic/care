"use client";

import { useEffect, useMemo, useState } from "react";

type CallSummary = {
  recordingId: string;
  title: string;
  date: string | null;
  durationSeconds: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export default function Home() {
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCalls() {
      try {
        setCallsLoading(true);
        setCallsError(null);

        const response = await fetch("/api/fathom/calls");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.details
              ? `${payload?.error || "Failed to load calls"}: ${payload.details}`
              : payload?.error || "Failed to load calls",
          );
        }

        const nextCalls: CallSummary[] = Array.isArray(payload?.calls)
          ? payload.calls
          : [];
        setCalls(nextCalls);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load calls";
        setCallsError(message);
      } finally {
        setCallsLoading(false);
      }
    }

    loadCalls();
  }, []);

  async function loadTranscript(recordingId: string) {
    try {
      setSelectedId(recordingId);
      setTranscript("");
      setTranscriptError(null);
      setTranscriptLoading(true);

      const response = await fetch(`/api/fathom/calls/${recordingId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.details
            ? `${payload?.error || "Failed to load transcript"}: ${payload.details}`
            : payload?.error || "Failed to load transcript",
        );
      }

      setTranscript(payload?.transcript || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load transcript";
      setTranscriptError(message);
    } finally {
      setTranscriptLoading(false);
    }
  }

  const selectedCall = useMemo(
    () => calls.find((call) => call.recordingId === selectedId) || null,
    [calls, selectedId],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Fathom Calls</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Click a call to load its transcript.
        </p>
      </header>

      {callsLoading ? (
        <p>Loading calls...</p>
      ) : callsError ? (
        <p className="text-red-600">{callsError}</p>
      ) : calls.length === 0 ? (
        <p>No calls found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
          <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ul>
              {calls.map((call) => {
                const isSelected = call.recordingId === selectedId;
                return (
                  <li key={call.recordingId} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => loadTranscript(call.recordingId)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-zinc-100 dark:bg-zinc-900"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-950"
                      }`}
                    >
                      <p className="font-medium">{call.title}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(call.date)} • {formatDuration(call.durationSeconds)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {!selectedCall ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Select a call to view transcript.
              </p>
            ) : transcriptLoading ? (
              <p>Loading transcript...</p>
            ) : transcriptError ? (
              <p className="text-red-600">{transcriptError}</p>
            ) : transcript ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">{selectedCall.title}</h2>
                <p className="whitespace-pre-wrap text-sm leading-6">{transcript}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No transcript available for this call yet.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
