import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* 🔥 Clean Input */
const InputField = ({ label, type = "text", value, onChange }: any) => (
  <div className="relative mb-5">
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="peer w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white
      focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition"
      placeholder=" "
    />
    <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all
      peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm
      peer-focus:-top-2 peer-focus:text-xs peer-focus:text-indigo-400
      peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:text-xs
      bg-black px-1">
      {label}
    </label>
  </div>
);

export default function Auth({ setUser }: any) {
  const [tab, setTab] = useState<"login" | "register">("login");

  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState("");

  /* ✨ Typing Effect */
  useEffect(() => {
    const text = "Welcome to PREPAI";
    let i = 0;
    const interval = setInterval(() => {
      setTyping(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    if (!login.email || !login.password) return setError("Fill all fields");

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
      } else setError("Invalid credentials");
    } catch {
      setError("Server error");
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (register.password !== register.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register)
      });

      const data = await res.json();

      if (data.error) setError(data.error);
      else setTab("login");
    } catch {
      setError("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">

      {/* 🌐 GRID BACKGROUND */}
      <div className="absolute inset-0 
        bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),
             linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]
        bg-[size:40px_40px]" />

      {/* 🌈 GRADIENT LAYER */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-purple-900 opacity-80" />

      {/* ✨ ORBS */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-indigo-500 opacity-20 blur-3xl rounded-full top-10 left-10"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-purple-500 opacity-20 blur-3xl rounded-full bottom-10 right-10"
      />

      {/* 🧊 CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-[380px] p-8 rounded-2xl
        bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
      >

        {/* TITLE */}
        <h2 className="text-center text-indigo-400 text-sm mb-6">
          {typing}
        </h2>

        {/* TABS */}
        <div className="relative flex bg-white/5 rounded-lg p-1 mb-6">
          <motion.div
            layout
            className="absolute top-1 bottom-1 w-1/2 bg-indigo-600 rounded-md"
            animate={{ left: tab === "login" ? "4px" : "50%" }}
          />

          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t as any);
                setError("");
              }}
              className="flex-1 z-10 text-sm py-2 text-white"
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* LOGIN */}
          {tab === "login" && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <InputField
                label="Email"
                value={login.email}
                onChange={(e: any) =>
                  setLogin({ ...login, email: e.target.value })
                }
              />

              <InputField
                label="Password"
                type="password"
                value={login.password}
                onChange={(e: any) =>
                  setLogin({ ...login, password: e.target.value })
                }
              />

              <button
                onClick={handleLogin}
                className="w-full mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.03] transition"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </motion.div>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <InputField label="Name" value={register.name}
                onChange={(e: any) => setRegister({ ...register, name: e.target.value })} />

              <InputField label="Email" value={register.email}
                onChange={(e: any) => setRegister({ ...register, email: e.target.value })} />

              <InputField label="Phone" value={register.phone}
                onChange={(e: any) => setRegister({ ...register, phone: e.target.value })} />

              <InputField label="Password" type="password"
                value={register.password}
                onChange={(e: any) => setRegister({ ...register, password: e.target.value })} />

              <InputField label="Confirm Password" type="password"
                value={register.confirmPassword}
                onChange={(e: any) => setRegister({ ...register, confirmPassword: e.target.value })} />

              <button
                onClick={handleRegister}
                className="w-full mt-3 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:scale-[1.03] transition"
              >
                {loading ? "Creating..." : "Register"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          PREPAI • Smart Preparation
        </p>

      </motion.div>
    </div>
  );
}