import type { AnalyticsData, User } from "../types";
import { formatDate, formatPercent } from "../utils/practice";

type ProfileViewProps = {
  user: User;
  analytics: AnalyticsData | null;
  onLogout: () => void;
};

export default function ProfileView({ user, analytics, onLogout }: ProfileViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_42%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))] p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Profile</p>
        <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold text-white">{user.name}</h2>
        <p className="mt-2 text-sm text-slate-300">{user.email}</p>
        {user.phone && <p className="mt-1 text-sm text-slate-400">{user.phone}</p>}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current standing</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {analytics ? `Accuracy ${formatPercent(analytics.overall.accuracy)} across ${analytics.overall.tests} tests.` : "Start practicing to build your profile."}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
        >
          Logout
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Learning snapshot</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ["Streak", analytics ? `${analytics.streak} day(s)` : "0 day"],
              ["Weak topics", analytics ? `${analytics.weakTopics.length}` : "0"],
              ["Latest attempt", analytics?.latestSummary ? formatDate(analytics.latestSummary.created_at) : "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Recommended focus</h3>
          {analytics ? (
            <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-5 text-sm leading-7 text-slate-300">
              <p><span className="font-semibold text-white">Section:</span> {analytics.recommendation.section}</p>
              <p><span className="font-semibold text-white">Topic:</span> {analytics.recommendation.topic || "Mixed focus"}</p>
              <p><span className="font-semibold text-white">Difficulty:</span> {analytics.recommendation.difficulty}</p>
              <p><span className="font-semibold text-white">Mode:</span> {analytics.recommendation.mode}</p>
              <p className="mt-3">{analytics.recommendation.reason}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Recommendations appear once you complete some practice.</p>
          )}
        </div>
      </div>
    </div>
  );
}
