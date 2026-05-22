import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, ExternalLink, FileArchive, FileText, Link2, Loader2 } from "lucide-react";
import { useProjects } from "../context/ProjectContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  buildEditingGuide,
  buildNarrationScript,
  buildYoutubeMetadata,
  downloadProjectZip
} from "../lib/exporters.js";
import { getProjectTitle, getSelectionStats } from "../lib/project.js";
import { copyToClipboard, formatDuration } from "../lib/utils.js";
import { Badge, Button, Card } from "../components/ui.jsx";

export function ExportPage() {
  const navigate = useNavigate();
  const { currentProject } = useProjects();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const stats = getSelectionStats(currentProject);

  const narration = useMemo(() => buildNarrationScript(currentProject), [currentProject]);
  const metadata = useMemo(() => buildYoutubeMetadata(currentProject), [currentProject]);
  const editingGuide = useMemo(() => buildEditingGuide(currentProject), [currentProject]);

  async function handleDownload() {
    if (!stats.allSelected) {
      toast({ title: "Select footage first", description: "The export package needs a footage URL for every scene.", tone: "warning" });
      return;
    }

    setDownloading(true);
    try {
      await downloadProjectZip(currentProject);
      toast({ title: "Export package downloaded", tone: "success" });
    } catch (error) {
      toast({ title: "Export failed", description: error.message || "Try again.", tone: "warning" });
    } finally {
      setDownloading(false);
    }
  }

  if (!currentProject.script.length) {
    return (
      <Card className="p-8">
        <Badge tone="blue">Stage 3</Badge>
        <h1 className="mt-4 text-2xl font-extrabold text-white">No project to export</h1>
        <p className="mt-2 text-sm text-slate-400">Generate a script and select footage before exporting.</p>
        <Button type="button" className="mt-6" onClick={() => navigate("/write")}>
          Go to Script Writer
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="violet">Stage 3</Badge>
            <h1 className="mt-4 text-2xl font-extrabold text-white">Export Package</h1>
            <p className="mt-2 text-sm text-slate-400">
              {getProjectTitle(currentProject)} · {currentProject.script.length} scenes · {formatDuration(stats.totalSeconds)}
            </p>
          </div>
          <Button type="button" size="lg" onClick={handleDownload} disabled={downloading || !stats.allSelected}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download ZIP
          </Button>
        </div>
        {!stats.allSelected ? (
          <div className="mt-5 rounded-lg border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            {stats.selected} of {stats.total} scenes have selected footage. Finish Stage 2 to enable ZIP export.
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <CopyPanel icon={FileText} title="Full Narration Script" value={narration} />
          <CopyPanel icon={FileArchive} title="YouTube Metadata" value={metadata} />
          <CopyPanel icon={FileText} title="Editing Guide Preview" value={editingGuide} />
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-32">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300">
              <Link2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-extrabold text-white">Footage links</h2>
              <p className="text-xs text-slate-500">Open direct files or source pages in a new tab.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {currentProject.script.map((scene) => (
              <div key={scene.id} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      Scene {scene.scene}: {scene.section}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{scene.selectedFootage?.provider || "No footage selected"}</p>
                  </div>
                  {scene.selectedFootage?.downloadUrl ? <Badge tone="green">Ready</Badge> : <Badge tone="amber">Missing</Badge>}
                </div>
                {scene.selectedFootage?.downloadUrl ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={scene.selectedFootage.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                    >
                      Download video
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {scene.selectedFootage.pageUrl ? (
                      <a
                        href={scene.selectedFootage.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
                      >
                        Source page
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CopyPanel({ icon: Icon, title, value }) {
  const { toast } = useToast();

  async function handleCopy() {
    await copyToClipboard(value);
    toast({ title: "Copied", description: title, tone: "success" });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-300">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="font-extrabold text-white">{title}</h2>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-5 text-sm leading-6 text-slate-300">{value}</pre>
    </Card>
  );
}
