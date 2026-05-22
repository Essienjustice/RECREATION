import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Lock } from "lucide-react";
import {
  clearAccessToken,
  getAccessToken,
  getServerConfig,
  setAccessToken,
  verifyAccessToken
} from "../lib/apiClient.js";
import { Button, Card, Field, Input } from "../components/ui.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const nextConfig = await getServerConfig();
        if (!active) return;
        setConfig(nextConfig);
        setLocked(Boolean(nextConfig.authRequired && !getAccessToken()));
      } catch {
        if (active) {
          setConfig({ authRequired: false, services: {} });
          setLocked(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadConfig();

    function handleUnauthorized() {
      clearAccessToken();
      setLocked(true);
    }

    window.addEventListener("facelessforge:unauthorized", handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("facelessforge:unauthorized", handleUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({
      config,
      locked,
      unlock: async (token) => {
        await verifyAccessToken(token);
        setAccessToken(token);
        setLocked(false);
      },
      lock: () => {
        clearAccessToken();
        setLocked(true);
      }
    }),
    [config, locked]
  );

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0A0A0F] text-slate-300">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting FacelessForge
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {locked ? <AccessGate /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

function AccessGate() {
  const { unlock } = useAuth();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await unlock(token.trim());
    } catch {
      setError("That access code did not work.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#0A0A0F] px-4">
      <Card className="w-full max-w-md p-6">
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#2563EB]">
          <Lock className="h-5 w-5 text-white" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-white">FacelessForge is private</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter the access code you set as `APP_ACCESS_TOKEN` on your host.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label="Access Code">
            <Input
              type="password"
              autoFocus
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Your private access code"
            />
          </Field>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={!token.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Unlock
          </Button>
        </form>
      </Card>
    </div>
  );
}
