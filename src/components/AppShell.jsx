import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Download, FileText, Film, FolderKanban, Plus, Sparkles } from "lucide-react";
import { Button } from "./ui.jsx";
import { getProjectTitle, getSelectionStats } from "../lib/project.js";
import { cn } from "../lib/utils.js";
import { useProjects } from "../context/ProjectContext.jsx";

const navItems = [
  { to: "/write", label: "Script", icon: FileText },
  { to: "/footage", label: "Footage", icon: Film },
  { to: "/export", label: "Export", icon: Download },
  { to: "/projects", label: "Projects", icon: FolderKanban }
];

export function AppShell() {
  const navigate = useNavigate();
  const { currentProject, createProject } = useProjects();

  function handleNewProject() {
    createProject();
    navigate("/write");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0F]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/write" className="mr-auto flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#2563EB] shadow-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-extrabold text-white">FacelessForge</span>
              <span className="block max-w-[42vw] truncate text-xs text-slate-500">
                {getProjectTitle(currentProject)}
              </span>
            </span>
          </Link>

          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-white/[0.035] p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-semibold transition",
                      isActive ? "bg-white text-[#0A0A0F]" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <Button type="button" variant="secondary" size="sm" onClick={handleNewProject}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <PipelineProgress />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function PipelineProgress() {
  const location = useLocation();
  const { currentProject } = useProjects();
  const stats = getSelectionStats(currentProject);
  const active = location.pathname.includes("footage")
    ? "footage"
    : location.pathname.includes("export")
      ? "export"
      : "write";

  const steps = [
    { key: "write", label: "Script", complete: Boolean(currentProject?.script?.length) && active !== "write" },
    { key: "footage", label: "Footage", complete: stats.allSelected && active !== "footage" },
    { key: "export", label: "Export", complete: active === "export" && stats.allSelected }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
      {steps.map((step, index) => {
        const inProgress = step.key === active && !step.complete;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1.5",
                step.complete && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                inProgress && "border-blue-400/30 bg-blue-500/10 text-blue-100",
                !step.complete && !inProgress && "border-white/[0.08] bg-white/[0.03] text-slate-500"
              )}
            >
              {step.label} {step.complete ? "✓" : inProgress ? "(in progress)" : ""}
            </span>
            {index < steps.length - 1 ? <span className="text-slate-700">→</span> : null}
          </div>
        );
      })}
    </div>
  );
}
