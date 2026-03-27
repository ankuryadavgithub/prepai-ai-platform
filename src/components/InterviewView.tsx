import { useEffect, useRef, useState } from "react";
import type { InterviewSession, InterviewSetup } from "../types";
import { formatDate } from "../utils/practice";

type InterviewViewProps = {
  theme: "dark" | "light";
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

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | ((event: { error?: string }) => void);
  onresult: null | ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void);
};

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const candidate = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };

  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

export default function InterviewView({
  theme,
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const spokenQuestionRef = useRef("");
  const baseDraftRef = useRef("");

  const currentTurn = !activeSession
    ? null
    : [...activeSession.transcript].reverse().find((turn) => !turn.candidateAnswer) ?? activeSession.transcript[activeSession.transcript.length - 1];
  const interactionMode = activeSession?.interactionMode ?? setup.interactionMode;

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (interactionMode !== "speech" || !currentTurn?.question) return;

    const voiceLine = `${currentTurn.interviewerName}. ${currentTurn.question}`;
    if (spokenQuestionRef.current === voiceLine) return;

    spokenQuestionRef.current = voiceLine;
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceLine);
    utterance.lang = "en-IN";
    window.speechSynthesis?.speak(utterance);
  }, [currentTurn?.id, currentTurn?.interviewerName, currentTurn?.question, interactionMode]);

  useEffect(() => {
    if (interactionMode === "speech" && activeSession) return;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [activeSession, interactionMode]);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setSpeechError("Speech recognition is not available in this browser. Chrome or Edge should work better for voice mode.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    baseDraftRef.current = draftAnswer.trim();
    setSpeechError("");

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setSpeechError(event.error ? `Speech error: ${event.error}` : "Speech recognition stopped unexpectedly.");
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += `${event.results[index][0].transcript} `;
      }
      const nextDraft = [baseDraftRef.current, transcript.trim()].filter(Boolean).join(" ").trim();
      onDraftAnswerChange(nextDraft);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function replayQuestion() {
    if (!currentTurn?.question) return;
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(`${currentTurn.interviewerName}. ${currentTurn.question}`);
    utterance.lang = "en-IN";
    window.speechSynthesis?.speak(utterance);
  }

  return (
    <div className="space-y-6">
      {(error || speechError) && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error || speechError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={`rounded-[30px] border border-white/10 p-8 ${
          theme === "dark"
            ? "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_35%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))]"
        }`}>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Interview Setup</p>
          <h2 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold text-white">Text or speech interview simulation</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Run the same adaptive interview flow in typed mode or spoken mode with interviewer voice playback.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={setup.interviewType}
                onChange={(event) => onSetupChange({ ...setup, interviewType: event.target.value as InterviewSetup["interviewType"] })}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
              >
                {["HR", "Technical", "Panel"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>

              <select
                value={setup.interactionMode}
                onChange={(event) => onSetupChange({ ...setup, interactionMode: event.target.value as InterviewSetup["interactionMode"] })}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
              >
                <option value="text">Text mode</option>
                <option value="speech">Speech mode</option>
              </select>

              <input
                value={setup.targetRole}
                onChange={(event) => onSetupChange({ ...setup, targetRole: event.target.value })}
                placeholder="Target role"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>

            {setup.interactionMode === "speech" && (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-7 text-amber-100">
                {speechSupported
                  ? "Speech mode uses browser voice recognition for the candidate and voice playback for the interviewer."
                  : "Speech mode needs browser support for speech recognition. If voice capture is unavailable, you can still continue by typing."}
              </div>
            )}

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
                    {currentTurn.interviewerName} | {currentTurn.interviewerStyle} | {interactionMode} mode
                  </p>
                  <p className="mt-3 text-base leading-8 text-white">{currentTurn.question}</p>
                </div>

                {interactionMode === "speech" && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={replayQuestion}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      Replay Question
                    </button>
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={!speechSupported}
                      className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
                    >
                      {isListening ? "Stop Listening" : "Start Listening"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.speechSynthesis?.cancel()}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      Stop Voice
                    </button>
                  </div>
                )}

                <textarea
                  value={draftAnswer}
                  onChange={(event) => onDraftAnswerChange(event.target.value)}
                  placeholder={interactionMode === "speech" ? "Speak your answer, then edit the transcript if needed." : "Write your answer as if this is a real interview."}
                  rows={7}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-500"
                />

                {interactionMode === "speech" && (
                  <p className="text-xs text-slate-400">
                    We convert your speech to text first, then use that transcript for evaluation and follow-up questioning.
                  </p>
                )}

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
                        Clarity {turn.evaluation.clarity} | Confidence {turn.evaluation.confidence} | Follow-up {turn.evaluation.followupHandling}
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
              <p className="mt-2 text-sm text-slate-300">
                Score {session.overallScore.toFixed(1)} | {session.interactionMode} mode
              </p>
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
