import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateClaudeScript } from "./claude.js";
import { hasFootageApiKeys, searchStockFootage } from "./footage.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", requireAccessToken);

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    app: "FacelessForge",
    footageKeysConfigured: hasFootageApiKeys(),
    claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
});

app.get("/api/config", (_request, response) => {
  response.json({
    authRequired: Boolean(process.env.APP_ACCESS_TOKEN),
    services: {
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      footage: hasFootageApiKeys()
    }
  });
});

app.post("/api/auth/check", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/script", async (request, response, next) => {
  try {
    const settings = request.body?.settings;
    validateScriptSettings(settings);
    const script = await generateClaudeScript(settings);
    response.json(script);
  } catch (error) {
    next(error);
  }
});

app.get("/api/footage", async (request, response, next) => {
  try {
    const query = String(request.query.query || "");
    const page = Number(request.query.page || 1);
    if (!query.trim()) {
      response.status(400).json({ error: "Query is required." });
      return;
    }
    const results = await searchStockFootage(query, Number.isFinite(page) && page > 0 ? page : 1);
    response.json(results);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distDir));

app.use((_request, response) => {
  response.sendFile(path.join(distDir, "index.html"));
});

app.use((error, _request, response, _next) => {
  const status = Number(error.status || error.statusCode || 500);
  const publicMessage =
    status >= 500 ? "The server could not complete that request." : error.message || "Request failed.";
  console.error(error);
  response.status(status).json({
    error: publicMessage,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message
  });
});

app.listen(port, () => {
  console.log(`FacelessForge server running on http://localhost:${port}`);
});

function requireAccessToken(request, response, next) {
  const token = process.env.APP_ACCESS_TOKEN;
  if (!token || request.path === "/health" || request.path === "/config") {
    next();
    return;
  }

  const header = request.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const provided = bearer || request.get("x-facelessforge-token") || "";
  if (provided === token) {
    next();
    return;
  }

  response.status(401).json({ error: "Unauthorized." });
}

function validateScriptSettings(settings) {
  if (!settings || typeof settings !== "object") {
    throw Object.assign(new Error("Script settings are required."), { status: 400 });
  }

  if (!String(settings.topic || "").trim()) {
    throw Object.assign(new Error("Video topic is required."), { status: 400 });
  }
}
