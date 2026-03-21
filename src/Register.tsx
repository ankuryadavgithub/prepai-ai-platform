// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function Register() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: ""
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const handleRegister = async () => {
//     setError("");
//     setSuccess("");

//     if (form.password !== form.confirmPassword) {
//       return setError("Passwords do not match");
//     }

//     setLoading(true);

//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify(form)
//       });

//       const data = await res.json();

//       if (data.error) {
//         setError(data.error);
//       } else {
//         setSuccess("Registered successfully! Please login.");
//       }
//     } catch (err) {
//       setError("Server error. Try again.");
//     }

//     setLoading(false);
//   };

//   const handleChange = (field: string, value: string) => {
//     setForm({ ...form, [field]: value });
//   };

//   return (
//     <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 overflow-hidden">

//       {/* Animated Glow */}
//       <motion.div
//         animate={{ scale: [1, 1.2, 1] }}
//         transition={{ repeat: Infinity, duration: 8 }}
//         className="absolute w-[500px] h-[500px] bg-purple-500 opacity-20 rounded-full blur-3xl"
//       />

//       {/* Glass Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 80 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//         className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-[380px] z-10"
//       >

//         {/* Title */}
//         <h2 className="text-2xl font-bold text-white text-center mb-6">
//           📝 Create Account
//         </h2>

//         {/* Input Fields */}
//         {[
//           { name: "name", label: "Full Name" },
//           { name: "email", label: "Email" },
//           { name: "phone", label: "Phone Number" }
//         ].map((field) => (
//           <div key={field.name} className="relative mb-4">
//             <input
//               type="text"
//               required
//               onChange={(e) => handleChange(field.name, e.target.value)}
//               className="peer w-full p-3 bg-transparent border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
//             />
//             <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-purple-400 bg-black px-1">
//               {field.label}
//             </label>
//           </div>
//         ))}

//         {/* Password */}
//         <div className="relative mb-4">
//           <input
//             type={showPassword ? "text" : "password"}
//             required
//             onChange={(e) => handleChange("password", e.target.value)}
//             className="peer w-full p-3 bg-transparent border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
//           />
//           <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-purple-400 bg-black px-1">
//             Password
//           </label>
//         </div>

//         {/* Confirm Password */}
//         <div className="relative mb-4">
//           <input
//             type={showPassword ? "text" : "password"}
//             required
//             onChange={(e) => handleChange("confirmPassword", e.target.value)}
//             className="peer w-full p-3 bg-transparent border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-400"
//           />
//           <label className="absolute left-3 top-3 text-gray-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-purple-400 bg-black px-1">
//             Confirm Password
//           </label>
//         </div>

//         {/* Show Password Toggle */}
//         <div className="flex items-center justify-between mb-3">
//           <label className="text-gray-400 text-sm">
//             <input
//               type="checkbox"
//               className="mr-2"
//               onChange={() => setShowPassword(!showPassword)}
//             />
//             Show Password
//           </label>
//         </div>

//         {/* Error */}
//         {error && (
//           <motion.p className="text-red-400 text-sm mb-2">
//             {error}
//           </motion.p>
//         )}

//         {/* Success */}
//         {success && (
//           <motion.p className="text-green-400 text-sm mb-2">
//             {success}
//           </motion.p>
//         )}

//         {/* Button */}
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={handleRegister}
//           className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg"
//         >
//           {loading ? "Creating Account..." : "Register"}
//         </motion.button>

//         {/* Footer */}
//         <p className="text-gray-400 text-xs text-center mt-4">
//           PREPAI
//         </p>
//       </motion.div>
//     </div>
//   );
// }