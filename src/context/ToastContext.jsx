import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../lib/utils.js";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description = "", tone = "info", duration = 4200 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((items) => [...items, { id, title, description, tone }].slice(-4));
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}

function ToastViewport({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-3">
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onRemove={() => onRemove(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "animate-soft-in rounded-lg border bg-[#13131F] p-4 text-sm shadow-lift",
        toast.tone === "success" && "border-emerald-400/30",
        toast.tone === "warning" && "border-amber-400/30",
        toast.tone === "info" && "border-white/10"
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            toast.tone === "success" && "text-emerald-400",
            toast.tone === "warning" && "text-amber-300",
            toast.tone === "info" && "text-blue-300"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-semibold text-slate-50">{toast.title}</p>
          {toast.description ? <p className="m-0 mt-1 text-slate-400">{toast.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
