import type { InterviewSession, InterviewSetup } from "../types";
import { formatDate } from "../utils/practice";

type InterviewViewProps = {
  setup: InterviewSetup;
  activeSession: InterviewSession | null;
  history: InterviewSession[];
  draftAnswer: string;
  answerFeedback: string;
  loading: boolean;
  error: string;
  onSetupChange: (next: InterviewSetup) => void;
  onDraftAnswerChange: (value: string) => void;
  onStart: () => void;
  onSubmitAnswer: () => void;
  onFinish: () => void;
};

export default function InterviewView({
  setup,
  activeSession,
  history,
  draftAnswer,
  answerFeedback,
  loading,
  error,
  onSetupChange,
  onDraftAnswerChange,
  onStart,
  onSubmitAnswer,
  onFinish,
}: InterviewViewProps) {
  const currentTurn = !activeSession
    ? null
    : [...activeSession.transcript].reverse().find((turn) => !turn.candidateAnswer) ?? activeSession.transcript[activeSession.transcript.length - 1];

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_35%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Interview Setup</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold text-white">Realistic text-first interview simulation</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Build a live transcript with adaptive follow-ups, panel personas, and rubric-based coaching.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={setup.interviewType}
                onChange={(event) => onSetupChange({ ...setup, interviewType: event.target.value as InterviewSetup["interviewType"] })}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
              >
                {["HR", "Technical", "Panel"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input
                value={setup.targetRole}
                onChange={(event) => onSetupChange({ ...setup, targetRole: event.target.value })}
                placeholder="Target role"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>

            <input
              value={setup.focusArea}
              onChange={(event) => onSetupChange({ ...setup, focusArea: event.target.value })}
              placeholder="Skill focus or subject area"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
            <textarea
              value={setup.resumeSummary}
              onChange={(event) => onSetupChange({ ...setup, resumeSummary: event.target.value })}
              placeholder="Resume summary"
              rows={4}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
            />
            <textarea
              value={setup.projects}
              onChange={(event) => onSetupChange({ ...setup, projects: event.target.value })}
              placeholder="Projects"
              rows={4}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <textarea
                value={setup.internships}
                onChange={(event) => onSetupChange({ ...setup, internships: event.target.value })}
                placeholder="Internships"
                rows={3}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
              />
              <textarea
                value={setup.achievements}
                onChange={(event) => onSetupChange({ ...setup, achievements: event.target.value })}
                placeholder="Achievements"
                rows={3}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>

            <button
              type="button"
              onClick={onStart}
              disabled={loading || !!activeSession}
              className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {loading ? "Preparing..." : activeSession ? "Interview in progress" : "Start Interview"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Live interview room</h3>
            {!activeSession || !currentTurn ? (
              <p className="mt-4 text-sm text-slate-400">No active interview. Start an HR, Technical, or Panel round to open the transcript.</p>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {currentTurn.interviewerName} • {currentTurn.interviewerStyle}
                  </p>
                  <p className="mt-3 text-base leading-8 text-white">{currentTurn.question}</p>
                </div>

                <textarea
                  value={draftAnswer}
                  onChange={(event) => onDraftAnswerChange(event.target.value)}
                  placeholder="Write your answer as if this is a real interview."
                  rows={7}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
                />

                {answerFeedback && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                    {answerFeedback}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSubmitAnswer}
                    disabled={loading || !draftAnswer.trim()}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    Submit Answer
                  </button>
                  <button
                    type="button"
                    onClick={onFinish}
                    disabled={loading}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Finish Interview
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Transcript and review</h3>
            <div className="mt-5 space-y-4">
              {activeSession?.transcript.length ? activeSession.transcript.map((turn) => (
                <div key={turn.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{turn.interviewerName}</p>
                  <p className="mt-2 text-sm leading-7 text-white">{turn.question}</p>
                  {turn.candidateAnswer && (
                    <>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{turn.candidateAnswer}</p>
                      <p className="mt-3 text-xs text-slate-400">
                        Clarity {turn.evaluation.clarity} • Confidence {turn.evaluation.confidence} • Follow-up {turn.evaluation.followupHandling}
                      </p>
                    </>
                  )}
                </div>
              )) : (
                <p className="text-sm text-slate-400">The live transcript appears here.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Recent interview outcomes</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.length ? history.map((session) => (
            <div key={session.id} className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{session.interviewType}</p>
              <p className="mt-2 text-lg font-semibold text-white">{session.targetRole}</p>
              <p className="mt-2 text-sm text-slate-300">Score {session.overallScore.toFixed(1)}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{session.recommendation || session.finalSummary?.hiringSummary || "Interview feedback available."}</p>
              <p className="mt-3 text-xs text-slate-400">{session.completedAt ? formatDate(session.completedAt) : "In progress"}</p>
            </div>
          )) : (
            <p className="text-sm text-slate-400">No interview history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
