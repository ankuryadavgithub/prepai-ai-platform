import Editor from "@monaco-editor/react";
import type { CodingProblem, CodingSubmissionResult, Difficulty } from "../types";

type CodingViewProps = {
  theme: "dark" | "light";
  difficulty: Difficulty;
  presetLabel: string;
  submissionCount: number;
  timerLabel: string;
  language: string;
  problem: CodingProblem | null;
  result: CodingSubmissionResult | null;
  loading: boolean;
  error: string;
  code: string;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onGenerate: () => void;
  onSubmit: () => void;
};

export default function CodingView({
  theme,
  difficulty,
  presetLabel,
  submissionCount,
  timerLabel,
  language,
  problem,
  result,
  loading,
  error,
  code,
  onDifficultyChange,
  onLanguageChange,
  onCodeChange,
  onGenerate,
  onSubmit,
}: CodingViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          {[
            ["Preset", presetLabel],
            ["Submissions this round", `${submissionCount}`],
            ["Round timer", timerLabel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="mt-2 text-base font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[220px_220px_auto_auto]">
          <select
            value={difficulty}
            onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
          >
            {["Easy", "Medium", "Hard"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
            disabled={!problem}
          >
            {(problem?.supportedLanguages || ["javascript", "python"]).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Challenge"}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!problem || loading}
            className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
          >
            Submit Solution
          </button>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      </div>

      {!problem && (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-10 text-center text-slate-400">
          Generate a coding challenge to start a structured interview-style round with visible and hidden tests.
        </div>
      )}

      {problem && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[32px] border border-white/10 p-8 ${
            theme === "dark"
              ? "bg-[linear-gradient(165deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
              : "bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]"
          }`}>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Coding Round</p>
            <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold text-white">{problem.title}</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">{problem.description}</p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Constraints</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-4">
              {problem.examples.map((example, index) => (
                <div key={`${example.input}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Example {index + 1}</p>
                  <p className="mt-3 text-sm text-slate-200"><span className="font-semibold text-white">Input:</span> {example.input}</p>
                  <p className="mt-2 text-sm text-slate-200"><span className="font-semibold text-white">Output:</span> {example.output}</p>
                  {example.explanation && <p className="mt-2 text-sm leading-7 text-slate-400">{example.explanation}</p>}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible tests</p>
              <div className="mt-3 space-y-3">
                {problem.visibleTests.map((test, index) => (
                  <div key={index} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Input: <span className="text-white">{JSON.stringify(test.input)}</span> | Expected:{" "}
                    <span className="text-emerald-200">{JSON.stringify(test.expected)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-4">
            <div className="rounded-[28px] border border-white/8 bg-slate-950/80 p-3">
              <Editor
                height="560px"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={(value) => onCodeChange(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {result && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                  <p className="text-sm font-semibold text-emerald-100">
                    {result.summary.passedAll ? "All visible and hidden tests passed." : "Submission needs another pass."}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-emerald-50">
                    Visible: {result.summary.passedVisible}/{result.summary.totalVisible} | Hidden: {result.summary.passedHidden}/{result.summary.totalHidden}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-emerald-100">{result.feedback}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible test results</p>
                  <div className="mt-3 space-y-3">
                    {result.visibleResults.map((item, index) => (
                      <div key={index} className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <p className={item.passed ? "text-emerald-200" : "text-rose-200"}>
                          Case {index + 1}: {item.passed ? "Passed" : "Failed"}
                        </p>
                        <p className="mt-2">Expected: {JSON.stringify(item.expected)}</p>
                        <p>Actual: {JSON.stringify(item.actual)}</p>
                        {item.error && <p className="mt-2 text-rose-200">{item.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
