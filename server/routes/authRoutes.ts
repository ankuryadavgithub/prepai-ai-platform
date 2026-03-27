import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/userModel.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();
const authRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 25, keyPrefix: "auth" });

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const { name, password, phone } = req.body;
    const email = normalizeEmail(req.body?.email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(String(name).trim(), email, hashed, typeof phone === "string" ? phone.trim() : "");

    res.json({ message: "Registered successfully", user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const { password: _password, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", verifyToken, async (req: any, res) => {
  try {
    const user = await findUserByEmail(normalizeEmail(req.user?.email));

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { password: _password, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
