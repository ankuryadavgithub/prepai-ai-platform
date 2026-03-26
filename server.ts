import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import testRoutes from "./server/routes/testRoutes.js";
import authRoutes from "./server/routes/authRoutes.js";
import codeRoutes from "./server/routes/codeRoutes.js";
import analyticsRoutes from "./server/routes/analytics.js";
import practiceRoutes from "./server/routes/practiceRoutes.js";
import { initDatabase } from "./server/db.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initDatabase();

  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/practice", practiceRoutes);
  app.use("/api/code", codeRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/test", testRoutes);

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
