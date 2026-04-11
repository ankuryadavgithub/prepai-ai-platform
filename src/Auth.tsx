import { useState } from "react";
import { authApi } from "./services/gemini";
import type { User } from "./types";

type AuthProps = {
  theme: "dark" | "light";
  setUser: (user: User) => void;
};

export default function Auth({ theme, setUser }: AuthProps) {
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-400/60 ${
    theme === "dark"
      ? "border-white/10 bg-white/5 text-slate-100 focus:bg-white/8"
      : "border-slate-200 bg-white text-slate-900 focus:bg-slate-50"
  }`;

  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  async function handleLogin() {
    if (!loginForm.email || !loginForm.password) {
      setError("Enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await authApi.login(loginForm);
      localStorage.setItem("token", data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authApi.register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });
      setTab("login");
      setLoginForm({ email: registerForm.email, password: "" });
      setError("Registration complete. Sign in to continue.");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`mx-auto w-full max-w-5xl rounded-[28px] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:rounded-[32px] sm:p-6 lg:p-8 ${
      theme === "dark"
        ? "border border-white/10 bg-slate-950/70"
        : "border border-slate-200 bg-white/80"
    }`}>
      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`rounded-[24px] p-5 sm:rounded-[28px] sm:p-8 ${
          theme === "dark"
            ? "border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_42%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))]"
            : "border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,245,249,0.94))]"
        }`}>
          <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.3em] ${
            theme === "dark" ? "text-emerald-300/80" : "text-emerald-600"
          }`}>
            Prep AI
          </p>
          <h1 className={`max-w-xl font-['Space_Grotesk'] text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            Placement prep that reacts to how the learner actually performs.
          </h1>
          <p className={`mt-5 max-w-lg text-sm leading-7 ${
            theme === "dark" ? "text-slate-300" : "text-slate-600"
          }`}>
            Practice aptitude, coding, and review sessions with adaptive recommendations, coaching-style analytics,
            and fresher-focused test flows.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Adaptive drills", "Practice recommendations based on weak topics and pace."],
              ["Actionable analytics", "See why performance changes, not just the score."],
              ["Coding rounds", "Solve structured challenges with visible and hidden tests."],
            ].map(([title, body]) => (
              <div
                key={title}
                className={`rounded-2xl p-4 ${
                  theme === "dark" ? "border border-white/10 bg-black/20" : "border border-slate-200 bg-white/70"
                }`}
              >
                <h2 className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{title}</h2>
                <p className={`mt-2 text-xs leading-6 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[24px] p-5 sm:rounded-[28px] sm:p-6 lg:p-8 ${
          theme === "dark" ? "border border-white/8 bg-white/5" : "border border-slate-200 bg-white"
        }`}>
          <div className={`mb-6 grid grid-cols-2 rounded-2xl p-1 text-sm ${
            theme === "dark" ? "bg-black/20" : "bg-slate-100"
          }`}>
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  setError("");
                }}
                className={`rounded-xl px-4 py-3 font-medium capitalize transition ${
                  tab === item
                    ? "bg-emerald-400 text-white"
                    : theme === "dark"
                      ? "text-slate-300 hover:bg-white/5"
                      : "text-slate-700 hover:bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div className="space-y-4">
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Email</span>
                <input
                  className={inputClass}
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Name</span>
                <input
                  className={inputClass}
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Email</span>
                <input
                  className={inputClass}
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Phone</span>
                <input
                  className={inputClass}
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.2em] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Confirm Password</span>
                <input
                  type="password"
                  className={inputClass}
                  value={registerForm.confirmPassword}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
              </label>
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
