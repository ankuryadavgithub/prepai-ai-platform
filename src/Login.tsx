// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function Login({ setUser }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleLogin = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const res = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await res.json();

//       if (data.token) {
//         localStorage.setItem("token", data.token);
//         setUser(data.user);
//       } else {
//         setError(data.error || "Invalid credentials");
//       }
//     } catch (err) {
//       setError("Server error. Try again.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">

//       {/* Animated Background Glow */}
//       <motion.div
//         animate={{ scale: [1, 1.2, 1] }}
//         transition={{ repeat: Infinity, duration: 8 }}
//         className="absolute w-[500px] h-[500px] bg-blue-500 opacity-20 rounded-full blur-3xl"
//       />

//       {/* Glass Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 80 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-[350px] z-10"
//       >

//         {/* Title */}
//         <motion.h2
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           className="text-2xl font-bold text-white text-center mb-6"
//         >
//           🔐 Secure Login
//         </motion.h2>

//         {/* Email Input */}
//         <div className="relative mb-5">
//           <input
//             type="email"
//             required
//             onChange={(e) => setEmail(e.target.value)}
//             className="peer w-full p-3 bg-transparent border border-gray-500 rounded-lg text-white focus:outline-none focus:border-blue-400"
//           />
//           <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-400 bg-black px-1">
//             Email
//           </label>
//         </div>

//         {/* Password Input */}
//         <div className="relative mb-5">
//           <input
//             type="password"
//             required
//             onChange={(e) => setPassword(e.target.value)}
//             className="peer w-full p-3 bg-transparent border border-gray-500 rounded-lg text-white focus:outline-none focus:border-blue-400"
//           />
//           <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-400 bg-black px-1">
//             Password
//           </label>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-red-400 text-sm mb-3"
//           >
//             {error}
//           </motion.p>
//         )}

//         {/* Login Button */}
//         <motion.button
//           whileTap={{ scale: 0.95 }}
//           whileHover={{ scale: 1.05 }}
//           onClick={handleLogin}
//           className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg"
//         >
//           {loading ? "Logging in..." : "Login"}
//         </motion.button>

//         {/* Footer */}
//         <p className="text-gray-400 text-xs text-center mt-4">
//           AI-Based Crime Prediction System
//         </p>
//       </motion.div>
//     </div>
//   );
// }