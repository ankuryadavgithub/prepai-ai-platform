import React, { useState, useEffect } from 'react';
import { TOPICS, Difficulty, MCQQuestion, CodingProblem } from './types';
import { generateMCQ, generateCodingProblem } from './services/gemini';
import { motion, AnimatePresence } from "framer-motion";
// import Login from './Login';
// import Register from './Register';
import Editor from "@monaco-editor/react";
import Auth from "./Auth";

type Section = 'numerical' | 'logical' | 'verbal' | 'coding' | 'analytics';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);

  const [activeSection, setActiveSection] = useState<Section>('numerical');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [codingProblem, setCodingProblem] = useState<CodingProblem | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(600);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewMode, setReviewMode] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);

  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  // ✅ LOGIN CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setUser({});
  }, []);

  // ✅ TIMER FIX
  useEffect(() => {
    if (!questions.length || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions, showResult]);

  useEffect(() => {
  // Only reset when starting NEW test sections
  if (activeSection !== "analytics") {
    setSubmitted(false);
  }
}, [activeSection]);

useEffect(() => {
  if (activeSection === "analytics") {
    // 🔥 Kill active test completely
    setQuestions([]);
    setCodingProblem(null);
    setReviewMode(false);
    setShowResult(false);
  }
}, [activeSection]);


  // ✅ RESET
  useEffect(() => {
  if (activeSection !== 'coding' && activeSection !== 'analytics') {
    setSelectedTopic(TOPICS[activeSection][0] || "");
    setQuestions([]);
  }

  if (activeSection === 'coding') {
    setCodingProblem(null);
  }

  setShowResult(false);
}, [activeSection]);

useEffect(() => {
  if (activeSection !== "analytics") return;

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/analytics/user", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        return;
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error", err);
    }
  };

  fetchAnalytics();
}, [activeSection]);
  // ✅ START TEST (CRITICAL FIX)
  const handleStartPractice = async () => {
    setSubmitted(false);
    setLoading(true);
    setError('');
    setShowResult(false);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(600);

    try {
      if (activeSection === 'coding') {
        const data = await generateCodingProblem(difficulty);
        setCodingProblem(data);
      } else {
        let data = await generateMCQ(activeSection, selectedTopic, difficulty);

        // 🔥 FIX: ensure always array
        if (!Array.isArray(data)) {
          data = [data];
        }

        // 🔥 FIX: ensure at least 10
        if (data.length < 10) {
          console.log("Regenerating missing questions...");
          const extra = await generateMCQ(activeSection, selectedTopic, difficulty);
          data = [...data, ...extra].slice(0, 10);
        }

        setQuestions(data);
      }
    } catch {
      setError("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const runCode = async (e?:any) => {

    if (e) e.preventDefault();
    
    setOutput("Running...");

    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const data = await res.json();

      if (data.error) {
        setOutput("Error: " + data.error);
      } else {
        setOutput(data.output || "No output");
      }

    } catch (err) {
      setOutput("Server error while running code");
    }
  };


  const handleAnswer = (opt: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }));
  };

  // ✅ SUBMIT FIX
  const handleSubmit = async () => {
  if (submitted || questions.length === 0) return;

  setSubmitted(true);

  let score = 0;
  let correct = 0;
  let wrong = 0;

  const answersArray: any[] = [];

  questions.forEach((q, i) => {
    const selected = answers[i];
    const isCorrect = selected === q.correct_answer;

    if (isCorrect) {
      score++;
      correct++;
    } else if (selected) {
      wrong++;
    }

    answersArray.push({
      question: q.question,
      selected,
      correct: q.correct_answer
    });
  });

  const total = questions.length;
  const skipped = total - Object.keys(answers).length;

  const totalTime = 600;
  const timeTaken = totalTime - timeLeft;

  const accuracy = total ? score / total : 0;
  const avgTimePerQ = total ? timeTaken / total : 0;

  setFinalScore(score);

  try {
    await fetch("/api/test/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        category: activeSection,
        topic: selectedTopic,
        difficulty,
        score,
        total,
        accuracy,
        time_taken: timeTaken,
        avg_time_per_q: avgTimePerQ,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped,
        answers: answersArray
      })
    });
  } catch (err) {
    console.error("Submit Error:", err);
  }

  setShowResult(true);
  setReviewMode(true);
  setCurrentIndex(0); 
};

  const q = questions[currentIndex];

  // 🔐 AUTH UI
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-white/10 p-6 rounded-xl w-96">
          {isLogin ? (
            <>
              <Auth setUser={setUser} />
              {/* <p onClick={() => setIsLogin(false)} className="mt-3 text-center text-blue-400 cursor-pointer">
                Register
              </p> */}
            </>
          ) : (
            <>
              <Auth />
              {/* <p onClick={() => setIsLogin(true)} className="mt-3 text-center text-blue-400 cursor-pointer">
                Login
              </p> */}
            </>
          )}
        </div>
      </div>
    );
  }

  // 🔓 MAIN UI
return (
  <div className="flex h-screen bg-[#02040a] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
    {/* 🌌 BACKGROUND LAYERS */}
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-40 pointer-events-none" />
    <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

    {/* 🛸 FLOATING SIDEBAR */}
    <aside className="w-72 m-4 rounded-[2rem] bg-slate-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl flex flex-col p-8 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.4)] rotate-45" />
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Prep<span className="text-cyan-400">AI</span></h1>
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-4 px-2 uppercase">Core Modules</p>
        {(['numerical', 'logical', 'verbal', 'coding', 'analytics'] as Section[]).map(sec => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl capitalize transition-all duration-500 overflow-hidden ${
              activeSection === sec
                ? 'text-white bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            {activeSection === sec && (
              <motion.div layoutId="activeGlow" className="absolute left-0 w-1 h-5 bg-cyan-400 rounded-full" />
            )}
            <span className="text-sm font-medium tracking-wide">{sec}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          setUser(null);
        }}
        className="mt-auto flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
      >
        Terminate Session
      </button>
    </aside>

    {/* ⚡️ MAIN TERMINAL AREA */}
    <main className="flex-1 flex flex-col p-6 relative overflow-y-auto">
      
      {/* HEADER CONTROLS */}
      <header className={`flex items-center ${activeSection === 'analytics' ? 'justify-end' : 'justify-between'} bg-slate-900/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl mb-8 shadow-xl`}>
        <div className="flex gap-3">
          {activeSection !== 'coding' && activeSection !== 'analytics' && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-black/40 border border-white/10 text-xs font-bold text-slate-300 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/50 transition-all cursor-pointer appearance-none"
            >
              {(TOPICS[activeSection] || []).map(t => (
                <option key={t} className="bg-slate-900">{t}</option>
              ))}
            </select>
          )}
          {activeSection !== 'analytics' && (
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="bg-black/40 border border-white/10 text-xs font-bold text-slate-300 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
          >
            <option className="bg-slate-900">Easy</option>
            <option className="bg-slate-900">Medium</option>
            <option className="bg-slate-900">Hard</option>
          </select>
          )}
        </div>
        {activeSection !== 'analytics' && (
        <button
          onClick={handleStartPractice}
          className="relative group px-8 py-2.5 bg-cyan-500 text-black font-black text-xs uppercase tracking-[0.15em] rounded-xl overflow-hidden transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          <span className="relative">Initialize Test</span>
        </button>
        )}
      </header>

      {/* DYNAMIC CONTENT LOADER */}
      <div className="w-full flex flex-col items-center">
                  {activeSection === "analytics" && analytics && (
  <div className="w-full max-w-6xl animate-in fade-in duration-700">

    {/* 🧠 TOP CARDS */}
    <div className="grid grid-cols-4 gap-6 mb-10">

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-xs text-slate-400">Accuracy</p>
        <h2 className="text-2xl font-bold text-cyan-400">
          {(analytics.overall?.accuracy * 100 || 0).toFixed(1)}%
        </h2>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-xs text-slate-400">Avg Score</p>
        <h2 className="text-2xl font-bold">
          {(analytics.overall?.avg_score || 0).toFixed(1)}
        </h2>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-xs text-slate-400">Tests</p>
        <h2 className="text-2xl font-bold">
          {analytics.overall?.tests || 0}
        </h2>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-xs text-slate-400">Global Rank</p>
        <h2 className="text-2xl font-bold text-purple-400">
          #{analytics.globalRank?.rank || "-"}
        </h2>
      </div>
    </div>

    {/* 📊 SECTION PERFORMANCE */}
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10">
      <h3 className="text-lg font-bold mb-4 text-cyan-400">Section Performance</h3>

      {Object.entries(analytics.sections || {}).map(([sec, data]: any) => (
        <div key={sec} className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{sec}</span>
            <span>{(data.accuracy * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded">
            <div
              className="h-2 bg-cyan-500 rounded"
              style={{ width: `${(data.accuracy * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>

    {/* ⚠️ WEAK TOPICS */}
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10">
      <h3 className="text-lg font-bold text-red-400 mb-4">Weak Topics</h3>

      <div className="flex flex-wrap gap-2">
        {analytics.weakTopics?.length ? (
          analytics.weakTopics.map((t: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
              {t}
            </span>
          ))
        ) : (
          <p className="text-slate-400 text-sm">No weak areas 🎯</p>
        )}
      </div>
    </div>

    {/* ⚡ SPEED */}
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">Speed Analysis</h3>
      <p className="text-sm text-slate-300">
        Avg Time per Question: <span className="font-bold">{analytics.avgTime?.toFixed(2)} sec</span>
      </p>
    </div>

  </div>
)}
        {loading && (
          <div className="flex flex-col items-center mt-32 space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            </div>
            <p className="text-sm font-bold text-cyan-400 tracking-[0.3em] uppercase animate-pulse">Neural Generation in Progress...</p>
          </div>
        )}

        {/* HUD TIMER */}
        {questions.length > 0 && !showResult && !codingProblem && q && (
          <div className="mb-8 px-6 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-3">
             <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
             <span className="text-rose-400 font-mono text-xl font-bold tracking-widest">
               {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
             </span>
          </div>
        )}

        {/* 💻 CODING ENVIRONMENT */}
        {codingProblem && !showResult && (
          <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex flex-col lg:flex-row h-[700px]">
                {/* Problem Meta */}
                <div className="lg:w-1/3 p-8 border-r border-white/5 overflow-y-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-bold uppercase mb-4">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Logic Core
                  </div>
                  <h2 className="text-2xl font-black text-white mb-6">Coding Challenge</h2>
                  <p className="text-slate-400 leading-relaxed text-sm mb-8">{codingProblem.problem}</p>
                  
                  <div className="space-y-4">
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-cyan-500 uppercase mb-2 tracking-widest">Standard Input</p>
                      <code className="text-slate-300 text-sm font-mono">{codingProblem.input}</code>
                    </div>
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2 tracking-widest">Expected Output</p>
                      <code className="text-slate-300 text-sm font-mono">{codingProblem.output}</code>
                    </div>
                  </div>
                </div>

                {/* Editor Surface */}
                <div className="lg:flex-1 flex flex-col bg-[#1e1e1e]/50">
                  <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-slate-800 text-xs font-bold px-4 py-1.5 rounded-lg border border-white/10 outline-none"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="perl">Perl</option>
                    </select>
                    <button
                      type="button"
                      onClick={(e) => runCode(e)}
                      className="px-6 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                    >
                      EXECUTE
                    </button>
                  </div>
                  <div className="flex-1">
                    <Editor height="100%" theme="vs-dark" language={language} value={code} onChange={(value) => setCode(value || "")} 
                      options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 20 } }} />
                  </div>
                  <div className="h-40 bg-black/80 border-t border-white/10 p-6 font-mono overflow-y-auto">
                    <div className="text-[10px] text-slate-500 uppercase mb-2 tracking-[0.2em]">Kernel Output</div>
                    <pre className="text-emerald-400 text-sm">{output || "> System idle..."}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📝 MCQ CARD */}
        {questions.length > 0 && !showResult && !codingProblem && q && (
          <div className="w-full max-w-3xl animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
              <div className="absolute -top-3 -left-3 px-4 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
                Step {currentIndex + 1} / {questions.length}
              </div>

              <h2 className="text-xl font-medium leading-relaxed text-white mt-4 mb-10">
                {q.question}
              </h2>

              <div className="grid gap-4">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className={`group relative w-full text-left px-6 py-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                      answers[currentIndex] === opt
                        ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/50'
                        : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${answers[currentIndex] === opt ? 'bg-cyan-500' : 'bg-transparent group-hover:bg-white/10'}`} />
                    <span className={`text-sm ${answers[currentIndex] === opt ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                      {opt}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center mt-10">
                <div className="flex gap-3">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(i => i - 1)}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    ←
                  </button>
                  <button
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex(i => i + 1)}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    →
                  </button>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitted}
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all
                    ${submitted ? "bg-gray-600 cursor-not-allowed" : "bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"}
                  `}
                >
                  {submitted ? "Submitting..." : "Finalize Submission"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🏆 FINAL REPORT */}
        {showResult && (
          <div className="mt-20 w-full max-w-lg animate-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl p-12 rounded-[3rem] text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]" />
               <div className="relative">
                 <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase mb-4">Diagnostics Complete</div>
                 <h2 className="text-7xl font-black text-white mb-2">
                   {finalScore}<span className="text-emerald-500/30 text-4xl">/{questions.length}</span>
                 </h2>
                 <p className="text-slate-400 font-medium tracking-wide">Optimization Level: {((finalScore/questions.length)*100).toFixed(0)}%</p>
                 <button 
                  onClick={() => {
                    setReviewMode(false);
                    setShowResult(false);
                    setQuestions([]);
                    setAnswers({});
                  }}
                  className="mt-10 px-8 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                 >
                   Initiate New Session
                 </button>
               </div>
            </div>
          </div>
        )}
        {reviewMode && questions.length > 0 && (
  <div className="w-full max-w-3xl mt-10">
    
    <h2 className="text-xl font-bold mb-6 text-cyan-400">
      Review Your Answers
    </h2>

    <div className="bg-slate-900/60 p-8 rounded-2xl border border-white/10">

      {/* QUESTION */}
      <p className="text-lg mb-6 text-white">
        {questions[currentIndex].question}
      </p>

      {/* OPTIONS */}
      <div className="space-y-3">
        {questions[currentIndex].options.map((opt, i) => {
          const correct = questions[currentIndex].correct_answer;
          const selected = answers[currentIndex];

          return (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                opt === correct
                  ? "bg-green-500/20 border-green-500"
                  : opt === selected
                  ? "bg-red-500/20 border-red-500"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {opt}
            </div>
          );
        })}
      </div>

      {/* EXPLANATION */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300 font-semibold mb-1">
          Explanation:
        </p>
        <p className="text-sm text-slate-300">
          {questions[currentIndex].explanation}
        </p>
      </div>

      {/* NAVIGATION */}
      <div className="flex justify-between mt-6">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(i => i - 1)}
          className="px-4 py-2 bg-white/10 rounded"
        >
          Previous
        </button>

        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(i => i + 1)}
          className="px-4 py-2 bg-white/10 rounded"
        >
          Next
        </button>
      </div>

    </div>
  </div>
)}
      </div>
    </main>
  </div>
);

}