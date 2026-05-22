import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, FolderKanban, Plus } from "lucide-react";
import { useProjects } from "../context/ProjectContext.jsx";
import { getProjectTitle, getResumeRoute, getSelectionStats, getStageLabel } from "../lib/project.js";
import { formatDateTime, formatDuration } from "../lib/utils.js";
import { Badge, Button, Card, ProgressBar } from "../components/ui.jsx";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject, setActiveProject } = useProjects();

  function startNewProject() {
    createProject();
    navigate("/write");
  }

  function continueProject(project) {
    setActiveProject(project.id);
    navigate(getResumeRoute(project));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="violet">Saved work</Badge>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Projects</h1>
          <p className="mt-2 text-sm text-slate-400">Local drafts are auto-saved in this browser. The newest 10 are kept.</p>
        </div>
        <Button type="button" onClick={startNewProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onContinue={() => continueProject(project)} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, onContinue }) {
  const stats = getSelectionStats(project);
  const progress = stats.total ? (stats.selected / stats.total) * 100 : 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.05] text-slate-300">
          <FolderKanban className="h-5 w-5" />
        </span>
        <Badge tone={project.stageReached === "export" ? "green" : project.stageReached === "footage" ? "blue" : "default"}>
          {getStageLabel(project)}
        </Badge>
      </div>
      <h2 className="mt-5 line-clamp-2 min-h-14 text-lg font-extrabold leading-7 text-white">{getProjectTitle(project)}</h2>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="h-4 w-4" />
        Created {formatDateTime(project.createdAt)}
      </div>

      <div className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.035] p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Footage</span>
          <span className="font-semibold text-white">
            {stats.selected}/{stats.total || 0}
          </span>
        </div>
        <ProgressBar value={progress} />
        <p className="mt-3 text-xs text-slate-500">
          {stats.total ? `${stats.total} scenes · ${formatDuration(stats.totalSeconds)}` : "Script not generated yet"}
        </p>
      </div>

      <Button type="button" className="mt-5 w-full" variant="secondary" onClick={onContinue}>
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}
