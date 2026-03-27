import type { DashboardData } from "../types";
import { formatDate, formatPercent } from "../utils/practice";

type DashboardViewProps = {
  theme: "dark" | "light";
  data: DashboardData | null;
  loading: boolean;
  onStartRecommendation: () => void;
};

export default function DashboardView({ theme, data, loading, onStartRecommendation }: DashboardViewProps) {
  if (loading) {
    return <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300">Dashboard unavailable.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className={`rounded-[30px] border border-white/10 p-8 ${
          theme === "dark"
            ? "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_42%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]"
        }`}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">Recommended Next Step</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold capitalize text-white">
            {data.recommendation.section} {data.recommendation.mode} session
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{data.recommendation.reason}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Topic: {data.recommendation.topic || "Mixed focus"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Difficulty: {data.recommendation.difficulty}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Mode: {data.recommendation.mode}
            </span>
          </div>
          <button
            type="button"
            onClick={onStartRecommendation}
            className="mt-8 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            Start Recommended Practice
          </button>
        </div>

        <div className="grid gap-4">
          {[
            ["Readiness score", `${data.readiness.readinessScore}`],
            ["Practice streak", `${data.streak} day${data.streak === 1 ? "" : "s"}`],
            ["Completed tests", `${data.overall.tests}`],
            ["Interview readiness", `${data.readiness.interviewReadiness}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{value}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Readiness board</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Strongest round", data.readiness.strongestRoundType],
              ["Weakest round", data.readiness.weakestRoundType],
              ["Next track", data.nextRecommendedTrack.label],
              ["Weekly target", `${data.weeklyTarget.completed}/${data.weeklyTarget.target}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-base font-medium text-white capitalize">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview status</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{data.readiness.interviewStatus}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Coach insights</h3>
          <div className="mt-5 space-y-3">
            {data.insights.length ? data.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {insight}
              </div>
            )) : (
              <p className="text-sm text-slate-400">Insights appear after you build some practice history.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Weak topics to revisit</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {data.weakTopics.length ? data.weakTopics.map((topic) => (
              <span key={topic} className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
                {topic}
              </span>
            )) : (
              <p className="text-sm text-slate-400">No weak topics yet. Complete a few tests to unlock topic guidance.</p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Momentum</h3>
          <div className="mt-5 space-y-3">
            {data.milestones.length ? data.milestones.map((milestone) => (
              <div key={milestone} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3 text-sm leading-7 text-emerald-50">
                {milestone}
              </div>
            )) : (
              <p className="text-sm text-slate-400">Milestones will appear as your mock, interview, and practice history grows.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Latest test summary</h3>
        {data.latestSummary ? (
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
              <p className="mt-2 text-lg font-medium capitalize text-white">{data.latestSummary.category}</p>
              <p className="mt-1 text-xs text-slate-400">{data.latestSummary.topic}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p>
              <p className="mt-2 text-lg font-medium text-white">
                {data.latestSummary.score}/{data.latestSummary.total}
              </p>
              <p className="mt-1 text-xs text-slate-400">{formatPercent(data.latestSummary.accuracy)}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mode</p>
              <p className="mt-2 text-lg font-medium text-white">{data.latestSummary.mode}</p>
              <p className="mt-1 text-xs text-slate-400">{data.latestSummary.difficulty}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
              <p className="mt-2 text-lg font-medium text-white">{formatDate(data.latestSummary.created_at)}</p>
              <p className="mt-1 text-xs text-slate-400">{data.latestSummary.avg_time_per_q.toFixed(1)} sec/question</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No completed tests yet.</p>
        )}
      </div>
    </div>
  );
}
