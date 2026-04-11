import type { MockMode, MockSession, MockTrack } from "../types";
import { formatDate } from "../utils/practice";

type MockViewProps = {
  theme: "dark" | "light";
  tracks: MockTrack[];
  activeSession: MockSession | null;
  history: MockSession[];
  loading: boolean;
  error: string;
  onStart: (trackId: string, mode: MockMode) => void;
  onLaunchRound: (session: MockSession, roundKey: string) => void;
};

export default function MockView({
  theme,
  tracks,
  activeSession,
  history,
  loading,
  error,
  onStart,
  onLaunchRound,
}: MockViewProps) {
  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div
          className={`rounded-[26px] border border-white/10 p-5 sm:rounded-[30px] sm:p-8 ${
            theme === "dark"
              ? "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_36%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
              : "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_36%),linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Mock Tracks</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-2xl font-bold text-white sm:text-3xl">Company-style readiness tracks</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:leading-7">
            Use fixed round sequences with cutoffs, timers, and follow-up actions instead of isolated topic drills.
          </p>

          <div className="mt-6 grid gap-4">
            {tracks.map((track) => (
              <div key={track.id} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{track.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">{track.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{track.target}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {track.modes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onStart(track.id, mode)}
                        disabled={loading}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {mode === "full" ? "Full mock" : `${mode} only`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {track.rounds.map((round) => (
                    <div key={round.roundKey} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">{round.roundLabel}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {round.difficulty} | {round.timeLimit} min | cutoff {round.cutoffScore}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">{round.topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Active mock session</h3>
            {!activeSession ? (
              <p className="mt-4 text-sm text-slate-400">No active mock. Start one of the tracks to guide your next practice or coding round.</p>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-slate-300">{activeSession.trackName} | {activeSession.mode}</p>
                  <p className="mt-2 text-lg font-semibold text-white">Readiness: {activeSession.readinessScore.toFixed(1)}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{activeSession.nextPriority || "Complete each round in sequence."}</p>
                </div>

                {activeSession.rounds.map((round) => (
                  <div key={round.roundKey} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-white">{round.roundLabel}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">
                          {round.roundType} | {round.difficulty} | cutoff {round.cutoffScore}
                        </p>
                      </div>
                      {round.status === "completed" ? (
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                          {round.score?.toFixed(1)}%
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onLaunchRound(activeSession, round.roundKey)}
                          className="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-950"
                        >
                          Launch
                        </button>
                      )}
                    </div>
                    {round.summary && <p className="mt-3 text-sm leading-7 text-slate-300">{round.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Recent mock outcomes</h3>
            <div className="mt-5 space-y-3">
              {history.length ? history.map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{session.trackName}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${session.passed ? "bg-emerald-300/10 text-emerald-100" : "bg-rose-400/10 text-rose-200"}`}>
                      {session.passed ? "Passed cutoff" : "Needs retry"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Readiness {session.readinessScore.toFixed(1)} | {session.strongestRound || "No strongest round yet"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{session.completedAt ? formatDate(session.completedAt) : "In progress"}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No mock history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
