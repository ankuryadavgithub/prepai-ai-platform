import type {
  Difficulty,
  MCQQuestion,
  PracticeConfig,
  PracticeFeedback,
  PracticeSection,
} from "../types";
import { TOPICS } from "../types";
import { formatPercent } from "../utils/practice";

type PracticeViewProps = {
  theme: "dark" | "light";
  config: PracticeConfig;
  questions: MCQQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  feedback: PracticeFeedback | null;
  loading: boolean;
  error: string;
  timeLeft: number | null;
  onConfigChange: (next: PracticeConfig) => void;
  onStart: () => void;
  onSelectAnswer: (value: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function PracticeView({
  theme,
  config,
  questions,
  currentIndex,
  answers,
  feedback,
  loading,
  error,
  timeLeft,
  onConfigChange,
  onStart,
  onSelectAnswer,
  onNavigate,
  onSubmit,
  onReset,
}: PracticeViewProps) {
  const currentQuestion = questions[currentIndex];
  const topics = TOPICS[config.section];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <select
            value={config.section}
            onChange={(event) => {
              const nextSection = event.target.value as PracticeSection;
              onConfigChange({
                ...config,
                section: nextSection,
                topic: TOPICS[nextSection][0],
              });
            }}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
          >
            {Object.keys(TOPICS).map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>

          <select
            value={config.topic}
            onChange={(event) => onConfigChange({ ...config, topic: event.target.value })}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <select
            value={config.difficulty}
            onChange={(event) => onConfigChange({ ...config, difficulty: event.target.value as Difficulty })}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
          >
            {["Easy", "Medium", "Hard"].map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>

          <select
            value={config.mode}
            onChange={(event) => onConfigChange({ ...config, mode: event.target.value as PracticeConfig["mode"] })}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
          >
            <option value="practice">Practice mode</option>
            <option value="timed">Timed test</option>
          </select>

          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating..." : "Start Session"}
          </button>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      </div>

      {!questions.length && !feedback && (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-center text-slate-400 sm:p-10">
          Pick a topic, difficulty, and mode. Practice mode is untimed; timed mode simulates placement-test pressure.
        </div>
      )}

      {!!questions.length && currentQuestion && !feedback && (
        <div className={`rounded-[28px] border border-white/10 p-5 sm:rounded-[32px] sm:p-8 ${
          theme === "dark"
            ? "bg-[linear-gradient(165deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
            : "bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]"
        }`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
              <h2 className="mt-3 max-w-3xl text-lg leading-7 text-white sm:text-xl sm:leading-8">{currentQuestion.question}</h2>
            </div>
            {timeLeft !== null && (
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-200">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelectAnswer(option)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm transition sm:px-5 ${
                  answers[currentIndex] === option
                    ? "border-emerald-300/60 bg-emerald-300/10 text-white"
                    : "border-white/8 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onNavigate("prev")}
                disabled={currentIndex === 0}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => onNavigate("next")}
                disabled={currentIndex === questions.length - 1}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Submit Session
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Session Review</p>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                ["Score", `${feedback.score}/${feedback.total}`],
                ["Accuracy", formatPercent(feedback.accuracy)],
                ["Average pace", `${feedback.avgTimePerQ.toFixed(1)} sec/q`],
                ["Speed profile", feedback.speedLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ["Correct", `${feedback.correct}`],
                ["Wrong", `${feedback.wrong}`],
                ["Skipped", `${feedback.skipped}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm leading-7 text-emerald-100">
              <p><span className="font-semibold">Strongest topic:</span> {feedback.strongestTopic}</p>
              <p><span className="font-semibold">Needs revision:</span> {feedback.weakestTopic}</p>
              <p><span className="font-semibold">Recommended next action:</span> {feedback.recommendation}</p>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="mt-6 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Start Another Session
            </button>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h3 className="font-['Space_Grotesk'] text-xl font-semibold text-white">Answer review</h3>
            <div className="mt-5 space-y-4">
              {questions.map((question, index) => {
                const selected = answers[index];
                return (
                  <div key={`${question.question}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <p className="text-sm leading-7 text-white">{index + 1}. {question.question}</p>
                    <p className="mt-3 text-sm text-slate-300">
                      <span className="font-semibold text-slate-100">Selected:</span> {selected || "Skipped"}
                    </p>
                    <p className="mt-1 text-sm text-emerald-200">
                      <span className="font-semibold">Correct:</span> {question.correct_answer}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{question.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
