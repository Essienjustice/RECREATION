import { cn } from "../lib/utils.js";

export function Button({ variant = "primary", size = "md", className, children, ...props }) {
  const variants = {
    primary:
      "bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-primary hover:-translate-y-0.5 hover:shadow-lift",
    secondary:
      "border border-white/10 bg-white/[0.04] text-slate-100 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]",
    ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
    success:
      "border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:-translate-y-0.5 hover:bg-emerald-500/20",
    danger: "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/15"
  };
  const sizes = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-5 text-sm",
    lg: "min-h-12 px-6 text-sm",
    icon: "h-10 w-10 p-0"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, as: Component = "section" }) {
  return <Component className={cn("surface", className)}>{children}</Component>;
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-xs font-semibold uppercase text-slate-400">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn("input-shell", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn("input-shell min-h-[116px]", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn("input-shell appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Badge({ tone = "default", className, children }) {
  const tones = {
    default: "border-white/10 bg-white/[0.05] text-slate-300",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200"
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, className }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function SkeletonBlock({ className }) {
  return <div className={cn("skeleton", className)} />;
}
