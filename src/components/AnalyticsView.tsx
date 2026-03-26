import type { AnalyticsData } from "../types";
import { formatDate, formatPercent } from "../utils/practice";

type AnalyticsViewProps = {
  data: AnalyticsData | null;
  loading: boolean;
};

export default function AnalyticsView({ data, loading }: AnalyticsViewProps) {
  if (loading) {
    return <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300">Analytics unavailable.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Overall accuracy", formatPercent(data.overall.accuracy)],
          ["Average score", data.overall.avg_score.toFixed(1)],
          ["Tests completed", `${data.overall.tests}`],
          ["Average pace", `${data.avgTime.toFixed(1)} sec/q`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Section performance</h3>
          <div className="mt-5 space-y-4">
            {data.sections.map((section) => (
              <div key={section.section}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span className="capitalize">{section.section}</span>
                  <span>{formatPercent(section.accuracy)}</span>
                </div>
                <div className="h-3 rounded-full bg-black/20">
                  <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${Math.min(section.accuracy * 100, 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {section.tests} test(s) | {section.avg_time.toFixed(1)} sec/q
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Topic mastery</h3>
          <div className="mt-5 grid gap-3">
            {data.topicMastery.length ? data.topicMastery.map((topic) => (
              <div key={topic.topic} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between text-sm text-white">
                  <span>{topic.topic}</span>
                  <span>{formatPercent(topic.accuracy)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {topic.totalAttempts} attempts | {topic.avg_time.toFixed(1)} sec avg
                </p>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Topic mastery appears after answer-level data accumulates.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Difficulty breakdown</h3>
          <div className="mt-5 space-y-3">
            {data.difficultyBreakdown.map((item) => (
              <div key={item.difficulty} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between text-white">
                  <span>{item.difficulty}</span>
                  <span>{formatPercent(item.accuracy)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {item.tests} test(s) | {item.avg_time.toFixed(1)} sec/q
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Recent attempts</h3>
          <div className="mt-5 space-y-3">
            {data.recentAttempts.map((attempt, index) => (
              <div key={`${attempt.created_at}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between text-white">
                  <span className="capitalize">{attempt.category}</span>
                  <span>{formatPercent(attempt.accuracy)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {attempt.topic} | {attempt.difficulty} | {attempt.mode} | {formatDate(attempt.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Improvement insights</h3>
          <div className="mt-5 space-y-3">
            {data.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {insight}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Coding analytics</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Submissions", `${data.codingStats.submissions}`],
              ["Average pass rate", formatPercent(data.codingStats.avg_pass_rate)],
              ["Average solve time", `${data.codingStats.avg_solve_time.toFixed(1)} sec`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {data.codingStats.recent.map((item, index) => (
              <div key={`${item.created_at}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between text-white">
                  <span>{item.problem_title}</span>
                  <span>{item.language}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {item.difficulty} | Visible {item.passed_visible}/{item.total_visible} | Hidden {item.passed_hidden}/{item.total_hidden} | {formatDate(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
